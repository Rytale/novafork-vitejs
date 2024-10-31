import './styles/main.css';
import { App } from './js/App';

// Initialize app after DOM is fully loaded
window.addEventListener('load', () => {
  const app = new App();
  app.initializeApp().catch(error => {
    console.error('Failed to initialize application:', error);
  });
});
