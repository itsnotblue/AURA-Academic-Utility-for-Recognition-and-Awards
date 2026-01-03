import { showValidationModal } from "./validasi.js";

export class ListPrestasi {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.state = {
      data: [],
      currentPage: 1,
      pageSize: 10,
      searchTerm: "",
    };
  }

  async init() {
    this.renderStructure();
    this.attachControlListeners();
    this.renderLoading();

    try {
      const response = await this.fetchPrestasi();

      if (response.status_code === 200) {
        this.state.data = response.data.events;
        this.renderTable();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error:", error);
      const tbody = this.container.querySelector("tbody");
      if (tbody) {
        tbody.innerHTML = `<tr class="no-hover"><td colspan="7" style="text-align:center; color:red; padding: 20px;">Gagal memuat data: ${error.message}</td></tr>`;
      }
    }
  }

  async fetchPrestasi() {
    try {
      const response = await fetch("/api/v1/staff/certificate");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
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
          <input type="text" id="search-input" placeholder="Search" />
        </div>
      </div>

      <!-- Data Table -->
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Kegiatan</th>
              <th>Kategori</th>
              <th>Tingkat</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="prestasi-table-body">
            <!-- Data will be injected here -->
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" id="pagination-controls"></div>
      
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
          width: 260px;
          padding: 8px 16px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
          font-family: "Inter", sans-serif;
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

        .btn-verify {
          padding: 6px 12px;
          background: white;
          border: 1px solid #D0D5DD;
          border-radius: 6px;
          color: #344054;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-verify:hover {
          background: #F9FAFB;
          border-color: #EC1D25;
          color: #EC1D25;
        }

        .badge-success {
          display: inline-block;
          padding: 4px 12px;
          background: var(--success-bg);
          color: var(--success);
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-processed {
          display: inline-block;
          padding: 4px 12px;
          background: #e0f2fe;
          color: #0284c7;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
      </style>
    `;
  }

  attachControlListeners() {
    const showEntriesSelect = this.container.querySelector("#show-entries");
    const searchInput = this.container.querySelector("#search-input");

    showEntriesSelect.addEventListener("change", (e) => {
      this.state.pageSize = parseInt(e.target.value);
      this.state.currentPage = 1;
      this.renderTable();
    });

    searchInput.addEventListener("input", (e) => {
      this.state.searchTerm = e.target.value.toLowerCase();
      this.state.currentPage = 1;
      this.renderTable();
    });
  }

  renderLoading() {
    const tbody = this.container.querySelector("#prestasi-table-body");
    tbody.innerHTML =
      '<tr class="no-hover"><td colspan="7" style="text-align:center; padding: 20px;">Loading data prestasi...</td></tr>';
  }

  renderTable() {
    const tbody = this.container.querySelector("#prestasi-table-body");

    const filteredData = this.state.data.filter(
      (item) =>
        (item.event_name &&
          item.event_name.toLowerCase().includes(this.state.searchTerm)) ||
        (item.category &&
          item.category.toLowerCase().includes(this.state.searchTerm))
    );

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / this.state.pageSize);

    if (this.state.currentPage > totalPages)
      this.state.currentPage = totalPages || 1;
    if (this.state.currentPage < 1) this.state.currentPage = 1;

    const start = (this.state.currentPage - 1) * this.state.pageSize;
    const end = start + this.state.pageSize;
    const pageData = filteredData.slice(start, end);

    if (pageData.length === 0) {
      tbody.innerHTML =
        '<tr class="no-hover"><td colspan="7" style="text-align:center; padding: 20px;">No matching records found.</td></tr>';
    } else {
      tbody.innerHTML = pageData
        .map(
          (event, index) => `
          <tr>
              <td>${start + index + 1}</td>
              <td>${event.event_name}</td>
              <td>${event.category}</td>
              <td>${event.tingkat}</td>
              <td>${event.created_at}</td>
              <td>${this.formatStatus(event.status)}</td>
              <td>
                  <button class="btn-verify" data-id="${event.id}">
                    ${event.status === "validated" ? "Detail" : "Verify"}
                  </button>
              </td>
          </tr>
      `
        )
        .join("");
    }

    this.renderPagination(totalPages);

    // Attach verify button listeners
    tbody.querySelectorAll(".btn-verify").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        const eventData = this.state.data.find((ev) => ev.id === id);
        if (eventData) {
          showValidationModal(eventData);
        }
      });
    });
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

  formatStatus(status) {
    if (status === "validated") {
      return '<span class="badge-success">Tervalidasi</span>';
    } else if (status === "processed") {
      return '<span class="badge-processed">Diproses</span>';
    }
    return `<span>${status}</span>`;
  }
}
