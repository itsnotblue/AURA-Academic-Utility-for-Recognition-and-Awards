// Load Sidebar Component
(function () {
  const sidebarPlaceholder = document.getElementById("sidebar-placeholder");

  if (sidebarPlaceholder) {
    // Insert sidebar HTML directly
    sidebarPlaceholder.innerHTML = `
      <aside class="sidebar">
        <img class="logo" src="../../png/Aura_logo.png" alt="AURA Logo" />

        <nav>
          <div class="menu-section">
            <div class="menu-section-title">Menu</div>
            <a href="homepage.html" class="nav-item" data-page="homepage">
              <img src="../../png/dashboard.png" alt="" class="nav-icon" />
              <span>Dashboard</span>
            </a>
            <a href="dataprestasi_rm.html" class="nav-item" data-page="dataprestasi">
              <img src="../../png/dataprestasi.png" alt="" class="nav-icon" />
              <span>Data Prestasi</span>
            </a>
            <a href="profilprestasi.html" class="nav-item" data-page="profilprestasi">
              <img src="../../png/profilprestasi.png" alt="" class="nav-icon" />
              <span>Profil Prestasi</span>
            </a>
          </div>

          <div class="menu-section">
            <div class="menu-section-title">Umum</div>
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

      // Match homepage
      if (currentPage === "homepage" && page === "homepage") {
        item.classList.add("active");
        if (icon) icon.src = "../../png/dashboard_red.png";
      }
      // Match data prestasi pages (dataprestasi_rm, dataprestasi_md)
      else if (
        currentPage.startsWith("dataprestasi") &&
        page === "dataprestasi"
      ) {
        item.classList.add("active");
        if (icon) icon.src = "../../png/dataprestasi_red.png";
      }
      // Match profil prestasi pages (profilprestasi, profilprestasi_sv, profilprestasi_ib, profilprestasi_sv_edit)
      else if (
        currentPage.startsWith("profilprestasi") &&
        page === "profilprestasi"
      ) {
        item.classList.add("active");
        if (icon) icon.src = "../../png/profilprestasi_red.png";
      }
    });
  }
})();
