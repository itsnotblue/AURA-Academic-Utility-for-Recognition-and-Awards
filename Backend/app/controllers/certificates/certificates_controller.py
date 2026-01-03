from pathlib import Path
import io, uuid, hashlib, re
from datetime import datetime
from typing import Dict, Any, List
from fastapi import HTTPException, UploadFile
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
from sentence_transformers import SentenceTransformer
from groq import Groq

from config.database import get_db

import os, json, uuid
from pathlib import Path
from pydantic_settings import BaseSettings

env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"

class ConfigSettings(BaseSettings):
    GROQ_API_KEY: str
    EMBEDDING_MODEL: str
    TESS_LANG: str 
    SUPABASE_BUCKET: str 

    class Config:
        env_file = str(env_path)
        extra = "ignore"

config_settings = ConfigSettings()

GROQ_API_KEY = config_settings.GROQ_API_KEY
EMBEDDING_MODEL = config_settings.EMBEDDING_MODEL
TESS_LANG = config_settings.TESS_LANG
SUPABASE_BUCKET = config_settings.SUPABASE_BUCKET

# Initialize services
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
embedding_model = SentenceTransformer(EMBEDDING_MODEL)

async def upload_certificate(file: UploadFile, student_id: str) -> Dict[str, Any]:
    # 1. Extract text from file
    raw_text = await extract_text_from_file(file)
    
    # 2. Clean OCR text
    cleaned_text = clean_ocr_text(raw_text)
    
    # 3. Generate SHA256 hash
    text_hash = sha256_text(cleaned_text)
    
    # 4. Check if already processed
    if await is_duplicate_certificate(text_hash):
        raise HTTPException(status_code=400, detail="Certificate already processed")
    
    # 5. Parse with Groq AI
    parsed_data = await groq_parse_certificate(cleaned_text)

    
    # 6. Upload file to Supabase storage
    evidence_url = await upload_to_supabase_storage(file)
    
    # 7. Save initial data to database (status: processed)
    certificate_data = {
        "id": str(uuid.uuid4()),
        "document_id": text_hash,
        "student_id": student_id,
        "evidence_url": evidence_url,
        "raw_text_sha256": text_hash,
        "parsed": parsed_data,
        "confidence_extraction": parsed_data.get("confidence", 0.8),
        "status": "processed", 
    }
    
    await save_certificate_to_db(certificate_data)
    
    return {
        "document_id": text_hash,
        "parsed": parsed_data,
    }

async def complete_certificate(request: Dict[str, Any]) -> Dict[str, Any]:
    
    document_id = request["document_id"]
    parsed_data = request["parsed"]  # User-modified parsed data
    
    # Get the existing certificate data
    db = get_db()
    existing_cert = db.table("certificates")\
        .select("*")\
        .eq("document_id", document_id)\
        .execute()
    
    if not existing_cert.data:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    existing_data = existing_cert.data[0]
    
    # 1. Normalize and calculate SPU
    normalized_data = normalize_parsed_data(parsed_data)
    spu_score = compute_spu_score(normalized_data, parsed_data)
    
    # 2. Generate embedding from raw text
    embedding = make_embedding(existing_data["raw_text_sha256"])
    
    # 3. Update certificate with complete data (leave specified fields untouched)
    update_data = {
        "parsed": parsed_data,
        "embedding": embedding,
        "before_normalized": {
            "rank_raw": parsed_data["rank_raw"],
            "level_raw": parsed_data["level_raw"],
            "category_raw": parsed_data["category_raw"]
        },
        "after_normalized": {
            "rank_norm": normalized_data.get("rank_norm", 0),
            "spu_score": spu_score,
            "level_norm": normalized_data.get("level_norm", 0),
            "category_norm": normalized_data.get("category_norm", 0)
        }
        # Note: normalized, confidence_extraction, status, event_category, updated_at are left untouched
    }
    
    # 4. Update the database
    db.table("certificates")\
        .update(update_data)\
        .eq("document_id", document_id)\
        .execute()
    
    return {
        "document_id": document_id,
        "parsed": update_data["parsed"],
        "before_normalized": update_data["before_normalized"],
        "after_normalized": update_data["after_normalized"],
    }

