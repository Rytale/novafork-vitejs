import { dom } from '../utils/helpers';
import { apiService } from '../api/apiService';

export class EpisodeModal {
  constructor() {
    this.modal = null;
    this.setupModal();
    this.setupEventListeners();
  }

  setupModal() {
    // Get or create modal container
    let modalContainer = dom.$('#episodeModal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'episodeModal';
      modalContainer.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center hidden z-50';
      document.body.appendChild(modalContainer);
    }

    this.modal = modalContainer;
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

  async show(media) {
    if (!this.modal) return;

    try {
      const tvShowData = await apiService.getMediaDetails(media.id, 'tv');
      const seasons = tvShowData.seasons.filter(season => season.season_number !== 0);

      if (seasons.length === 0) {
        alert('No seasons available for this show.');
        return;
      }

      // Get stored progress data
      const storedData = JSON.parse(localStorage.getItem('vidLinkProgress') || '{}');
      const progressData = storedData[media.id];

      this.modal.innerHTML = `
        <div class="bg-[#1a1a1a] rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex flex-col md:flex-row">
            <!-- Seasons List -->
            <div class="md:w-1/3 border-r border-gray-800 pr-4">
              <h3 class="text-xl font-bold text-white mb-4">Seasons</h3>
              <div class="space-y-4">
                ${seasons.map(season => {
                  const seasonNumber = season.season_number;
                  const episodesInSeason = season.episode_count;
                  const progressKey = `s${seasonNumber}`;
                  const seasonProgress = storedData[progressKey] || { watched: 0 };
                  const progressPercentage = Math.round((seasonProgress.watched / episodesInSeason) * 100);

                  return `
                    <div class="season-item cursor-pointer hover:bg-gray-800 p-3 rounded transition-colors"
                         data-season="${seasonNumber}">
                      <div class="flex items-center space-x-4">
                        <img src="${season.poster_path ? 'https://image.tmdb.org/t/p/w200' + season.poster_path : '/placeholder-poster.jpg'}"
                             alt="Season ${seasonNumber}"
                             class="w-16 h-24 object-cover rounded">
                        <div>
                          <h4 class="text-white font-semibold">Season ${seasonNumber}</h4>
                          <p class="text-gray-400 text-sm">${episodesInSeason} Episodes</p>
                          <div class="w-full bg-gray-800 h-1 rounded-full mt-2">
                            <div class="bg-purple-600 h-full rounded-full" style="width: ${progressPercentage}%;"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Episodes List -->
            <div class="md:w-2/3 pl-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-white">Episodes</h3>
                <input type="text" placeholder="Search episodes..."
                       class="px-4 py-2 bg-[#0a0a0a] text-white rounded border border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                       id="episodeSearch">
              </div>
              <div id="episodesList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Episodes will be loaded here -->
              </div>
            </div>
          </div>

          <button class="absolute top-4 right-4 text-gray-400 hover:text-white">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
      `;

      this.modal.classList.remove('hidden');
      this.setupSeasonClickHandlers(media);
      this.setupEpisodeSearch();

      // Load first season or last watched season
      const initialSeason = progressData?.last_season_watched || 1;
      this.loadEpisodes(media.id, initialSeason);
    } catch (error) {
      console.error('Failed to load episodes:', error);
      alert('Failed to load episodes. Please try again.');
    }
  }

  async loadEpisodes(tvShowId, seasonNumber) {
    try {
      const seasonData = await apiService.getSeasonDetails(tvShowId, seasonNumber);
      const episodesList = dom.$('#episodesList');
      
      if (!episodesList) return;

      const storedData = JSON.parse(localStorage.getItem('vidLinkProgress') || '{}');

      episodesList.innerHTML = seasonData.episodes.map(episode => {
        const episodeKey = `s${seasonNumber}e${episode.episode_number}`;
        const progress = storedData[episodeKey] || { watched: 0, duration: 0 };
        const progressPercentage = progress.duration ? (progress.watched / progress.duration) * 100 : 0;

        return `
          <div class="episode-item bg-[#0a0a0a] rounded overflow-hidden cursor-pointer hover:transform hover:scale-105 transition-all duration-300"
               data-episode="${episode.episode_number}">
            <img src="${episode.still_path ? 'https://image.tmdb.org/t/p/w300' + episode.still_path : '/placeholder-episode.jpg'}"
                 alt="Episode ${episode.episode_number}"
                 class="w-full h-40 object-cover">
            <div class="p-4">
              <h4 class="text-white font-semibold mb-1">Episode ${episode.episode_number}: ${episode.name}</h4>
              <p class="text-gray-400 text-sm mb-2">${episode.overview.substring(0, 100)}...</p>
              <div class="w-full bg-gray-800 h-1 rounded-full">
                <div class="bg-purple-600 h-full rounded-full" style="width: ${progressPercentage}%;"></div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      this.setupEpisodeClickHandlers(tvShowId, seasonNumber);
    } catch (error) {
      console.error('Failed to load episodes:', error);
    }
  }

  setupSeasonClickHandlers(media) {
    const seasonItems = dom.$$('.season-item');
    seasonItems.forEach(item => {
      dom.on(item, 'click', () => {
        const seasonNumber = parseInt(item.dataset.season, 10);
        this.loadEpisodes(media.id, seasonNumber);
      });
    });
  }

  setupEpisodeClickHandlers(tvShowId, seasonNumber) {
    const episodeItems = dom.$$('.episode-item');
    episodeItems.forEach(item => {
      dom.on(item, 'click', () => {
        const episodeNumber = parseInt(item.dataset.episode, 10);
        this.selectEpisode(tvShowId, seasonNumber, episodeNumber);
      });
    });
  }

  setupEpisodeSearch() {
    const searchInput = dom.$('#episodeSearch');
    if (searchInput) {
      dom.on(searchInput, 'input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const episodes = dom.$$('.episode-item');
        
        episodes.forEach(episode => {
          const title = episode.querySelector('h4').textContent.toLowerCase();
          const overview = episode.querySelector('p').textContent.toLowerCase();
          
          if (title.includes(searchTerm) || overview.includes(searchTerm)) {
            episode.style.display = '';
          } else {
            episode.style.display = 'none';
          }
        });
      });
    }
  }

  selectEpisode(tvShowId, seasonNumber, episodeNumber) {
    // Update progress in localStorage
    const storedData = JSON.parse(localStorage.getItem('vidLinkProgress') || '{}');
    
    if (!storedData[tvShowId]) {
      storedData[tvShowId] = {
        id: tvShowId,
        type: 'tv',
        last_season_watched: seasonNumber.toString(),
        last_episode_watched: episodeNumber.toString(),
        show_progress: {}
      };
    }

    const episodeKey = `s${seasonNumber}e${episodeNumber}`;
    storedData[tvShowId].show_progress[episodeKey] = {
      season: seasonNumber.toString(),
      episode: episodeNumber.toString(),
      progress: {
        watched: 0,
        duration: 0
      },
      last_updated: Date.now()
    };

    localStorage.setItem('vidLinkProgress', JSON.stringify(storedData));

    // Update UI
    const selectEpisodeButton = dom.$('#selectEpisodeButton');
    if (selectEpisodeButton) {
      selectEpisodeButton.innerHTML = `<i class="fas fa-list mr-2"></i>Selected: S${seasonNumber}E${episodeNumber}`;
    }

    this.hide();
  }

  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }
}
