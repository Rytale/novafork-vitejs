import { dom } from "../utils/helpers";
import { DEV_CONFIG } from "../api/config";

export class MediaPlayer {
  constructor() {
    this.selectedProvider = "vidbinge";
    this.currentProviderIndex = 0;
    this.providerPriority = [
      // Best providers first
      "vidbinge",
      "vidsrcnl",
      "filmxy",
      // Alternative providers
      "vidlink",
      "vidsrc",
      "embedsu",
      "vidsrcicu",
      "vidsrcpro",
      "autoembed",
      "nontonGo",
      "vidsrcxyz",
      "embedsoap",
      "smashystream",
      "2embed",
      "moviesapi",
      "1vid1shar",
      "moviee",
      "multiembed",
      "multiembedvip",
      // Anime providers
      "AdminHiHi",
      "2anime",
      "anime",
      "2animesub",
      "trailer",
    ];
    this.providerNames = {
      vidbinge: "VidBinge - 4k",
      vidsrcnl: "VidSrc NL",
      filmxy: "Filmxy - Multi Lang",
      vidlink: "VidLink - ads",
      vidsrc: "VidSrc - Ads",
      embedsu: "Embedsu - ads",
      vidsrcicu: "VidSrc ICU - Ads",
      vidsrcpro: "VidSrcPro - Ads",
      autoembed: "AutoEmbed - Ads",
      nontonGo: "NontonGo - Ads",
      vidsrcxyz: "VidSrcXYZ - Ads",
      embedsoap: "EmbedSoap - Ads",
      smashystream: "SmashyStream - Ads",
      "2embed": "2Embed - Ads",
      moviesapi: "MoviesAPI - Decent Provider",
      "1vid1shar": "1Vid1Shar - Ads",
      moviee: "Moviee - Ads",
      multiembed: "MultiEmbed - Ads",
      multiembedvip: "MultiEmbedVIP - Ads",
      AdminHiHi: "AdminHiHi - Dubbed Episodes (No Ads)",
      "2anime": "2Anime - Dub Only",
      anime: "Anime - Sub Only",
      "2animesub": "2Anime - Sub Only",
      trailer: "Trailer",
    };
    this.loadingMessages = [
      {
        message: "Contacting server...",
        icon: "<i class='fas fa-satellite'></i>",
      },
      { message: "Fetching data...", icon: "<i class='fas fa-download'></i>" },
      { message: "URL received...", icon: "<i class='fas fa-link'></i>" },
      { message: "Parsing data...", icon: "<i class='fas fa-search'></i>" },
      { message: "Streaming in 4K HDR...", icon: "<i class='fas fa-tv'></i>" },
      {
        message: "Almost ready...",
        icon: "<i class='fas fa-hourglass-half'></i>",
      },
    ];
    this.setupOrientationLock();
  }

  async getMovieEmbedUrl(mediaId, provider) {
    const primaryColor = "#FFFFFF";
    const secondaryColor = "#FFFFFF";
    const iconColor = "#FFFFFF";

    switch (provider) {
      case "vidsrcxyz":
        return `https://vidsrc.xyz/embed/movie/${mediaId}`;
      case "embedsoap":
        return `https://www.embedsoap.com/embed/movie/?id=${mediaId}`;
      case "autoembed":
        return `https://player.autoembed.cc/embed/movie/${mediaId}`;
      case "smashystream":
        return `https://player.smashy.stream/movie/${mediaId}`;
      case "anime":
        return `https://anime.autoembed.cc/embed/${mediaId}-episode-1`;
      case "2animesub":
        return `https://2anime.xyz/embed/${mediaId}-episode-1`;
      case "2embed":
        return `https://www.2embed.cc/embed/${mediaId}`;
      case "nontonGo":
        return `https://www.NontonGo.win/embed/movie/${mediaId}`;
      case "AdminHiHi":
        const movieSlug = mediaId.replace(/\s+/g, "-");
        return `https://embed.anicdn.top/v/${movieSlug}-dub/1.html`;
      case "vidlink":
        return `https://vidlink.pro/movie/${mediaId}?primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&autoplay=false`;
      case "vidlinkdub":
        return `https://vidlink.pro/movie/${mediaId}?player=jw&multiLang=true&primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}`;
      case "vidsrcnl":
        return `https://player.vidsrc.nl/embed/movie/${mediaId}`;
      case "vidsrc.rip":
        return `https://vidsrc.rip/embed/movie/${mediaId}`;
      case "vidbinge":
        return `https://vidbinge.dev/embed/movie/${mediaId}`;
      case "moviesapi":
        return `https://moviesapi.club/movie/${mediaId}`;
      case "moviee":
        return `https://moviee.tv/embed/movie/${mediaId}`;
      case "multiembed":
        return `https://multiembed.mov/?video_id=${mediaId}&tmdb=1`;
      case "embedsu":
        return `https://embed.su/embed/movie/${mediaId}`;
      case "multiembedvip":
        return `https://multiembed.mov/directstream.php?video_id=${mediaId}&tmdb=1`;
      case "vidsrcicu":
        return `https://vidsrc.icu/embed/movie/${mediaId}`;
      case "cinescrape":
        try {
          const randomDelay =
            Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
          await new Promise((resolve) => setTimeout(resolve, randomDelay));

          const response = await fetch(
            `https://scraper.cinescrape.com/movie/${mediaId}`
          );
          if (!response.ok) throw new Error("Network response was not ok");
          const data = await response.json();

          const movieSource = data.find(
            (source) => source.quality === "2160p" || source.quality === "1080p"
          );

          if (
            movieSource &&
            movieSource.metadata &&
            movieSource.metadata.baseUrl
          ) {
            let streamUrl = movieSource.metadata.baseUrl + ".mpd";
            const urlObj = new URL(streamUrl);
            urlObj.protocol = "https:";
            return urlObj.toString();
          } else {
            throw new Error("No suitable 2160p or 1080p stream link found");
          }
        } catch (error) {
          console.error("Error fetching video from Cinescrape:", error);
          throw error;
        }
      default:
        throw new Error("Provider not recognized.");
    }
  }

