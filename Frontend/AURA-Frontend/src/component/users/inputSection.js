import { authAPI } from "../../api/auth.js";
import { notification } from "../notification.js";

let state = {
  step: 1,
  file: null,
  uploadResponse: null,
};

export function getInputSectionComponent() {
  return `
    <div id="input-section-container">
      <!-- Step 1: Upload & Initial Info -->
      <div id="step-1-container">
        <!-- Section 1: Informasi Mahasiswa -->
        <div class="form-section">
          <h2 class="form-section-title">Informasi Mahasiswa</h2>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="nama">Nama</label>
              <input type="text" id="nama" class="form-input" disabled />
            </div>
            <div class="form-group">
              <label class="form-label" for="nim">NIM</label>
              <input type="text" id="nim" class="form-input" disabled />
            </div>
          </div>
        </div>

        <!-- Section 2: Upload Dokumen -->
        <div class="form-section">
          <h2 class="form-section-title">Unggah Sertifikat</h2>
          <div class="form-group full-width">
            <input type="file" id="file-input" accept="application/pdf, image/png, image/jpeg, image/jpg" style="display: none;" />
            <div class="upload-area" id="drop-zone">
              <div class="upload-icon">
                <img src="/assets/unggah.png" alt="Upload" />
              </div>
              <div class="upload-text">
                <strong>Klik untuk unggah</strong> atau seret dan lepas dokumen
              </div>
            </div>
            <div id="file-info" style="display: none; margin-top: 12px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534;">
               <div style="display: flex; align-items: center; gap: 8px;">
                  <span>📄</span>
                  <span id="file-name" style="font-weight: 500;"></span>
               </div>
            </div>
          </div>
        </div>

        <!-- Actions Step 1 -->
        <div class="form-actions">
          <button type="button" id="btn-upload" class="btn btn-primary" disabled>
            Upload
          </button>
          <button type="button" id="btn-cancel" class="btn btn-secondary" style="display: none;">
            Cancel
          </button>
        </div>
      </div>

      <!-- Step 2: Data Completion (Hidden Initially) -->
      <div id="step-2-container" style="display: none;">
        <div class="form-section">
          <h2 class="form-section-title">Konfirmasi Data Prestasi</h2>
          <p style="margin-bottom: 20px; color: var(--text-light); font-size: 14px;">
            Silakan periksa dan lengkapi data berikut hasil ekstraksi AI.
          </p>
          
          <div class="form-grid">
            <!-- Event Name -->
            <div class="form-group full-width">
              <label class="form-label" for="input-event-name">Nama Kegiatan</label>
              <input type="text" id="input-event-name" class="form-input" />
            </div>

            <!-- Rank -->
            <div class="form-group">
              <label class="form-label" for="input-rank">Juara / Peringkat</label>
              <input type="text" id="input-rank" class="form-input" />
            </div>

            <!-- Level -->
            <div class="form-group">
              <label class="form-label" for="input-level">Tingkat</label>
              <input type="text" id="input-level" class="form-input" />
            </div>

            <!-- Date -->
            <div class="form-group">
              <label class="form-label" for="input-date">Tanggal</label>
              <input type="date" id="input-date" class="form-input" />
            </div>

            <!-- Category -->
            <div class="form-group">
              <label class="form-label" for="input-category">Kategori</label>
              <input type="text" id="input-category" class="form-input" />
            </div>

            <!-- Domain -->
            <div class="form-group">
              <label class="form-label" for="input-domain">Domain / Bidang</label>
              <input type="text" id="input-domain" class="form-input" />
            </div>
          </div>
        </div>

        <!-- Actions Step 2 -->
        <div class="form-actions">
          <button type="button" id="btn-submit-final" class="btn btn-primary">
            Submit Data
          </button>
          <button type="button" id="btn-back" class="btn btn-secondary">
            Kembali
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initInputSectionComponent() {
  const container = document.getElementById("input-section-container");
  if (!container) return;

  // Step 1 Elements
  const namaInput = document.getElementById("nama");
  const nimInput = document.getElementById("nim");
  const fileInput = document.getElementById("file-input");
  const dropZone = document.getElementById("drop-zone");
  const fileInfo = document.getElementById("file-info");
  const fileNameDisplay = document.getElementById("file-name");
  const btnUpload = document.getElementById("btn-upload");
  const btnCancel = document.getElementById("btn-cancel");

  // Step 2 Elements
  const step1Container = document.getElementById("step-1-container");
  const step2Container = document.getElementById("step-2-container");
  const inputEventName = document.getElementById("input-event-name");
  const inputRank = document.getElementById("input-rank");
  const inputLevel = document.getElementById("input-level");
  const inputDate = document.getElementById("input-date");
  const inputCategory = document.getElementById("input-category");
  const inputDomain = document.getElementById("input-domain");
  const btnSubmitFinal = document.getElementById("btn-submit-final");
  const btnBack = document.getElementById("btn-back");

  // Load User Identity
  try {
    const userIdentity = JSON.parse(localStorage.getItem("userIdentity"));
    if (userIdentity) {
      namaInput.value = userIdentity.nama || "-";
      nimInput.value = userIdentity.nim || "-";
    }
  } catch (e) {
    console.error("Error loading user identity", e);
  }

  // File Handling Logic
  const handleFile = (file) => {
    const validTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (file && validTypes.includes(file.type)) {
      state.file = file;
      fileNameDisplay.textContent = file.name;
      fileInfo.style.display = "block";
      btnUpload.disabled = false;
      btnCancel.style.display = "inline-flex";
    } else {
      notification.show("Error", "Please upload a PDF or Image file (PNG, JPG).", { type: "error" });
    }
  };

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--accent)";
    dropZone.style.background = "#fff5f5";
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--border-light)";
    dropZone.style.background = "var(--panel)";
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--border-light)";
    dropZone.style.background = "var(--panel)";
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  });

  btnCancel.addEventListener("click", () => {
    state.file = null;
    fileInput.value = "";
    fileInfo.style.display = "none";
    btnUpload.disabled = true;
    btnCancel.style.display = "none";
  });

  // Step 1: Upload Action
  btnUpload.addEventListener("click", async () => {
    if (!state.file) return;

    btnUpload.textContent = "Uploading...";
    btnUpload.disabled = true;

    try {
      const userId = "8ae7d470-37af-413d-9a79-3ec90eb40a5c"; // dummy nanti ganti
      const formData = new FormData();
      formData.append("file", state.file);
      formData.append("user_id", userId);

      // Using fetch manually to handle FormData content-type correctly
      // authAPI adds 'Content-Type': 'application/json' which breaks FormData
      //   const token = localStorage.getItem("aura_access_token"); // Assuming key from auth.js

      const response = await fetch(
        `${
          import.meta.env.DEV_BACKEND_URL || "/api/v1"
        }/users/certificates/upload`,
        {
          method: "POST",
          //   headers: {
          //     Authorization: `Bearer ${token}`,
          //   },
          body: formData,
          userId,
        }
      );

      const result = await response.json();

      if (response.ok && result.status_code === 200) {
        state.uploadResponse = result.data;
        populateStep2(result.data.parsed);
        goToStep(2);
        notification.show("Success", "Certificate uploaded and parsed successfully", { type: "success" });
      } else {
        notification.show("Upload Failed", result.message || "Unknown error", { type: "error" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      notification.show("Error", "An error occurred during upload.", { type: "error" });
    } finally {
      btnUpload.textContent = "Upload";
      btnUpload.disabled = false;
    }
  });

  // Step 2 Logic
  function populateStep2(data) {
    inputEventName.value = data.event_name || "";
    inputRank.value = data.rank_raw || "";
    inputLevel.value = data.level_raw || "";

    // Set date to today (yyyy-mm-dd)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    inputDate.value = `${yyyy}-${mm}-${dd}`;

    inputCategory.value = data.category_raw || "";
    inputDomain.value = data.domain_raw || "";
  }

  function goToStep(step) {
    state.step = step;
    if (step === 1) {
      step1Container.style.display = "block";
      step2Container.style.display = "none";
    } else {
      step1Container.style.display = "none";
      step2Container.style.display = "block";
    }
  }

  btnBack.addEventListener("click", () => {
    goToStep(1);
  });

  // Step 2: Final Submit
  btnSubmitFinal.addEventListener("click", async () => {
    if (!state.uploadResponse) return;

    btnSubmitFinal.textContent = "Submitting...";
    btnSubmitFinal.disabled = true;

    try {
      // Convert input date (yyyy-mm-dd) to dd-mm-yyyy for backend
      let formattedDate = inputDate.value;
      if (formattedDate && formattedDate.includes("-")) {
        const [year, month, day] = formattedDate.split("-");
        formattedDate = `${day}-${month}-${year}`;
      }

      const payload = {
        document_id: state.uploadResponse.document_id,
        parsed: {
          nama_mahasiswa: localStorage.getItem("userIdentity").nama,
          event_name: inputEventName.value,
          rank_raw: inputRank.value,
          level_raw: inputLevel.value,
          date_issued: formattedDate,
          category_raw: inputCategory.value,
          domain_raw: inputDomain.value,
          confidence: state.uploadResponse.parsed.confidence,
        },
      };

      const response = await authAPI.apiRequest("/users/certificates/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.success) {
        notification.show("Success", "Data submitted successfully!", { type: "success" });
        // Reset form
        goToStep(1);
        btnCancel.click(); // Clear file
        
        // Go back to history tab
        const historyTab = document.querySelector('.tab-btn[data-tab="history"]');
        if (historyTab) historyTab.click();
      } else {
        notification.show("Submission Failed", response.message, { type: "error" });
      }
    } catch (error) {
      console.error("Submission error:", error);
      notification.show("Error", "An error occurred during submission.", { type: "error" });
    } finally {
      btnSubmitFinal.textContent = "Submit Data";
      btnSubmitFinal.disabled = false;
    }
  });
}
