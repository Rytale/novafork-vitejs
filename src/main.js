import "./styles/main.css";
import { App } from "./js/App";



// Initialize protections and app
window.addEventListener("load", () => {


  const app = new App();
  app.initializeApp().catch((error) => {
    // Suppress error logging in production
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to initialize application:", error);
    }
  });
});
