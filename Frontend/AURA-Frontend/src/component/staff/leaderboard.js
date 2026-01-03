export class Leaderboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.state = {
      data: [],
      currentPage: 1,
      pageSize: 10,
      searchTerm: "",
      viewMode: "leaderboard", // 'leaderboard' or 'search'
    };
  }

  async init() {
    this.renderStructure();
    this.attachControlListeners();
    this.renderLoading();

    await this.loadData();
  }

  async loadData() {
    try {
      this.renderLoading();

      let url = "/api/v1/staff/leaderboard?limit=100"; // Fetch top 100 for leaderboard
      this.state.viewMode = "leaderboard";

      if (this.state.searchTerm) {
        url = `/api/v1/staff/search?query=${encodeURIComponent(
          this.state.searchTerm
        )}&limit=50`;
        this.state.viewMode = "search";
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status_code === 200) {
        this.state.data = result.data;
        this.renderTable();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      const tbody = this.container.querySelector("tbody");
      if (tbody) {
        tbody.innerHTML = `<tr class="no-hover"><td colspan="6" style="text-align:center; color:red; padding: 20px;">Gagal memuat data: ${error.message}</td></tr>`;
      }
    }
  }

  renderStructure() {
    this.container.innerHTML = `
      <!-- Table Controls -->
      <div class="table-controls">
        <div class="show-entries">
          <label for="show-entries">Show</label>
          <select id="show-entries">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span>data</span>
        </div>
        <div class="search-box">
          <input type="text" id="search-input" placeholder="Filter peringkat (misal: 'essay')..." />
          <button id="search-btn" class="btn-search">Cari</button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="data-table-container">
        <table class="data-table">
          <thead id="table-head">
            <!-- Dynamic Headers -->
          </thead>
          <tbody id="leaderboard-table-body">
            <!-- Data will be injected here -->
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" id="pagination-controls"></div>
      
      <!-- Detail Modal -->
      <div id="detail-modal" class="modal-overlay" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-student-name">Detail Sertifikat</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <table class="modal-table">
                    <thead>
                        <tr>
                            <th>Kegiatan</th>
                            <th>Kategori</th>
                            <th>Tingkat</th>
                            <th>Keahlian</th>
                            <th>Relevansi</th>
                            <th>SPU</th>
                            <th>Skor Akhir</th>
                        </tr>
                    </thead>
                    <tbody id="modal-matches-body"></tbody>
                </table>
            </div>
        </div>
      </div>
      
      <style>
        .table-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .show-entries {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-dark);
        }
        .show-entries select {
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 14px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search-box input {
          width: 300px;
          padding: 8px 16px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
          font-family: "Inter", sans-serif;
        }
        .btn-search {
            padding: 8px 16px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        .btn-search:hover {
            background: var(--accent-dark);
        }

        .data-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
          border: 1px solid var(--border);
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-family: "Inter", sans-serif;
          font-size: 14px;
        }
        .data-table thead {
          background: var(--accent);
          color: white;
        }
        .data-table th {
          padding: 12px 24px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
        }
        .data-table th:last-child {
          border-right: none;
        }
        .data-table td {
          padding: 16px 24px;
          color: var(--text-dark);
          border-bottom: 1px solid var(--border);
        }
        .data-table tbody tr:hover:not(.no-hover) {
          background: #f9fafb;
          transition: background-color 0.2s ease;
        }
        .data-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        /* Pagination Styles */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
        }
        .pagination-btn {
          padding: 8px 12px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 14px;
          color: var(--text-dark);
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: "Work Sans", sans-serif;
        }
        .pagination-btn:hover:not(:disabled) {
          background: var(--panel);
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination-btn.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
        
        .rank-badge {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 700;
        }
        .rank-badge img {
            width: 30px;
            height: 30px;
        }
        .rank-badge.gold { background: transparent; color: #a88600; }
        .rank-badge.silver { background: transparent; color: #727272; }
        .rank-badge.bronze { background: transparent; color: #70533d; }
        .rank-badge.other { background: transparent; color: black; }
        border-radius: 50%;
            background: #f1f5f9;
            color: #475569;
        }
        .rank-1 { background: #FEF3C7; color: #D97706; }
        .rank-2 { background: #F3F4F6; color: #4B5563; }
        .rank-3 { background: #FFEDD5; color: #C2410C; }
        
        .score-val { font-weight: 600; color: var(--accent); }

        .btn-detail {
            padding: 6px 12px;
            background: white;
            color: var(--accent);
            border: 1px solid var(--accent);
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s ease;
            font-family: "Inter", sans-serif;
        }
        .btn-detail:hover {
            background: var(--accent);
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Modal Styles */
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
            width: 800px;
            max-width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            animation: fadeIn 0.2s ease;
        }
        .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-header h3 { font-size: 18px; font-weight: 600; }
        .close-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--text-light);
        }
        .modal-body { padding: 20px 24px; }
        .modal-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        .modal-table th {
            text-align: left;
            padding: 10px;
            background: #f9fafb;
            font-weight: 600;
            border-bottom: 1px solid var(--border);
        }
        .modal-table td {
            padding: 10px;
            border-bottom: 1px solid var(--border);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;
  }

  attachControlListeners() {
    const showEntriesSelect = this.container.querySelector("#show-entries");
    const searchInput = this.container.querySelector("#search-input");
    const searchBtn = this.container.querySelector("#search-btn");
    const modal = this.container.querySelector("#detail-modal");
    const closeModalBtn = this.container.querySelector(".close-modal");

    if (modal) {
      closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
        }
      });
    }

    showEntriesSelect.addEventListener("change", (e) => {
      this.state.pageSize = parseInt(e.target.value);
      this.state.currentPage = 1;
      this.renderTable();
    });

    const handleSearch = () => {
      const query = searchInput.value.trim();
      // If query is empty, it reverts to leaderboard view (empty query logic in loadData)
      this.state.searchTerm = query;
      this.state.currentPage = 1;
      this.loadData();
    };

    searchBtn.addEventListener("click", handleSearch);

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });

    // Optional: Auto-search on clear
    searchInput.addEventListener("input", (e) => {
      if (e.target.value === "") {
        this.state.searchTerm = "";
        this.state.currentPage = 1;
        this.loadData();
      }
    });
  }

  renderLoading() {
    const tbody = this.container.querySelector("#leaderboard-table-body");
    tbody.innerHTML =
      '<tr class="no-hover"><td colspan="6" style="text-align:center; padding: 20px;">Memuat data...</td></tr>';
  }

  renderTable() {
    const thead = this.container.querySelector("#table-head");
    const tbody = this.container.querySelector("#leaderboard-table-body");

    // Set Headers based on View Mode
    if (this.state.viewMode === "leaderboard") {
      thead.innerHTML = `
            <tr>
              <th>Rank</th>
              <th>Nama Mahasiswa</th>
              <th>NIM</th>
              <th>Total Skor</th>
              <th>Jumlah Sertifikat</th>
            </tr>
        `;
    } else {
      thead.innerHTML = `
            <tr>
              <th>Rank</th>
              <th>Nama Mahasiswa</th>
              <th>NIM</th>
              <th>Skor Akhir</th>
              <th>Aksi</th>
            </tr>
        `;
    }

    // Client-side pagination logic
    const totalItems = this.state.data.length;
    const totalPages = Math.ceil(totalItems / this.state.pageSize);

    if (this.state.currentPage > totalPages)
      this.state.currentPage = totalPages || 1;
    if (this.state.currentPage < 1) this.state.currentPage = 1;

    const start = (this.state.currentPage - 1) * this.state.pageSize;
    const end = start + this.state.pageSize;
    const pageData = this.state.data.slice(start, end);

    if (pageData.length === 0) {
      const colSpan = this.state.viewMode === "leaderboard" ? 5 : 6;
      tbody.innerHTML = `<tr class="no-hover"><td colspan="${colSpan}" style="text-align:center; padding: 20px;">Tidak ada data ditemukan.</td></tr>`;
    } else {
      tbody.innerHTML = pageData
        .map((item, index) => {
          if (this.state.viewMode === "leaderboard") {
            const rank = start + index + 1;
            let badgeHtml = "";

            if (rank === 1)
              badgeHtml = `<div class="rank-badge gold"><img src="/assets/no1.png" alt="Rank 1" /></div>`;
            else if (rank === 2)
              badgeHtml = `<div class="rank-badge silver"><img src="/assets/no2.png" alt="Rank 2" /></div>`;
            else if (rank === 3)
              badgeHtml = `<div class="rank-badge bronze"><img src="/assets/no3.png" alt="Rank 3" /></div>`;
            else badgeHtml = `<div class="rank-badge other">${rank}</div>`;

            return `
                  <tr>
                      <td>${badgeHtml}</td>
                      <td>${item.nama_mahasiswa || "-"}</td>
                      <td>${item.nim || "-"}</td>
                      <td class="score-val">${
                        item.weighted_score !== undefined
                          ? (
                              (item.weighted_score / item.certificate_count) *
                              100
                            ).toFixed(2)
                          : item.total_spu
                      }</td>
                      <td>${item.certificate_count}</td>
                  </tr>
                `;
          } else {
            // Search View (Grouped by Student)
            return `
                  <tr>
                      <td>${start + index + 1}</td>
                      <td>${item.student_name || "-"}</td>
                      <td>${item.student_nim || "-"}</td>
                      <td class="score-val">${item.weighted_sum.toFixed(2)}</td>
                      <td>
                        <button class="btn-detail show-details-btn" data-index="${
                          start + index
                        }">Lihat Detail</button>
                      </td>
                  </tr>
                `;
          }
        })
        .join("");

      // Add listeners for detail buttons
      if (this.state.viewMode === "search") {
        const detailBtns = tbody.querySelectorAll(".show-details-btn");
        detailBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const dataIndex = parseInt(btn.getAttribute("data-index"));
            this.showDetails(this.state.data[dataIndex]);
          });
        });
      }
    }

    this.renderPagination(totalPages);
  }

  showDetails(studentData) {
    const modal = this.container.querySelector("#detail-modal");
    const nameHeader = this.container.querySelector("#modal-student-name");
    const tbody = this.container.querySelector("#modal-matches-body");

    nameHeader.textContent = `Detail Sertifikat: ${studentData.student_name} (${studentData.student_nim})`;

    if (studentData.matches && studentData.matches.length > 0) {
      tbody.innerHTML = studentData.matches
        .map(
          (cert) => `
            <tr>
                <td>${cert.event_name}</td>
                <td>${cert.category}</td>
                <td>${cert.level}</td>
                <td>${cert.domain}</td>
                <td>${(cert.relevance_score * 100).toFixed(0)}%</td>
                <td>${cert.spu_score}</td>
                <td class="score-val">${cert.final_score}</td>
            </tr>
          `
        )
        .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;">Tidak ada data.</td></tr>';
    }

    modal.style.display = "flex";
  }

  renderPagination(totalPages) {
    const paginationControls = this.container.querySelector(
      "#pagination-controls"
    );

    if (totalPages <= 1) {
      paginationControls.innerHTML = "";
      return;
    }

    let paginationHTML = `
      <button class="pagination-btn" ${
        this.state.currentPage === 1 ? "disabled" : ""
      } data-page="${this.state.currentPage - 1}">Prev</button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= this.state.currentPage - 1 && i <= this.state.currentPage + 1)
      ) {
        paginationHTML += `<button class="pagination-btn ${
          i === this.state.currentPage ? "active" : ""
        }" data-page="${i}">${i}</button>`;
      } else if (
        i === this.state.currentPage - 2 ||
        i === this.state.currentPage + 2
      ) {
        paginationHTML += `<span>...</span>`;
      }
    }

    paginationHTML += `
      <button class="pagination-btn" ${
        this.state.currentPage === totalPages ? "disabled" : ""
      } data-page="${this.state.currentPage + 1}">Next</button>
    `;

    paginationControls.innerHTML = paginationHTML;

    paginationControls.querySelectorAll(".pagination-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!btn.disabled && !btn.classList.contains("active")) {
          this.state.currentPage = parseInt(btn.dataset.page);
          this.renderTable();
        }
      });
    });
  }
}
