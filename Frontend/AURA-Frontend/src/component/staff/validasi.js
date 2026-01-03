import { notification } from "../notification.js";

export function createValidationModal() {
  if (document.getElementById("validation-modal")) return;

  const modalHtml = `
    <div id="validation-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Detail Prestasi</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="details-grid" id="modal-details">
                    <!-- Details will be injected here -->
                </div>
                <div class="evidence-viewer">
                    <h4>Bukti Prestasi</h4>
                    <div class="image-container">
                        <img id="evidence-image" src="" alt="Bukti Prestasi" />
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="btn-validate" class="btn-validate">Validasi</button>
            </div>
        </div>
    </div>
    <style>
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            border-radius: 12px;
            width: 800px; /* Wider for 2 columns */
            max-width: 95%;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            font-family: "Poppins", sans-serif;
            max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .modal-header h3 {
            font-size: 18px;
            font-weight: 600;
            color: #101828;
            margin: 0;
        }
        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #667085;
        }
        .modal-body {
            margin-bottom: 24px;
        }
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
        }
        .detail-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .detail-label {
            font-size: 12px;
            color: #667085;
            font-weight: 500;
        }
        .detail-value {
            font-size: 14px;
            color: #101828;
            font-weight: 500;
        }
        .evidence-viewer h4 {
            font-size: 14px;
            font-weight: 600;
            color: #101828;
            margin-bottom: 8px;
        }
        .image-container {
            width: 100%;
            border: 1px solid #D0D5DD;
            border-radius: 8px;
            overflow: hidden;
            background: #F9FAFB;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
        }
        .image-container img {
            max-width: 100%;
            max-height: 400px;
            object-fit: contain;
        }
        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        .btn-cancel, .btn-validate {
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border: none;
        }
        .btn-cancel {
            background: white;
            border: 1px solid #D0D5DD;
            color: #344054;
        }
        .btn-validate {
            background: #EC1D25;
            color: white;
        }
        .btn-validate:hover {
            background: #861015;
        }
    </style>
    `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Event listeners
  const modal = document.getElementById("validation-modal");
  const closeBtn = modal.querySelector(".close-btn");

  const closeModal = () => {
    modal.style.display = "none";
  };

  closeBtn.addEventListener("click", closeModal);

  // Close on click outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

export function showValidationModal(data) {
  createValidationModal();
  const modal = document.getElementById("validation-modal");
  const body = document.getElementById("modal-details");
  const imgViewer = document.getElementById("evidence-image");
  const validateBtn = document.getElementById("btn-validate");

  body.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Nama Mahasiswa</span>
            <span class="detail-value">${data.nama_mahasiswa || "-"}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">NIM</span>
            <span class="detail-value">${data.nim || "-"}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Fakultas / Prodi</span>
            <span class="detail-value">${data.fakultas || "-"} / ${
    data.prodi || "-"
  }</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Nama Kegiatan</span>
            <span class="detail-value">${data.event_name || "-"}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Kategori</span>
            <span class="detail-value">${data.category || "-"}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Tingkat</span>
            <span class="detail-value">${data.tingkat || "-"}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Tanggal</span>
            <span class="detail-value">${data.created_at || "-"}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">SPU Score</span>
            <span class="detail-value">${
              data.spu_score ? parseFloat(data.spu_score).toFixed(2) : "-"
            }</span>
        </div>
    `;

  if (data.evidence_url) {
    imgViewer.src = data.evidence_url;
    imgViewer.style.display = "block";
  } else {
    imgViewer.style.display = "none";
    imgViewer.parentElement.innerHTML =
      '<p style="text-align:center; padding: 20px; color: #667085;">Tidak ada bukti gambar.</p>';
  }

  if (data.status === "validated") {
    validateBtn.style.display = "none";
  } else {
    validateBtn.style.display = "block";

    // Handle validate action
    validateBtn.onclick = async () => {
      try {
        validateBtn.disabled = true;
        validateBtn.textContent = "Validating...";

        const response = await fetch(`/api/v1/staff/validate/${data.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          notification.show("Berhasil", "Prestasi berhasil divalidasi.", {
            type: "success",
          });
          modal.style.display = "none";
          setTimeout(() => window.location.reload(), 1000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to validate prestasi");
        }
      } catch (error) {
        console.error("Error validating prestasi:", error);
        notification.show("Gagal", error.message, { type: "error" });
      } finally {
        validateBtn.disabled = false;
        validateBtn.textContent = "Validasi";
      }
    };
  }

  modal.style.display = "flex";
}
