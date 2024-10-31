import "./styles/main.css";
import { App } from "./js/App";

// Anti-inspect element protections
document.addEventListener("contextmenu", (e) => e.preventDefault()); // Disable right click

document.addEventListener("keydown", (e) => {
  // Prevent F12
  if (e.key === "F12") {
    e.preventDefault();
    return false;
  }

  // Prevent Ctrl+Shift+I
  if (e.ctrlKey && e.shiftKey && e.key === "I") {
    e.preventDefault();
    return false;
  }

  // Prevent Ctrl+Shift+J
  if (e.ctrlKey && e.shiftKey && e.key === "J") {
    e.preventDefault();
    return false;
  }

  // Prevent Ctrl+U (view source)
  if (e.ctrlKey && e.key === "u") {
    e.preventDefault();
    return false;
  }
});

// Additional protections against dev tools
function protectDevTools() {
  // Clear console
  console.clear();

  // Hide source
  const hideSource = () => {
    document.head.innerHTML = "";
    document.body.innerHTML = "Protected Content";
  };

  // Detect DevTools
  const checkDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;

    if (widthThreshold || heightThreshold) {
      hideSource();
      window.location.reload();
    }
  };

  // Override debug functions
  ["debug", "log", "warn", "error", "info"].forEach((method) => {
    console[method] = () => {};
  });

  // Continuous monitoring
  setInterval(() => {
    checkDevTools();
    console.clear();
  }, 1000);

  // Detect and disable debugger
  setInterval(() => {
    Function.prototype.toString = () =>
      "Function.prototype.toString is disabled";
  }, 100);
}

// Initialize protections and app
window.addEventListener("load", () => {
  protectDevTools();

  const app = new App();
  app.initializeApp().catch((error) => {
    // Suppress error logging in production
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to initialize application:", error);
    }
  });
});