  async getTvEmbedUrl(mediaId, seasonId, episodeId, provider) {
    const primaryColor = "#FFFFFF";
    const secondaryColor = "#FFFFFF";
    const iconColor = "#FFFFFF";

    switch (provider) {
      case "vidsrcxyz":
        return `https://vidsrc.xyz/embed/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "embedsoap":
        return `https://www.embedsoap.com/embed/tv/?id=${mediaId}&s=${seasonId}&e=${episodeId}`;
      case "autoembed":
        return `https://player.autoembed.cc/embed/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "smashystream":
        return `https://player.smashy.stream/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "anime":
        return `https://anime.autoembed.cc/embed/${mediaId}-episode-${episodeId}`;
      case "2animesub":
        return `https://2anime.xyz/embed/${mediaId}-episode-${episodeId}`;
      case "2embed":
        return `https://www.2embed.cc/embedtv/${mediaId}&s=${seasonId}&e=${episodeId}`;
      case "nontonGo":
        return `https://www.NontonGo.win/embed/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "AdminHiHi":
        const tvSlug = mediaId.replace(/\s+/g, "-");
        return `https://embed.anicdn.top/v/${tvSlug}-dub/${episodeId}.html`;
      case "vidlink":
        return `https://vidlink.pro/tv/${mediaId}/${seasonId}/${episodeId}?primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&autoplay=false`;
      case "vidlinkdub":
        return `https://vidlink.pro/tv/${mediaId}/${seasonId}/${episodeId}?player=jw&multiLang=true&primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}`;
      case "vidsrcnl":
        return `https://player.vidsrc.nl/embed/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "vidsrc.rip":
        return `https://vidsrc.rip/embed/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "vidbinge":
        return `https://vidbinge.dev/embed/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "moviesapi":
        return `https://moviesapi.club/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "moviee":
        return `https://moviee.tv/embed/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "multiembed":
        return `https://multiembed.mov/?video_id=${mediaId}&tmdb=1&s=${seasonId}&e=${episodeId}`;
      case "embedsu":
        return `https://embed.su/embed/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "multiembedvip":
        return `https://multiembed.mov/directstream.php?video_id=${mediaId}&tmdb=1&s=${seasonId}&e=${episodeId}`;
      case "vidsrcicu":
        return `https://vidsrc.icu/embed/tv/${mediaId}/${seasonId}/${episodeId}`;
      case "cinescrape":
        try {
          const randomDelay =
            Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
          await new Promise((resolve) => setTimeout(resolve, randomDelay));

          const response = await fetch(
            `https://scraper.cinescrape.com/tv/${mediaId}/${seasonId}/${episodeId}`
          );
          if (!response.ok) throw new Error("Network response was not ok");
          const data = await response.json();

          const tvSource = data.find(
            (source) => source.quality === "2160p" || source.quality === "1080p"
          );

          if (tvSource && tvSource.metadata && tvSource.metadata.baseUrl) {
            let streamUrl = tvSource.metadata.baseUrl + ".mpd";
            const urlObj = new URL(streamUrl);
            urlObj.protocol = "https:";
            return urlObj.toString();
          } else {
            throw new Error("No suitable 2160p or 1080p stream link found");
          }
        } catch (error) {
          console.error("Error fetching video from Cinescrape:", error);
          throw error;
        }
      default:
        throw new Error("Provider not recognized.");
    }
  }

