import { MediaDetails } from './components/MediaDetails';
import { MediaPlayer } from './components/MediaPlayer';
import { ShareModal } from './components/ShareModal';
import { BitcoinPopup } from './components/BitcoinPopup';
import { EpisodeModal } from './components/EpisodeModal';
import { MediaGrid } from './components/MediaGrid';
import { apiService } from './api/apiService';
import { dom } from './utils/helpers';

export class App {
  constructor() {
    this.mediaPlayer = new MediaPlayer();
    this.mediaDetails = new MediaDetails(this.mediaPlayer);
    this.shareModal = new ShareModal();
    this.bitcoinPopup = new BitcoinPopup();
    this.episodeModal = new EpisodeModal(this.mediaPlayer);
    this.mediaGrid = null; // Initialize later when DOM is ready
    this.currentPage = 1;
    this.searchQuery = '';
    this.mediaType = 'movie';
    this.category = 'popular';
    this.isPopularMediaHidden = false;

    // Make episodeModal accessible globally for the MediaDetails component
    window.episodeModal = this.episodeModal;
  }

  async initializeApp() {
    try {
      // Initialize MediaGrid after DOM is ready
      this.mediaGrid = new MediaGrid();
      
      this.setupEventListeners();
      this.mediaPlayer.setupOrientationLock();
      
      // Load trending media first
      await this.loadPopularMedia();
      
      // Then load media from URL params if any
      await this.loadMediaFromParams();
      
      this.setupCategorySelect();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  setupEventListeners() {
    const searchInput = dom.$('#searchInput');
    const searchButton = dom.$('#searchButton');
    const typeSelect = dom.$('#typeSelect');
    const togglePopularMediaButton = dom.$('#togglePopularMedia');
    const prevPageButton = dom.$('#prevPage');
    const nextPageButton = dom.$('#nextPage');
    const openBitcoinPopupButton = dom.$('#openBitcoinPopup');

    if (searchInput && searchButton) {
      dom.on(searchInput, 'input', () => this.handleSearchInput());
      dom.on(searchButton, 'click', () => this.handleSearch());
      dom.on(searchInput, 'keypress', (e) => {
        if (e.key === 'Enter') this.handleSearch();
      });
    }

    if (typeSelect) {
      dom.on(typeSelect, 'change', (e) => {
        this.mediaType = e.target.value;
        this.currentPage = 1;
        this.loadPopularMedia();
      });
    }

    if (togglePopularMediaButton) {
      dom.on(togglePopularMediaButton, 'click', () => this.togglePopularMedia());
    }

    if (prevPageButton) {
      dom.on(prevPageButton, 'click', () => this.handlePageChange('prev'));
    }

    if (nextPageButton) {
      dom.on(nextPageButton, 'click', () => this.handlePageChange('next'));
    }

    if (openBitcoinPopupButton) {
      dom.on(openBitcoinPopupButton, 'click', () => this.bitcoinPopup.show());
    }

    // Listen for media selection events
    window.addEventListener('mediaSelect', (event) => {
      const { mediaId, mediaType } = event.detail;
      this.handleMediaSelect(mediaId, mediaType);
    });

    // Handle browser navigation
    window.addEventListener('popstate', () => this.loadMediaFromParams());
  }

  setupCategorySelect() {
    const categorySelect = dom.$('#categorySelect');
    if (!categorySelect) return;

    const categories = [
      { value: 'popular', label: 'Popular' },
      { value: 'top_rated', label: 'Top Rated' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'now_playing', label: 'Now Playing' }
    ];

    categorySelect.innerHTML = categories
      .map(category => `<option value="${category.value}">${category.label}</option>`)
      .join('');

    dom.on(categorySelect, 'change', (e) => {
      this.category = e.target.value;
      this.currentPage = 1;
      this.loadPopularMedia();
    });
  }

  async handleSearchInput() {
    const searchInput = dom.$('#searchInput');
    const searchSuggestions = dom.$('#searchSuggestions');
    
    if (!searchInput || !searchSuggestions) return;

    const query = searchInput.value.trim();
    if (query.length < 2) {
      searchSuggestions.classList.add('hidden');
      return;
    }

    try {
      const results = await apiService.searchMedia(query, this.mediaType, 1);
      if (!results.results.length) {
        searchSuggestions.classList.add('hidden');
        return;
      }

      const suggestions = results.results
        .slice(0, 5)
        .map(media => {
          const title = media.title || media.name;
          const year = (media.release_date || media.first_air_date || '').split('-')[0];
          return `
            <div class="p-2 hover:bg-gray-700 cursor-pointer" data-id="${media.id}" data-type="${this.mediaType}">
              <div class="flex items-center">
                <img src="https://image.tmdb.org/t/p/w92${media.poster_path}" 
                     alt="${title}" 
                     class="w-12 h-16 object-cover rounded mr-3"
                     onerror="this.src='placeholder.jpg'">
                <div>
                  <div class="font-semibold">${title}</div>
                  <div class="text-sm text-gray-400">${year}</div>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      searchSuggestions.innerHTML = suggestions;
      searchSuggestions.classList.remove('hidden');

      // Add click event listeners to suggestions
      const suggestionElements = searchSuggestions.querySelectorAll('[data-id]');
      suggestionElements.forEach(element => {
        dom.on(element, 'click', () => {
          const mediaId = element.dataset.id;
          const mediaType = element.dataset.type;
          this.handleMediaSelect(mediaId, mediaType);
          searchSuggestions.classList.add('hidden');
          searchInput.value = '';
        });
      });

    } catch (error) {
      console.error('Error fetching search suggestions:', error);
    }
  }

  async handleSearch() {
    const searchInput = dom.$('#searchInput');
    const searchSuggestions = dom.$('#searchSuggestions');
    
    if (!searchInput || !searchSuggestions) return;

    const query = searchInput.value.trim();
    if (!query) return;

    this.searchQuery = query;
    this.currentPage = 1;
    searchSuggestions.classList.add('hidden');
    await this.loadPopularMedia();
  }

  async handleMediaSelect(mediaId, mediaType) {
    try {
      // Update URL without triggering navigation
      const url = new URL(window.location);
      url.searchParams.set('id', mediaId);
      url.searchParams.set('type', mediaType);
      window.history.pushState({}, '', url);

      // Display media details
      const media = await apiService.getMediaDetails(mediaId, mediaType);
      await this.mediaDetails.displayMedia(media, mediaType);

      // Keep trending media visible
      const popularMedia = dom.$('#popularMedia');
      if (popularMedia) {
        popularMedia.style.display = 'grid';
      }
    } catch (error) {
      console.error('Failed to display media details:', error);
    }
  }

  async loadMediaFromParams() {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type');

    if (mediaId && mediaType) {
      await this.handleMediaSelect(mediaId, mediaType);
    }
  }

  async handlePageChange(direction) {
    const prevPageButton = dom.$('#prevPage');
    const nextPageButton = dom.$('#nextPage');
    
    if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (direction === 'next') {
      this.currentPage++;
    }

    await this.loadPopularMedia();

    if (prevPageButton) {
      prevPageButton.disabled = this.currentPage === 1;
    }
    if (nextPageButton) {
      nextPageButton.disabled = false; // We don't know the total pages, so always enable next
    }
  }

  togglePopularMedia() {
    const popularMedia = dom.$('#popularMedia');
    const toggleButton = dom.$('#togglePopularMedia');
    
    if (!popularMedia || !toggleButton) return;

    this.isPopularMediaHidden = !this.isPopularMediaHidden;
    popularMedia.style.display = this.isPopularMediaHidden ? 'none' : 'grid';
    toggleButton.textContent = this.isPopularMediaHidden ? 'Show Trending Media' : 'Hide Trending Media';
  }

  async loadPopularMedia() {
    if (!this.mediaGrid) return;

    try {
      let results;
      if (this.searchQuery) {
        results = await apiService.searchMedia(this.searchQuery, this.mediaType, this.currentPage);
      } else {
        results = await apiService.getMediaByCategory(this.category, this.mediaType, this.currentPage);
      }

      if (results && results.results) {
        await this.mediaGrid.displayMedia(results.results, this.mediaType);
      }

      // Update pagination buttons
      const prevPageButton = dom.$('#prevPage');
      if (prevPageButton) {
        prevPageButton.disabled = this.currentPage === 1;
      }
    } catch (error) {
      console.error('Failed to load popular media:', error);
    }
  }
}
