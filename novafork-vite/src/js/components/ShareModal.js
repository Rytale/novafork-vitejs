import { dom } from '../utils/helpers';

export class ShareModal {
  constructor() {
    this.modal = null;
    this.setupModal();
  }

  setupModal() {
    // Get or create modal container
    let modalContainer = dom.$('#shareModal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'shareModal';
      modalContainer.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center hidden z-50';
      document.body.appendChild(modalContainer);
    }

    // Create modal content
    let modalContent = dom.$('#shareModalContent');
    if (!modalContent) {
      modalContent = document.createElement('div');
      modalContent.id = 'shareModalContent';
      modalContent.className = 'bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4';
      modalContainer.appendChild(modalContent);
    }

    this.modal = modalContainer;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close modal when clicking outside
    if (this.modal) {
      dom.on(this.modal, 'click', (e) => {
        if (e.target === this.modal) {
          this.hide();
        }
      });

      // Close on escape key
      dom.on(document, 'keydown', (e) => {
        if (e.key === 'Escape') {
          this.hide();
        }
      });
    }
  }

  show(media) {
    if (!this.modal) return;

    const modalContent = dom.$('#shareModalContent');
    if (!modalContent) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?mediaType=${media.media_type || 'movie'}&mediaId=${media.id}`;
    const title = media.title || media.name;

    modalContent.innerHTML = `
      <div class="text-center">
        <h2 class="text-2xl font-bold text-white mb-4">Share "${title}"</h2>
        <div class="mb-6">
          <input type="text" value="${shareUrl}" readonly
                 class="w-full p-2 bg-[#0a0a0a] text-white rounded border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
        </div>
        <div class="flex justify-center space-x-4">
          <button onclick="window.open('https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out "${title}" on Novafork!`)}', '_blank')"
                  class="bg-blue-400 hover:bg-blue-500 text-white rounded-full p-2">
            <i class="fab fa-twitter"></i>
          </button>
          <button onclick="window.open('https://telegram.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out "${title}" on Novafork!`)}', '_blank')"
                  class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2">
            <i class="fab fa-telegram-plane"></i>
          </button>
          <button onclick="navigator.clipboard.writeText('${shareUrl}').then(() => alert('Link copied to clipboard!'))"
                  class="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <button onclick="document.getElementById('shareModal').classList.add('hidden')"
                class="mt-6 text-gray-400 hover:text-white">
          Close
        </button>
      </div>
    `;

    this.modal.classList.remove('hidden');
  }

  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }
}
