import { dom } from "../utils/helpers";
import { apiService } from "../api/apiService";

export class MediaDetails {
  constructor(mediaPlayer) {
    this.mediaPlayer = mediaPlayer;
    this.template = null;
    this.currentMedia = null;
    this.currentMediaType = null;
    this.loadTemplate();
  }

  async loadTemplate() {
    try {
      const response = await fetch("/src/templates/mediaTemplate.html");
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status}`);
      }
      this.template = await response.text();
    } catch (error) {
      console.error("Failed to load media template:", error);
      this.template = `
        <div class="container mx-auto p-4">
          <div class="text-center text-red-500">
            Error loading template. Please try refreshing the page.
          </div>
        </div>`;
    }
  }

  formatCurrency(value) {
    return value ? `$${value.toLocaleString()}` : "Unknown";
  }

  generateRatingsHtml(voteAverage) {
    return `
      <div class="flex items-center space-x-2">
        <i class="fas fa-star text-yellow-400"></i>
        <span class="text-lg font-semibold text-white">${voteAverage.toFixed(
          1
        )}</span>
        <span class="text-sm text-gray-400">/10</span>
      </div>`;
  }

  generatePopularityHtml(popularity) {
    return `
      <div class="flex items-center space-x-2">
        <i class="fas fa-fire text-orange-500"></i>
        <span class="text-lg font-semibold text-white">${popularity.toFixed(
          1
        )}</span>
        <span class="text-sm text-gray-400">Popularity</span>
      </div>`;
  }

  generateCastList(cast) {
    return cast
      .slice(0, 5)
      .map(
        (actor) => `
      <div class="flex-shrink-0 w-28 mx-2 text-center">
        <div class="w-28 h-28 mx-auto mb-2 rounded-full overflow-hidden border-2 border-purple-500 shadow-lg">
          <img src="${
            actor.profile_path
              ? "https://image.tmdb.org/t/p/w500" + actor.profile_path
              : "/placeholder-actor.jpeg"
          }" 
               alt="${actor.name}" 
               class="w-full h-full object-cover"
               onerror="this.src='/placeholder-actor.jpeg';">
        </div>
        <p class="text-white font-semibold text-sm truncate">${actor.name}</p>
        <p class="text-gray-400 text-xs truncate">${actor.character}</p>
      </div>
    `
      )
      .join("");
  }

  async displayMedia(media, mediaType) {
    this.currentMedia = media;
    this.currentMediaType = mediaType;

    // Wait for template to load if it hasn't already
    if (!this.template) {
      await new Promise((resolve) => {
        const checkTemplate = () => {
          if (this.template) {
            resolve();
          } else {
            setTimeout(checkTemplate, 100);
          }
        };
        checkTemplate();
      });
    }

    try {
      const [mediaData, castData] = await Promise.all([
        apiService.getMediaDetails(media.id, mediaType),
        apiService.getCastData(media.id, mediaType),
      ]);

      const genres =
        mediaData.genres?.map((genre) => genre.name).join(", ") ||
        "Unknown Genre";
      const language = mediaData.original_language?.toUpperCase() || "Unknown";
      const releaseDate =
        media.release_date || media.first_air_date || "Unknown Release Date";
      const productionCompanies =
        mediaData.production_companies
          ?.map((company) => company.name)
          .join(", ") || "Unknown Production Companies";
      const budget =
        mediaType === "movie" ? this.formatCurrency(mediaData.budget) : "N/A";
      const revenue =
        mediaType === "movie" ? this.formatCurrency(mediaData.revenue) : "N/A";
      const runtime =
        mediaType === "movie"
          ? `${mediaData.runtime || "N/A"} min`
          : `${Math.round(
              (mediaData.episode_run_time || [0]).reduce((a, b) => a + b, 0) /
                mediaData.episode_run_time?.length || 0
            )} min per episode`;

      // Get the existing containers
      const selectedMediaSection = dom.$("#selectedMediaSection");
      const selectedMovie = dom.$("#selectedMovie");

      if (!selectedMediaSection || !selectedMovie) {
        console.error("Required containers not found");
        return;
      }

      // Show the section
      selectedMediaSection.classList.remove("hidden");

      // Handle null poster path
      const posterPath = media.poster_path 
        ? `https://image.tmdb.org/t/p/original${media.poster_path}`
        : '/placeholder.jpeg';

      // Update the content
      const populatedTemplate = this.template
        .replace(/https:\/\/image\.tmdb\.org\/t\/p\/original{{poster_path}}/g, posterPath)
        .replace(/{{title_or_name}}/g, media.title || media.name)
        .replace(/{{release_date_or_first_air_date}}/g, releaseDate)
        .replace(/{{overview}}/g, media.overview || "No overview available.")
        .replace(/{{type}}/g, mediaType === "movie" ? "Movie" : "TV Show")
        .replace(/{{language}}/g, language)
        .replace(/{{genres}}/g, genres)
        .replace(/{{runtime}}/g, runtime)
        .replace(/{{budget}}/g, budget)
        .replace(/{{revenue}}/g, revenue)
        .replace(
          /{{ratings}}/g,
          this.generateRatingsHtml(mediaData.vote_average)
        )
        .replace(
          /{{popularity}}/g,
          this.generatePopularityHtml(mediaData.popularity)
        )
        .replace(/{{cast_list}}/g, this.generateCastList(castData.cast))
        .replace(/{{production_companies}}/g, productionCompanies);

