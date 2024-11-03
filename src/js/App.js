import { MediaDetails } from "./components/MediaDetails";
import { MediaPlayer } from "./components/MediaPlayer";
import { ShareModal } from "./components/ShareModal";
import { BitcoinPopup } from "./components/BitcoinPopup";
import { EpisodeModal } from "./components/EpisodeModal";
import { MediaGrid } from "./components/MediaGrid";
import { AdvancedFilters } from "./components/AdvancedFilters";
import { UserTracker } from "./components/UserTracker";
import { apiService } from "./api/apiService";
import { dom } from "./utils/helpers";

const ITEMS_PER_PAGE = 18;

export class App {
  constructor() {
    this.mediaPlayer = new MediaPlayer();
    this.mediaDetails = new MediaDetails(this.mediaPlayer);
    this.shareModal = new ShareModal();
    this.bitcoinPopup = new BitcoinPopup();
    this.episodeModal = new EpisodeModal(this.mediaPlayer);
    this.advancedFilters = new AdvancedFilters();
    this.userTracker = null; // Initialize after Firebase is ready
    this.mediaGrid = null; // Initialize later when DOM is ready
    this.currentPage = 1;
    this.totalPages = 1;
    this.searchQuery = "";
    this.mediaType = "all";
    this.category = "popular";
    this.isPopularMediaHidden = false;
    this.activeFilters = {
      genres: [],
      actor: "",
      company: "",
      collection: "",
      franchise: "",
    };

    // Make episodeModal accessible globally for the MediaDetails component
    window.episodeModal = this.episodeModal;
  }

  // Helper function to check if device is mobile
  isMobileDevice() {
    return window.innerWidth <= 768;
  }

