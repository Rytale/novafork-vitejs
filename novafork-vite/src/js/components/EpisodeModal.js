import { dom } from "../utils/helpers";
import { apiService } from "../api/apiService";
import { API_CONFIG } from "../api/config";

export class EpisodeModal {
  constructor(mediaPlayer) {
    this.mediaPlayer = mediaPlayer;
    this.modal = dom.$("#episodeModal");
    this.currentMedia = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.modal) return;

    // Close modal when clicking outside
    dom.on(this.modal, "click", (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Close modal when pressing escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hide();
      }
    });
  }

  async show(media) {
    if (!this.modal) return;
    this.currentMedia = media;

    try {
      const details = await apiService.getMediaDetails(media.id, "tv");
      const seasons = details.seasons || [];
      const storedData = JSON.parse(
        localStorage.getItem("vidLinkProgress") || "{}"
      );
      const progressData = storedData[media.id] || {};
      const lastSeasonWatched = progressData.last_season_watched || 1;
      const lastEpisodeWatched = progressData.last_episode_watched || 1;

      // Get season details for the last watched season
      const seasonDetails = await apiService.getSeasonDetails(
        media.id,
        lastSeasonWatched
      );

      const content = `
        <div class="relative bg-[#141414] text-white max-w-5xl w-full mx-4 rounded-lg overflow-hidden">
          <div class="flex justify-between items-center p-4 border-b border-gray-800">
            <h2 class="text-2xl font-bold">Select Episode</h2>
            <button id="closeModalBtn" class="text-gray-400 hover:text-white transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="flex h-[600px]">
            <!-- Seasons List -->
            <div class="w-64 bg-[#1a1a1a] border-r border-gray-800 overflow-y-auto">
              <div class="p-4">
                <h3 class="text-lg font-semibold mb-4">Seasons</h3>
                <div class="space-y-2">
                  ${seasons
                    .map(
                      (season) => `
                    <button 
                      class="w-full text-left px-4 py-3 rounded ${
                        season.season_number === lastSeasonWatched
                          ? "bg-[#333333] text-white"
                          : "text-gray-400 hover:bg-[#262626]"
                      } transition-colors"
                      data-season="${season.season_number}">
                      <div class="font-medium">Season ${
                        season.season_number
                      }</div>
                      <div class="text-sm text-gray-500">${
                        season.episode_count
                      } Episodes</div>
                    </button>
                  `
                    )
                    .join("")}
                </div>
              </div>
            </div>

            <!-- Episodes List -->
            <div class="flex-1 overflow-y-auto p-4" id="episodesList">
              ${this.generateEpisodesList(seasonDetails.episodes)}
            </div>
          </div>
        </div>
      `;

      this.modal.innerHTML = content;
      this.modal.classList.add("active");

      // Setup event listeners
      const seasonButtons = this.modal.querySelectorAll("[data-season]");
      const closeButton = this.modal.querySelector("#closeModalBtn");
      const episodesList = this.modal.querySelector("#episodesList");

      seasonButtons.forEach((button) => {
        dom.on(button, "click", async (e) => {
          e.stopPropagation(); // Prevent event bubbling
          const selectedSeason = parseInt(button.dataset.season);
          // Update active season button
          seasonButtons.forEach((btn) => {
            btn.classList.remove("bg-[#333333]", "text-white");
            btn.classList.add("text-gray-400", "hover:bg-[#262626]");
          });
          button.classList.remove("text-gray-400", "hover:bg-[#262626]");
          button.classList.add("bg-[#333333]", "text-white");

          // Fetch and update episodes list
          const newSeasonDetails = await apiService.getSeasonDetails(
            media.id,
            selectedSeason
          );
          episodesList.innerHTML = this.generateEpisodesList(
            newSeasonDetails.episodes
          );
          this.setupEpisodeClickHandlers(media);
        });
      });

      if (closeButton) {
        dom.on(closeButton, "click", (e) => {
          e.stopPropagation(); // Prevent event bubbling
          this.hide();
        });
      }

      this.setupEpisodeClickHandlers(media);
    } catch (error) {
      console.error("Error loading episode modal:", error);
    }
  }

  generateEpisodesList(episodes) {
    if (!episodes || !episodes.length) return "";

    return `
      <div class="grid gap-4">
        ${episodes
          .map((episode) => {
            const stillPath = episode.still_path
              ? `${API_CONFIG.imageBaseUrl}/${API_CONFIG.imageSizes.backdrop.small}${episode.still_path}`
              : "https://via.placeholder.com/128x72";

            return `
            <div class="episode-item bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#262626] transition-colors cursor-pointer"
                 data-episode="${episode.episode_number}">
              <div class="flex items-center p-4">
                <div class="w-32 h-20 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                  <img src="${stillPath}" alt="Episode ${
              episode.episode_number
            }" class="w-full h-full object-cover">
                </div>
                <div class="ml-4 flex-1">
                  <div class="flex justify-between items-start">
                    <div class="text-lg font-medium">Episode ${
                      episode.episode_number
                    }: ${episode.name}</div>
                    <div class="text-sm text-gray-400">${
                      episode.runtime || 0
                    } min</div>
                  </div>
                  <p class="text-sm text-gray-400 mt-1 line-clamp-2">${
                    episode.overview || "No description available"
                  }</p>
                </div>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  }

  setupEpisodeClickHandlers(media) {
    const episodeItems = this.modal.querySelectorAll(".episode-item");
    const seasonButtons = this.modal.querySelectorAll("[data-season]");
    const activeSeason = Array.from(seasonButtons).find((btn) =>
      btn.classList.contains("bg-[#333333]")
    );

    episodeItems.forEach((item) => {
      dom.on(item, "click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
        const selectedSeason = parseInt(activeSeason.dataset.season);
        const selectedEpisode = parseInt(item.dataset.episode);
        this.saveProgress(media.id, selectedSeason, selectedEpisode);
        this.mediaPlayer.displayMedia(media, "tv");
        this.hide();
      });
    });
  }

  hide() {
    if (this.modal) {
      this.modal.classList.remove("active");
    }
  }

  saveProgress(mediaId, season, episode) {
    try {
      const storedData = JSON.parse(
        localStorage.getItem("vidLinkProgress") || "{}"
      );
      storedData[mediaId] = {
        type: "tv",
        last_season_watched: season,
        last_episode_watched: episode,
        timestamp: Date.now(),
      };
      localStorage.setItem("vidLinkProgress", JSON.stringify(storedData));
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }
}
