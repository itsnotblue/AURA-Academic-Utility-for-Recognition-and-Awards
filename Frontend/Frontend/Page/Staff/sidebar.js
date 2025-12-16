// Load Sidebar Component for Staff Pages
(function () {
  const sidebarPlaceholder = document.getElementById("sidebar-placeholder");

  if (sidebarPlaceholder) {
    // Insert sidebar HTML directly
    sidebarPlaceholder.innerHTML = `
      <aside class="sidebar">
        <img class="logo" src="../../png/Aura_logo.png" alt="AURA Logo" />

        <nav>
          <div class="menu-section">
            <div class="menu-section-title">MENU</div>
            <a href="homepage_staf.html" class="nav-item" data-page="homepage_staf">
              <img src="../../png/dashboard.png" alt="" class="nav-icon" />
              <span>Dashboard</span>
            </a>
            <a href="validasiprestasi_staf.html" class="nav-item" data-page="validasiprestasi_staf">
              <img src="../../png/dataprestasi.png" alt="" class="nav-icon" />
              <span>Validasi Prestasi</span>
            </a>
            <a href="rankingmahasiswa_staf.html" class="nav-item" data-page="rankingmahasiswa_staf">
              <img src="../../png/profilprestasi.png" alt="" class="nav-icon" />
              <span>Rangking Mahasiswa</span>
            </a>
          </div>

          <div class="menu-section">
            <div class="menu-section-title">UMUM</div>
            <a href="profil_staf.html" class="nav-item" data-page="profil_staf">
              <img src="../../png/profilestaff.png" alt="" class="nav-icon" />
              <span>Profil Staf</span>
            </a>
            <a href="../landingpage.html" class="nav-item" data-page="logout">
              <img src="../../png/keluar.png" alt="" class="nav-icon" />
              <span>Keluar</span>
            </a>
          </div>
        </nav>
      </aside>
    `;

    // Set active menu based on current page
    const currentPage = window.location.pathname
      .split("/")
      .pop()
      .replace(".html", "");
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach((item) => {
      const page = item.getAttribute("data-page");
      const icon = item.querySelector(".nav-icon");

      // Match homepage_staf
      if (currentPage === "homepage_staf" && page === "homepage_staf") {
        item.classList.add("active");
        if (icon) icon.src = "../../png/dashboard_red.png";
      }
      // Match validasiprestasi pages (validasiprestasi_staf, validasiprestasi_staf_dpt, validasiprestasi_staf_verif)
      else if (
        currentPage.startsWith("validasiprestasi_staf") &&
        page === "validasiprestasi_staf"
      ) {
        item.classList.add("active");
        if (icon) icon.src = "../../png/dataprestasi_red.png";
      }
      // Match rankingmahasiswa_staf
      else if (
        currentPage === "rankingmahasiswa_staf" &&
        page === "rankingmahasiswa_staf"
      ) {
        item.classList.add("active");
        if (icon) icon.src = "../../png/profilprestasi_red.png";
      }
      // Match profil_staf
      else if (currentPage === "profil_staf" && page === "profil_staf") {
        item.classList.add("active");
        if (icon) icon.src = "../../png/profilestaff_red.png";
      }
    });
  }
})();