  // Helper function to scroll element into view
  scrollIntoViewWithOffset(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  async initializeApp() {
    try {
      // Initialize MediaGrid after DOM is ready
      this.mediaGrid = new MediaGrid();

      // Initialize UserTracker
      this.userTracker = new UserTracker();

      this.setupEventListeners();
      this.mediaPlayer.setupOrientationLock();

      // Load trending media first
      await this.loadPopularMedia();

      // Then load media from URL params if any
      await this.loadMediaFromParams();

      this.setupCategorySelect();
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  }

  setupEventListeners() {
    const searchInput = dom.$("#searchInput");
    const searchButton = dom.$("#searchButton");
    const typeSelect = dom.$("#typeSelect");
    const togglePopularMediaButton = dom.$("#togglePopularMedia");
    const prevPageButton = dom.$("#prevPage");
    const nextPageButton = dom.$("#nextPage");
    const openBitcoinPopupButton = dom.$("#openBitcoinPopup");

    if (searchInput && searchButton) {
      dom.on(searchInput, "input", () => this.handleSearchInput());
      dom.on(searchButton, "click", () => this.handleSearch());
      dom.on(searchInput, "keypress", (e) => {
        if (e.key === "Enter") this.handleSearch();
      });
    }

    if (typeSelect) {
      dom.on(typeSelect, "change", (e) => {
        this.mediaType = e.target.value;
        this.currentPage = 1;
        this.loadPopularMedia();
      });
    }

    if (togglePopularMediaButton) {
      dom.on(togglePopularMediaButton, "click", () =>
        this.togglePopularMedia()
      );
    }

    if (prevPageButton) {
      dom.on(prevPageButton, "click", (e) => {
        e.preventDefault();
        this.handlePageChange("prev");
      });
    }

    if (nextPageButton) {
      dom.on(nextPageButton, "click", (e) => {
        e.preventDefault();
        this.handlePageChange("next");
      });
    }

    if (openBitcoinPopupButton) {
      dom.on(openBitcoinPopupButton, "click", () => this.bitcoinPopup.show());
    }

    // Listen for media selection events
    window.addEventListener("mediaSelect", (event) => {
      const { mediaId, mediaType } = event.detail;
      this.handleMediaSelect(mediaId, mediaType);
    });

    // Listen for filter change events
    window.addEventListener("filterChange", (event) => {
      this.activeFilters = event.detail;
      this.currentPage = 1;
      this.loadPopularMedia();
    });

    // Handle browser navigation
    window.addEventListener("popstate", () => this.loadMediaFromParams());
  }

  setupCategorySelect() {
    const categorySelect = dom.$("#categorySelect");
    if (!categorySelect) return;

    const categories = [
      { value: "popular", label: "Popular" },
      { value: "top_rated", label: "Top Rated" },
      { value: "upcoming", label: "Upcoming" },
      { value: "now_playing", label: "Now Playing" },
    ];

    categorySelect.innerHTML = categories
      .map(
        (category) =>
          `<option value="${category.value}">${category.label}</option>`
      )
      .join("");

    dom.on(categorySelect, "change", (e) => {
      this.category = e.target.value;
      this.currentPage = 1;
      this.loadPopularMedia();
    });
  }

  async handleSearchInput() {
    const searchInput = dom.$("#searchInput");
    const searchSuggestions = dom.$("#searchSuggestions");

    if (!searchInput || !searchSuggestions) return;

    const query = searchInput.value.trim();
    if (query.length < 2) {
      searchSuggestions.classList.add("hidden");
      return;
    }

    try {
      // Search both movies and TV shows regardless of mediaType selection
      const [movieResults, tvResults] = await Promise.all([
        apiService.searchMedia(query, 'movie', 1),
        apiService.searchMedia(query, 'tv', 1)
      ]);

      // Combine and sort results by popularity
      let combinedResults = [
        ...movieResults.results.map(item => ({ ...item, media_type: 'movie' })),
        ...tvResults.results.map(item => ({ ...item, media_type: 'tv' }))
      ].sort((a, b) => b.popularity - a.popularity);

      // Filter by mediaType if specific type is selected
      if (this.mediaType !== 'all') {
        combinedResults = combinedResults.filter(item => item.media_type === this.mediaType);
      }

      if (!combinedResults.length) {
        searchSuggestions.classList.add("hidden");
        return;
      }

      const suggestions = combinedResults
        .slice(0, 5)
        .map((media) => {
          const title = media.title || media.name;
          const year = (media.release_date || media.first_air_date || "").split(
            "-"
          )[0];
          const mediaType = media.media_type;
          const typeLabel = mediaType === 'movie' ? 'Movie' : 'TV Show';
          
          return `
            <div class="suggestion-item p-2 hover:bg-gray-700 cursor-pointer" data-id="${media.id}" data-type="${mediaType}">
              <div class="flex items-center">
                <img src="https://image.tmdb.org/t/p/w92${media.poster_path}" 
                     alt="${title}" 
                     class="w-12 h-16 object-cover rounded mr-3"
                     onerror="this.src='placeholder.jpeg'">
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate">${title}</div>
                  <div class="text-sm text-gray-400">${year} • ${typeLabel}</div>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      searchSuggestions.innerHTML = suggestions;
      searchSuggestions.classList.remove("hidden");

      // Add click event listeners to suggestions
      const suggestionElements =
        searchSuggestions.querySelectorAll(".suggestion-item");
      suggestionElements.forEach((element) => {
        dom.on(element, "click", async () => {
          const mediaId = element.dataset.id;
          const mediaType = element.dataset.type;
          searchSuggestions.classList.add("hidden");
          searchInput.value = "";
          await this.handleMediaSelect(mediaId, mediaType);
        });
      });
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
    }
  }

  async handleSearch() {
    const searchInput = dom.$("#searchInput");
    const searchSuggestions = dom.$("#searchSuggestions");
    const popularMedia = dom.$("#popularMedia");

    if (!searchInput || !searchSuggestions) return;

    const query = searchInput.value.trim();
    if (!query) return;

    this.searchQuery = query;
    this.currentPage = 1;
    searchSuggestions.classList.add("hidden");
    await this.loadPopularMedia();
  }

  async handleMediaSelect(mediaId, mediaType) {
    try {
      // Update URL without triggering navigation
      const url = new URL(window.location);
      url.searchParams.set("id", mediaId);
      url.searchParams.set("type", mediaType);
      window.history.pushState({}, "", url);

      // Display media details with the correct type
      const media = await apiService.getMediaDetails(mediaId, mediaType);
      
      // Handle scrolling based on device type
      const popularMedia = dom.$("#popularMedia");
      if (popularMedia) {
        popularMedia.style.display = "grid";
        
        if (this.isMobileDevice()) {
          // On mobile, use custom scroll with offset
          this.scrollIntoViewWithOffset(popularMedia, 60);
        } else {
          // On desktop, use standard scrollIntoView
          popularMedia.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
        }
      }

      // Wait a short moment for the scroll to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Then update the content
      await this.mediaDetails.displayMedia(media, mediaType);

    } catch (error) {
      console.error("Failed to display media details:", error);
    }
  }

  async loadMediaFromParams() {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get("id");
    const mediaType = params.get("type");

    if (mediaId && mediaType) {
      await this.handleMediaSelect(mediaId, mediaType);
    }
  }

  async handlePageChange(direction) {
    const prevPageButton = dom.$("#prevPage");
    const nextPageButton = dom.$("#nextPage");

    const oldPage = this.currentPage;

    if (direction === "prev" && this.currentPage > 1) {
      this.currentPage--;
    } else if (direction === "next" && this.currentPage < this.totalPages) {
      this.currentPage++;
    }

    // Only reload if page actually changed
    if (oldPage !== this.currentPage) {
      await this.loadPopularMedia();
    }

    // Update button states
    if (prevPageButton) {
      prevPageButton.disabled = this.currentPage === 1;
    }
    if (nextPageButton) {
      nextPageButton.disabled = this.currentPage >= this.totalPages;
    }
  }

  togglePopularMedia() {
    const popularMedia = dom.$("#popularMedia");
    const toggleButton = dom.$("#togglePopularMedia");

    if (!popularMedia || !toggleButton) return;

    this.isPopularMediaHidden = !this.isPopularMediaHidden;
    popularMedia.style.display = this.isPopularMediaHidden ? "none" : "grid";
    toggleButton.textContent = this.isPopularMediaHidden
      ? "Show Avalible Media"
      : "Hide Avalible Media";
  }

  async loadPopularMedia() {
    if (!this.mediaGrid) return;

    try {
      let results;
      if (this.searchQuery) {
        results = await apiService.searchMedia(
          this.searchQuery,
          this.mediaType,
          this.currentPage
        );
      } else {
        results = await apiService.getMediaByCategory(
          this.category,
          this.mediaType,
          this.currentPage,
          this.activeFilters.genres
        );
      }

      if (results && results.results) {
        // Update total pages
        this.totalPages = results.total_pages || 1;

        // Take exactly ITEMS_PER_PAGE items
        let filteredResults = results.results.slice(0, ITEMS_PER_PAGE);

        // Apply remaining filters if needed
        if (this.activeFilters.actor) {
          // Apply actor filter
        }

        if (this.activeFilters.company) {
          // Apply company filter
        }

        if (this.activeFilters.collection) {
          // Apply collection filter
        }

        if (this.activeFilters.franchise) {
          // Apply franchise filter
        }

        // Clear existing content before displaying new results
        const popularMedia = dom.$("#popularMedia");
        if (popularMedia) {
          popularMedia.innerHTML = "";
        }

        // Display new results
        await this.mediaGrid.displayMedia(filteredResults, this.mediaType);

        // After results are loaded, scroll to the media container if this was triggered by a search
        if (this.searchQuery && popularMedia) {
          setTimeout(() => {
            if (this.isMobileDevice()) {
              this.scrollIntoViewWithOffset(popularMedia, 60);
            } else {
              popularMedia.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start'
              });
            }
          }, 100);
        }
      }

      // Update pagination buttons
      const prevPageButton = dom.$("#prevPage");
      const nextPageButton = dom.$("#nextPage");
      if (prevPageButton) {
        prevPageButton.disabled = this.currentPage === 1;
      }
      if (nextPageButton) {
        nextPageButton.disabled = this.currentPage >= this.totalPages;
      }

      // Update page number display if it exists
      const pageDisplay = dom.$("#pageDisplay");
      if (pageDisplay) {
        pageDisplay.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
      }
    } catch (error) {
      console.error("Failed to load popular media:", error);
    }
  }
}