  showStatus(message, isError = false) {
    const status = dom.$("#providerStatus");
    const statusText = dom.$("#providerStatusText");
    if (!status || !statusText) return;

    statusText.innerHTML = message;
    status.classList.remove("hidden");
    status.classList.toggle("bg-red-900", isError);
    status.classList.toggle("bg-black", !isError);
  }

  hideStatus() {
    const status = dom.$("#providerStatus");
    if (status) {
      status.classList.add("hidden");
    }
  }

  showLoadingScreen(time = 2500) {
    if (!DEV_CONFIG.showLoadingAnimation) return;
    if (!DEV_CONFIG.loadingProviders.includes(this.selectedProvider)) return;

    const loadingScreen = dom.$("#loadingScreen");
    const progressBar = dom.$("#progressBar");
    const loadingMessage = dom.$("#loadingMessage");

    if (!loadingScreen || !progressBar || !loadingMessage) return;

    let currentProgress = 0;
    loadingScreen.classList.remove("hidden");

    const interval = setInterval(() => {
      if (currentProgress >= 100) {
        clearInterval(interval);
        loadingScreen.classList.add("hidden");
      } else {
        currentProgress += Math.floor(Math.random() * 15) + 5;
        progressBar.style.width = `${currentProgress}%`;
        const messageIndex = Math.min(
          Math.floor(currentProgress / 20),
          this.loadingMessages.length - 1
        );
        loadingMessage.innerHTML = `${this.loadingMessages[messageIndex].icon} ${this.loadingMessages[messageIndex].message}`;
      }
    }, time / 20);
  }

  hideLoadingScreen() {
    const loadingScreen = dom.$("#loadingScreen");
    if (loadingScreen) {
      loadingScreen.classList.add("hidden");
    }
  }

  async tryNextProvider(media, mediaType) {
    this.currentProviderIndex++;
    if (this.currentProviderIndex >= this.providerPriority.length) {
      this.currentProviderIndex = 0;
      throw new Error("All providers failed");
    }
    this.selectedProvider = this.providerPriority[this.currentProviderIndex];
    const providerName =
      this.providerNames[this.selectedProvider] || this.selectedProvider;
    this.showStatus(`Source not found, trying ${providerName}...`);
    await this.displayMedia(media, mediaType, true);
  }