async def extract_text_from_file(file: UploadFile) -> str:
    """Extract text from PDF or image using OCR"""
    await file.seek(0)
    content = await file.read()
    
    if file.filename.endswith('.pdf'):
        # Save temporarily and convert PDF to images
        with open("temp.pdf", "wb") as f:
            f.write(content)
        images = convert_from_path("temp.pdf")
        os.remove("temp.pdf")
        
        text = ""
        for img in images:
            text += pytesseract.image_to_string(img, lang=TESS_LANG)
        return text
    
    else:
        # Handle image files
        image = Image.open(io.BytesIO(content))
        return pytesseract.image_to_string(image, lang=TESS_LANG)

def clean_ocr_text(raw_text: str) -> str:
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', raw_text).strip()
    # Remove common OCR artifacts
    text = re.sub(r'[^\w\s.,!?\-\d]', '', text)
    return text

def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()

async def is_duplicate_certificate(text_hash: str) -> bool:
    db = get_db()
    result = db.table("certificates").select("id").eq("raw_text_sha256", text_hash).execute()
    return len(result.data) > 0

async def groq_parse_certificate(raw_text: str, use_fallback: bool = True) -> Dict[str, Any]:
    """Parse certificate using Groq API with fallback to regex"""
    if not groq_client:
        if use_fallback:
            return regex_parse_certificate(raw_text)
        raise HTTPException(status_code=500, detail="Groq API not configured")
    
    prompt = f"""
Extract structured information from this certificate text.

IMPORTANT:
- rank_raw MUST be one of: Juara 1, Juara 2, Juara 3, Finalis, Peserta
- level_raw MUST be one of: Internasional, Nasional, Provinsi, Kota
- category_raw MUST be one of: Akademik, Non-Akademik

Return ONLY valid JSON without any markdown formatting or extra text.

Required fields:
- nama_mahasiswa (student name)
- event_name (event/competition name)
- rank_raw (achievement: Juara 1/2/3, Finalis, Peserta, etc.)
- level_raw (level: Internasional, Nasional, Provinsi, Kota)
- date_issued (date in any format found)
- category_raw (Akademik or Non-Akademik)
- domain_raw (field/domain: AI, Sains, Teknologi, Bisnis, etc.)
- confidence (0.0-1.0, your confidence in the extraction)

Certificate text:
\"\"\"{raw_text[:2000]}\"\"\"

Respond with JSON only:
"""
    
    try:
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.0,
            max_tokens=1200,
            timeout=30
        )
        
        content = response.choices[0].message.content.strip()
        content = re.sub(r'^```json\\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        parsed = json.loads(content.strip())

        required_fields = ["nama_mahasiswa", "event_name", "rank_raw", "level_raw"]
        for field in required_fields:
            if field not in parsed or not parsed[field]:
                parsed[field] = "Unknown"

        if "confidence" not in parsed:
            parsed["confidence"] = 0.7

        return parsed
    
    except Exception as e:
        if use_fallback:
            return regex_parse_certificate(raw_text)
        raise HTTPException(status_code=500, detail=f"Error parsing certificate: {str(e)}")

def normalize_parsed_data(parsed: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "rank_norm": norm_rank(parsed.get("rank_raw", "")),
        "level_norm": norm_level(parsed.get("level_raw", "")),
        "category_norm": norm_category(parsed.get("category_raw", ""))
    }

def regex_parse_certificate(raw_text: str) -> Dict[str, Any]:
    parsed = {
        "nama_mahasiswa": "Nama Tidak Terbaca",
        "event_name": "Unknown Event",
        "rank_raw": "Unknown",
        "level_raw": "Unknown",
        "date_issued": None,
        "category_raw": "Unknown",
        "domain_raw": "Unknown",
        "confidence": 0.5
    }

    text = raw_text.lower()

    # Extract student name
    nama_patterns = [
        r"(?:nama|name)[:\\s-]*([A-Z][a-zA-Z\\s]{5,50})",
        r"(?:diberikan kepada|presented to|awarded to)[:\\s-]*([A-Z][a-zA-Z\\s]{5,50})"
    ]
    for pattern in nama_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            parsed["nama_mahasiswa"] = match.group(1).strip()
            break

    # Extract rank
    if re.search(r"\\b(juara\\s*1|juara\\s*pertama|1st|first|champion|gold)\\b", text):
        parsed["rank_raw"] = "Juara 1"
    elif re.search(r"\\b(juara\\s*2|juara\\s*kedua|2nd|second|silver)\\b", text):
        parsed["rank_raw"] = "Juara 2"
    elif re.search(r"\\b(juara\\s*3|juara\\s*ketiga|3rd|third|bronze)\\b", text):
        parsed["rank_raw"] = "Juara 3"

    # Extract level
    if re.search(r"\\b(international|internasional)\\b", text):
        parsed["level_raw"] = "Internasional"
    elif re.search(r"\\b(nasional|national)\\b", text):
        parsed["level_raw"] = "Nasional"

    return parsed

def compute_spu_score(normalized: Dict[str, Any], parsed: Dict[str, Any]) -> float:
    base_score = (
        (normalized.get("rank_norm", 0) / 5) * 0.4 +
        (normalized.get("level_norm", 0) / 5) * 0.35 +
        (normalized.get("category_norm", 0) / 2) * 0.15
    )

    confidence = float(parsed.get("confidence", 0.7))
    confidence_factor = 0.9 + (confidence * 0.2)

    domain = str(parsed.get("domain_raw", "")).lower()
    domain_bonus = 0.05 if domain in [
        "ai", "teknologi", "sains", "engineering"
    ] else 0.0

    final_score = (base_score * confidence_factor) + domain_bonus
    return round(min(final_score, 1.0), 4)

def make_embedding(text: str) -> List[float]:
    return embedding_model.encode(text).tolist()

async def upload_to_supabase_storage(file: UploadFile) -> str:
    db = get_db()
    await file.seek(0)
    file_content = await file.read()

    ext = os.path.splitext(file.filename)[1]
    date = datetime.utcnow().strftime('%Y%m%d')
    remote_path = f"uploads/{date}_{uuid.uuid4().hex}{ext}"
    
    result = db.storage.from_(SUPABASE_BUCKET).upload(remote_path, file_content)
    public_url = db.storage.from_(SUPABASE_BUCKET).get_public_url(remote_path)
    
    return public_url if isinstance(public_url, str) else public_url.get("publicURL", public_url)


async def save_certificate_to_db(certificate_data: Dict[str, Any]) -> None:
    db = get_db()
    db.table("certificates").insert(certificate_data).execute()

async def update_certificate_to_db(certificate_data: Dict[str, Any]) -> None:
    db = get_db()
    db.table("certificates").update(certificate_data).eq("document_id", certificate_data["document_id"]).execute()

def norm_rank(rank: str) -> int:
    s = str(rank).lower()
    if re.search(r"(juara\\s*(1|i\\b)|1st|first|champion|gold|emas)", s):
        return 5
    if re.search(r"(juara\\s*(2|ii\\b)|2nd|second|silver|perak)", s):
        return 4
    if re.search(r"(juara\\s*(3|iii\\b)|3rd|third|bronze|perunggu)", s):
        return 3
    if "final" in s:
        return 2
    return 1

def norm_level(level: str) -> int:
    s = str(level).lower()
    if "internasional" in s or "international" in s:
        return 5
    if "nasional" in s:
        return 4
    if "provinsi" in s:
        return 3
    if "kota" in s or "kabupaten" in s:
        return 2
    return 1

def norm_category(category: str) -> int:
    s = str(category).lower()
    if "akademik" in s:
        return 2
    return 1

def normalize_parsed_data(parsed: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "rank_norm": norm_rank(parsed.get("rank_raw", "")),
        "level_norm": norm_level(parsed.get("level_raw", "")),
        "category_norm": norm_category(parsed.get("category_raw", ""))
    }

async def save_certificate_to_db(certificate_data: Dict[str, Any]) -> None:
    db = get_db()
    db.table("certificates").insert(certificate_data).execute()