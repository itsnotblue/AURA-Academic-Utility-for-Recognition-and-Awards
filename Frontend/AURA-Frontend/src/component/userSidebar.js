const SIDEBAR_CSS = `
:root {
  --bg: #ffffff;
  --panel: #fafafa;
  --accent: #ec1d25;
  --accent-dark: #861015;
  --muted: #a6a8a7;
  --text-dark: #58585a;
  --text-light: #8c8c8c;
  --border: #eaecf0;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 296px;
  height: 100vh;
  background: var(--panel);
  padding: 32px 24px;
  overflow-y: auto;
  z-index: 10;
}

.sidebar .logo {
  display: block;
  width: 109px;
  height: 66px;
  margin: 0 auto 64px;
}

.menu-section {
  margin-bottom: 32px;
}

.menu-section-title {
  color: #b11216;
  font-size: 16px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  margin: 8px 0;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
}

.nav-item:hover {
  background: rgba(236, 29, 37, 0.05);
  color: var(--accent);
  transform: translateX(4px);
}

.nav-item.active {
  color: var(--accent);
  font-weight: 500;
}

.nav-item.active::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #ec1d25 0%, #861015 100%);
  border-radius: 2px;
  margin-left: -8px;
  margin-right: 4px;
}

.nav-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}
`;

const SIDEBAR_HTML = `
<aside class="sidebar">
  <img class="logo" src="/assets/Aura_logo.png" alt="AURA Logo" />

  <nav>
    <div class="menu-section">
      <div class="menu-section-title">Menu</div>
      <a href="dashboard.html" class="nav-item" data-page="homepage">
        <img src="/assets/dashboard.png" alt="" class="nav-icon" />
        <span>Dashboard</span>
      </a>
      <a href="dataprestasi.html" class="nav-item" data-page="dataprestasi">
        <img src="/assets/dataprestasi.png" alt="" class="nav-icon" />
        <span>Data Prestasi</span>
      </a>
      <a href="profilprestasi.html" class="nav-item" data-page="profilprestasi">
        <img src="/assets/profilprestasi.png" alt="" class="nav-icon" />
        <span>Profil Prestasi</span>
      </a>
    </div>

    <div class="menu-section">
      <div class="menu-section-title">Umum</div>
      <a href="../landingpage.html" class="nav-item" data-page="logout">
        <img src="/assets/keluar.png" alt="" class="nav-icon" />
        <span>Keluar</span>
      </a>
    </div>
  </nav>
</aside>
`;

function ensureSidebarStyles() {
  if (document.getElementById("user-sidebar-styles")) return;
  const styleEl = document.createElement("style");
  styleEl.id = "user-sidebar-styles";
  styleEl.textContent = SIDEBAR_CSS;
  document.head.appendChild(styleEl);
}

function applyActiveState(container) {
  const currentPage = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "");
  const navItems = container.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    const page = item.getAttribute("data-page");
    const icon = item.querySelector(".nav-icon");

    if (
      (currentPage === "homepage" || currentPage === "dashboard") &&
      page === "homepage"
    ) {
      item.classList.add("active");
      if (icon) icon.src = "/public/assets/dashboard_red.png";
    } else if (
      currentPage.startsWith("dataprestasi") &&
      page === "dataprestasi"
    ) {
      item.classList.add("active");
      if (icon) icon.src = "/public/assets/dataprestasi_red.png";
    } else if (
      currentPage.startsWith("profilprestasi") &&
      page === "profilprestasi"
    ) {
      item.classList.add("active");
      if (icon) icon.src = "/public/assets/profilprestasi_red.png";
    }
  });
}

export function initUserSidebar(targetElement) {
  const target =
    targetElement || document.getElementById("sidebar-placeholder");
  if (!target) return;

  ensureSidebarStyles();
  target.innerHTML = SIDEBAR_HTML;
  applyActiveState(target);
}
