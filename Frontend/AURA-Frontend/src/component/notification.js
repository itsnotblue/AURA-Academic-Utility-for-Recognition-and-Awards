export class Notification {
  constructor() {
    this.notificationElement = null;
    this.cssInjected = false;
    this.initialize();
  }

  initialize() {
    this.injectStyles();

    if (!document.getElementById("notificationAlert")) {
      this.createNotificationElement();
    } else {
      this.notificationElement = document.getElementById("notificationAlert");
    }
  }

  injectStyles() {
    if (this.cssInjected) return;

    // Create link element for CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/src/component/notification.css";

    // Add to document head
    document.head.appendChild(link);
    this.cssInjected = true;
  }

  createNotificationElement() {
    const notificationHTML = `
      <div id="notificationAlert" class="notification-alert">
        <div class="notification-icon" id="notificationIcon">
        </div>
        <div class="notification-content">
          <div class="notification-title" id="notificationTitle"></div>
          <div class="notification-message" id="notificationMessage"></div>
        </div>
        <div class="notification-close" onclick="window.notificationComponent.close()">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="#58585a" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("afterbegin", notificationHTML);
    this.notificationElement = document.getElementById("notificationAlert");
    this.notificationIcon = document.getElementById("notificationIcon");

    this.notificationElement
      .querySelector(".notification-close")
      .addEventListener("click", () => {
        this.close();
      });
  }

  getIconForType(type) {
    const icons = {
      success: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12l2 2l4-4"/>
          </g>
        </svg>
      `,
      error: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="m15 9l-6 6m0-6l6 6"/>
          </g>
        </svg>
      `,
      warning: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </g>
        </svg>
      `,
      info: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M17 12h.01M12 12h.01M7 12h.01" />
          </g>
        </svg>
      `,
    };

    return icons[type] || icons.info;
  }

  show(title, message, options = {}) {
    const { type = "info", duration = 5000, autoClose = true } = options;

    document.getElementById("notificationTitle").textContent = title;
    document.getElementById("notificationMessage").textContent = message;

    this.updateNotificationType(type);

    this.notificationElement.classList.add("show");

    if (autoClose) {
      this.autoCloseTimeout = setTimeout(() => {
        this.close();
      }, duration);
    }
  }

  updateNotificationType(type) {
    this.notificationElement.classList.remove(
      "info",
      "success",
      "error",
      "warning"
    );

    this.notificationElement.classList.add(type);

    // Update icon SVG and color based on type
    this.notificationIcon.innerHTML = this.getIconForType(type);

    const icon = this.notificationIcon.querySelector("svg");
    const title = this.notificationElement.querySelector(".notification-title");

    // Set colors based on type
    const colors = {
      success: "#10b981",
      error: "#ec1d25",
      warning: "#f59e0b",
      info: "#3b82f6",
    };

    const color = colors[type] || colors.info;

    // Apply colors
    icon.style.color = color;
    icon.style.stroke = color;
    title.style.color = color;
  }

  close() {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
    this.notificationElement.classList.remove("show");
  }
}

export const notification = new Notification();

window.notificationComponent = notification;