      selectedMovie.innerHTML = populatedTemplate;

      // Add error handler for poster image
      const posterImg = selectedMovie.querySelector('#poster');
      if (posterImg) {
        posterImg.onerror = function() {
          this.src = '/placeholder.jpeg';
        };
      }

      // Setup event listeners
      this.setupEventListeners(media, mediaType);

      // Scroll to the section
      selectedMediaSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Show/hide episode selection for TV shows
      const selectEpisodeButton = dom.$("#selectEpisodeButton");
      const episodeButtonContainer = selectEpisodeButton?.parentElement;
      if (episodeButtonContainer) {
        if (mediaType === "movie") {
          episodeButtonContainer.classList.add("hidden");
        } else {
          episodeButtonContainer.classList.remove("hidden");
          // Check for stored episode selection
          const storedData = JSON.parse(
            localStorage.getItem("vidLinkProgress") || "{}"
          );
          const progressData = storedData[media.id];
          if (progressData && progressData.type === "tv") {
            selectEpisodeButton.innerHTML = `<i class="fas fa-list mr-2"></i>Selected: S${progressData.last_season_watched}E${progressData.last_episode_watched}`;
          }
        }
      }

      // Reset video player state
      const videoPlayer = dom.$("#videoPlayer");
      const closePlayerButton = dom.$("#closePlayerButton");
      if (videoPlayer && closePlayerButton) {
        videoPlayer.classList.add("hidden");
        closePlayerButton.classList.add("hidden");
      }
    } catch (error) {
      console.error("Failed to display media details:", error);
      throw error;
    }
  }

  setupEventListeners(media, mediaType) {
    const playButton = dom.$("#playButton");
    const closePlayerButton = dom.$("#closePlayerButton");
    const languageSelect = dom.$("#languageSelect");
    const providerSelect = dom.$("#providerSelect");
    const selectEpisodeButton = dom.$("#selectEpisodeButton");
    const orientationLockToggle = dom.$("#orientationLockToggle");
    const shareButton = dom.$("#shareButton");
    const autoFullscreenContainer = dom.$("#autoFullscreenToggle")?.parentElement;

    // Remove autofullscreen toggle on mobile
    if (window.innerWidth <= 768 && autoFullscreenContainer) {
      autoFullscreenContainer.remove();
    }

    if (playButton) {
      dom.on(playButton, "click", () => {
        this.mediaPlayer.displayMedia(media, mediaType);
        playButton.classList.add("hidden");
        closePlayerButton?.classList.remove("hidden");
      });
    }

    if (closePlayerButton) {
      dom.on(closePlayerButton, "click", () => {
        const videoPlayer = dom.$("#videoPlayer");
        if (videoPlayer) {
          videoPlayer.innerHTML = "";
          videoPlayer.classList.add("hidden");
        }
        closePlayerButton.classList.add("hidden");
        playButton?.classList.remove("hidden");
      });
    }

    if (languageSelect) {
      dom.on(languageSelect, "change", () => {
        if (providerSelect) {
          providerSelect.classList.toggle(
            "hidden",
            languageSelect.value === "fr"
          );
        }
        this.mediaPlayer.displayMedia(media, mediaType);
      });
    }

    if (providerSelect) {
      dom.on(providerSelect, "change", () => {
        this.mediaPlayer.selectedProvider = providerSelect.value;
        this.mediaPlayer.displayMedia(media, mediaType);
      });
    }

    if (selectEpisodeButton && mediaType === "tv") {
      dom.on(selectEpisodeButton, "click", () => {
        const episodeModal = window.episodeModal;
        if (episodeModal) {
          episodeModal.show(media);
        }
      });
    }

    if (orientationLockToggle) {
      const storedState = localStorage.getItem("orientationLock") === "true";
      orientationLockToggle.checked = storedState;

      dom.on(orientationLockToggle, "change", (e) => {
        localStorage.setItem("orientationLock", e.target.checked);
      });
    }

    if (shareButton) {
      dom.on(shareButton, "click", async () => {
        const originalText = '<i class="fas fa-share-alt mr-2"></i>Share';
        try {
          if (navigator.share) {
            await navigator.share({
              title: media.title || media.name,
              url: window.location.href,
            });
          } else {
            await navigator.clipboard.writeText(window.location.href);
            // Show a temporary success message
            shareButton.innerHTML =
              '<i class="fas fa-check mr-2"></i>Link Copied!';
            setTimeout(() => {
              shareButton.innerHTML = originalText;
            }, 2000);
          }
        } catch (error) {
          console.error("Error sharing:", error);
          // Show error message
          shareButton.innerHTML =
            '<i class="fas fa-exclamation-circle mr-2"></i>Failed to Share';
          setTimeout(() => {
            shareButton.innerHTML = originalText;
          }, 2000);
        }
      });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      const autoFullscreenContainer = dom.$("#autoFullscreenToggle")?.parentElement;
      if (window.innerWidth <= 768 && autoFullscreenContainer) {
        autoFullscreenContainer.remove();
      }
    });
  }
}