  async checkVideoLoad(iframe) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 10000);

      const checkInterval = setInterval(() => {
        try {
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow.document;
          const videoElement = iframeDoc.querySelector("video");
          if (videoElement) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve(true);
          }
        } catch (e) {
          // Cross-origin error, wait for load event
        }
      }, 1000);

      iframe.onload = () => {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        setTimeout(async () => {
          try {
            const iframeDoc =
              iframe.contentDocument || iframe.contentWindow.document;
            const videoElement = iframeDoc.querySelector("video");
            resolve(!!videoElement);
          } catch (e) {
            resolve(true);
          }
        }, 2000);
      };
    });
  }

  async displayMedia(media, mediaType, isRetry = false) {
    const videoPlayer = dom.$("#videoPlayer");
    const selectedSection = dom.$("#selectedMediaSection");
    const providerSelect = dom.$("#providerSelect");

    if (!videoPlayer || !selectedSection) return;

    try {
      const provider = this.selectedProvider;
      const providerName = this.providerNames[provider] || provider;
      let embedUrl;

      if (!isRetry) {
        this.showStatus(`Loading from ${providerName}...`);
      }

      if (mediaType === "movie") {
        embedUrl = await this.getMovieEmbedUrl(media.id, provider);
      } else if (mediaType === "tv") {
        const storedData = JSON.parse(
          localStorage.getItem("vidLinkProgress") || "{}"
        );
        const progressData = storedData[media.id];
        const seasonId = progressData?.last_season_watched || 1;
        const episodeId = progressData?.last_episode_watched || 1;
        embedUrl = await this.getTvEmbedUrl(
          media.id,
          seasonId,
          episodeId,
          provider
        );
      }

      if (
        !isRetry &&
        DEV_CONFIG.showLoadingAnimation &&
        DEV_CONFIG.loadingProviders.includes(provider)
      ) {
        this.showLoadingScreen();
      }

      selectedSection.classList.remove("hidden");
      videoPlayer.classList.remove("hidden");

      const iframeHtml = `
        <iframe 
          src="${embedUrl}" 
          id="videoIframe"
          class="w-full h-[600px]" 
          allowfullscreen="true"
          webkitallowfullscreen="true" 
          mozallowfullscreen="true"
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
          loading="lazy"
          playsinline
          webkit-playsinline>
        </iframe>
      `;

      videoPlayer.innerHTML = iframeHtml;

      if (providerSelect) {
        providerSelect.value = provider;
      }

      const iframe = dom.$("#videoIframe");

      // Add touch event listener for mobile
      iframe.addEventListener(
        "touchend",
        () => {
          this.attemptFullscreenAndLockOrientation(iframe);
        },
        { once: true }
      );

      const videoLoaded = await this.checkVideoLoad(iframe);

      if (!videoLoaded) {
        console.log(
          `Provider ${provider} failed to load video, trying next provider...`
        );
        await this.tryNextProvider(media, mediaType);
        return;
      }

      this.hideStatus();
      this.attemptFullscreenAndLockOrientation(iframe);
    } catch (error) {
      console.error("Error displaying media:", error);
      if (!isRetry) {
        try {
          await this.tryNextProvider(media, mediaType);
        } catch (e) {
          console.error("All providers failed:", e);
          this.showStatus("No working sources found", true);
          selectedSection.classList.add("hidden");
        }
      } else {
        this.showStatus("No working sources found", true);
        selectedSection.classList.add("hidden");
      }
    }
  }

  attemptFullscreenAndLockOrientation(element) {
    if (!element) return;

    const orientationLockEnabled =
      localStorage.getItem("orientationLock") === "true";

    // Check if device supports orientation
    const isMobileDevice =
      "orientation" in window ||
      ("screen" in window && "orientation" in window.screen);

    // Only handle orientation lock on mobile devices
    if (isMobileDevice) {
      if (orientationLockEnabled) {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch((err) => {
            console.warn("Orientation lock failed:", err);
          });
        } else if (screen.lockOrientation) {
          screen.lockOrientation("landscape").catch((err) => {
            console.warn("Legacy orientation lock failed:", err);
          });
        }
      }
      return; // Skip fullscreen on mobile
    }

    // Handle fullscreen only on desktop
    const autoFullscreenEnabled =
      dom.$("#autoFullscreenToggle")?.checked ?? true;

    if (autoFullscreenEnabled) {
      element.addEventListener("load", () => {
        try {
          const iframeDoc =
            element.contentDocument || element.contentWindow.document;
          const videoElement = iframeDoc.querySelector("video");

          if (videoElement) {
            this.requestFullscreen(videoElement);
          } else {
            this.requestFullscreen(element);
          }
        } catch (e) {
          this.requestFullscreen(element);
        }
      });
    }
  }

  requestFullscreen(element) {
    // Try all known fullscreen methods
    const fullscreenMethods = [
      "requestFullscreen",
      "webkitRequestFullscreen",
      "webkitEnterFullscreen", // iOS Safari
      "mozRequestFullScreen",
      "msRequestFullscreen",
    ];

    const tryNextMethod = (index = 0) => {
      if (index >= fullscreenMethods.length) {
        console.warn("Fullscreen request failed: No supported method found");
        return;
      }

      const method = fullscreenMethods[index];
      if (element[method]) {
        element[method]()
          .then(() => {
            console.log("Fullscreen enabled successfully");
          })
          .catch((err) => {
            console.warn(`Fullscreen request failed with ${method}:`, err);
            // Try next method
            tryNextMethod(index + 1);
          });
      } else {
        // Method not available, try next
        tryNextMethod(index + 1);
      }
    };

    // Start trying methods
    tryNextMethod();
  }

  setupOrientationLock() {
    const orientationLockToggle = dom.$("#orientationLockToggle");
    const autoFullscreenToggle = dom.$("#autoFullscreenToggle");

    if (orientationLockToggle) {
      const orientationLockEnabled =
        localStorage.getItem("orientationLock") === "true";
      orientationLockToggle.checked = orientationLockEnabled;

      dom.on(orientationLockToggle, "change", (event) => {
        localStorage.setItem("orientationLock", event.target.checked);

        // Immediately try to lock orientation if enabled
        if (event.target.checked) {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock("landscape").catch(console.warn);
          } else if (screen.lockOrientation) {
            screen.lockOrientation("landscape").catch(console.warn);
          }
        } else {
          // Unlock orientation
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          } else if (screen.unlockOrientation) {
            screen.unlockOrientation();
          }
        }
      });
    }

    if (autoFullscreenToggle) {
      const autoFullscreenEnabled =
        localStorage.getItem("autoFullscreen") !== "false"; // Default to true
      autoFullscreenToggle.checked = autoFullscreenEnabled;

      dom.on(autoFullscreenToggle, "change", (event) => {
        localStorage.setItem("autoFullscreen", event.target.checked);

        // If enabled, try to enter fullscreen immediately
        if (event.target.checked) {
          const videoIframe = dom.$("#videoIframe");
          if (videoIframe) {
            this.attemptFullscreenAndLockOrientation(videoIframe);
          }
        } else {
          // Exit fullscreen if it's active
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        }
      });
    }
  }
}
