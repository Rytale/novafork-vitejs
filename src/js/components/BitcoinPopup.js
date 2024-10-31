import { dom } from '../utils/helpers';

export class BitcoinPopup {
  constructor() {
    this.modal = null;
    this.setupModal();
    this.setupEventListeners();
  }

  setupModal() {
    // Get or create modal container
    let modalContainer = dom.$('#bitcoinPopup');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'bitcoinPopup';
      modalContainer.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center hidden z-50';
      document.body.appendChild(modalContainer);
    }

    // Create modal content
    modalContainer.innerHTML = `
      <div class="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-white mb-4">Support Novafork with Bitcoin</h2>
          <div class="mb-6">
            <img src="/bitcoin.png" alt="Bitcoin QR Code" class="mx-auto w-48 h-48 mb-4">
            <input type="text" value="bc1qxvvk9n8qk9pz5rnx6q8vz4cg8c0tzx4mtejggv" readonly
                   class="w-full p-2 bg-[#0a0a0a] text-white rounded border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
          </div>
          <p class="text-gray-400 mb-6">
            Your support helps us maintain and improve Novafork. Thank you!
          </p>
          <button onclick="document.getElementById('bitcoinPopup').classList.add('hidden')"
                  class="text-gray-400 hover:text-white">
            Close
          </button>
        </div>
      </div>
    `;

    this.modal = modalContainer;
  }

  setupEventListeners() {
    // Open modal button
    const openButton = dom.$('#openBitcoinPopup');
    if (openButton) {
      dom.on(openButton, 'click', () => this.show());
    }

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

  show() {
    if (this.modal) {
      this.modal.classList.remove('hidden');
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }
}
