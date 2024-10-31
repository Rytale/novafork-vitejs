import { API_CONFIG } from "./config";

const cache = new Map();

class ApiService {
  async fetchFromTMDB(endpoint, params = {}) {
    const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);
    url.searchParams.append("api_key", API_CONFIG.key);

    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching from TMDB:", error);
      throw error;
    }
  }

  async getSeasonDetails(tvId, seasonNumber) {
    return this.fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`, {
      language: 'en-US',
      append_to_response: 'credits,images'
    });
  }

  async getReleaseType(mediaId, mediaType, region = "US") {
    try {
      const cacheKey = `${mediaId}_${mediaType}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      // Fetch release dates and watch providers concurrently
      const [releaseDatesData, watchProvidersData] = await Promise.all([
        this.fetchFromTMDB(`/${mediaType}/${mediaId}/release_dates`),
        this.fetchFromTMDB(`/${mediaType}/${mediaId}/watch/providers`),
      ]);

      const currentUtcDate = new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          new Date().getUTCDate()
        )
      );

      const releases = releaseDatesData.results.flatMap(
        (result) => result.release_dates
      );
      const certifications = this.extractCertifications(
        releaseDatesData,
        region
      );

      const isDigitalRelease = this.checkDigitalRelease(
        releases,
        currentUtcDate
      );
      const isInTheaters = this.checkTheaterRelease(releases, currentUtcDate);
      const hasFutureRelease = this.checkFutureRelease(
        releases,
        currentUtcDate
      );
      const isStreamingAvailable =
        this.checkStreamingAvailability(watchProvidersData);
      const isRentalOrPurchaseAvailable =
        this.checkRentalOrPurchaseAvailability(watchProvidersData);

      const releaseType = this.determineReleaseType({
        isInTheaters,
        isStreamingAvailable,
        isDigitalRelease,
        hasFutureRelease,
        isRentalOrPurchaseAvailable,
      });

      const result = { releaseType, certifications };
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(
        "Error fetching release type and certifications:",
        error.message
      );
      return {
        releaseType: "Unknown Quality",
        certifications: {},
      };
    }
  }

  extractCertifications(releaseDatesData, region) {
    const certifications = {};
    releaseDatesData.results.forEach((result) => {
      const certificationEntry = result.release_dates.find(
        (release) => release.certification
      );
      if (certificationEntry) {
        certifications[result.iso_3166_1] = certificationEntry.certification;
      }
    });
    return certifications[region] || "No Certification Available";
  }

  checkDigitalRelease(releases, currentUtcDate) {
    return releases.some(
      (release) =>
        [4, 6].includes(release.type) &&
        new Date(release.release_date).getTime() <= currentUtcDate.getTime()
    );
  }

  checkTheaterRelease(releases, currentUtcDate) {
    return releases.some((release) => {
      const releaseDate = new Date(release.release_date);
      return (
        release.type === 3 && releaseDate.getTime() <= currentUtcDate.getTime()
      );
    });
  }

  checkFutureRelease(releases, currentUtcDate) {
    return releases.some(
      (release) =>
        new Date(release.release_date).getTime() > currentUtcDate.getTime()
    );
  }

  checkStreamingAvailability(watchProvidersData) {
    const availableRegions = Object.keys(watchProvidersData.results || {});
    return availableRegions.some(
      (region) =>
        (watchProvidersData.results?.[region]?.flatrate || []).length > 0
    );
  }

  checkRentalOrPurchaseAvailability(watchProvidersData) {
    const availableRegions = Object.keys(watchProvidersData.results || {});
    return availableRegions.some((region) => {
      const rentProviders = watchProvidersData.results?.[region]?.rent || [];
      const buyProviders = watchProvidersData.results?.[region]?.buy || [];
      return rentProviders.length > 0 || buyProviders.length > 0;
    });
  }

  determineReleaseType({
    isInTheaters,
    isStreamingAvailable,
    isDigitalRelease,
    hasFutureRelease,
    isRentalOrPurchaseAvailable,
  }) {
    if (isInTheaters && !isStreamingAvailable && !isDigitalRelease) {
      return "Cam";
    } else if (isStreamingAvailable || isDigitalRelease) {
      return "HD";
    } else if (hasFutureRelease && !isInTheaters) {
      return "Not Released Yet";
    } else if (isRentalOrPurchaseAvailable) {
      return "Rental/Buy Available";
    } else {
      return "Unknown Quality";
    }
  }

  async searchMedia(query, type = "movie", page = 1) {
    return this.fetchFromTMDB(`/search/${type}`, {
      query,
      page,
      include_adult: false,
      language: "en-US",
    });
  }

  async getMediaByCategory(category, type = "movie", page = 1) {
    let endpoint;
    if (type === "movie") {
      switch (category) {
        case "popular":
          endpoint = "/movie/popular";
          break;
        case "top_rated":
          endpoint = "/movie/top_rated";
          break;
        case "upcoming":
          endpoint = "/movie/upcoming";
          break;
        case "now_playing":
          endpoint = "/movie/now_playing";
          break;
        default:
          endpoint = "/movie/popular";
      }
    } else {
      switch (category) {
        case "popular":
          endpoint = "/tv/popular";
          break;
        case "top_rated":
          endpoint = "/tv/top_rated";
          break;
        case "on_the_air":
          endpoint = "/tv/on_the_air";
          break;
        case "airing_today":
          endpoint = "/tv/airing_today";
          break;
        default:
          endpoint = "/tv/popular";
      }
    }

    return this.fetchFromTMDB(endpoint, {
      page,
      language: "en-US",
    });
  }

  async getMediaDetails(id, type = "movie") {
    return this.fetchFromTMDB(`/${type}/${id}`, {
      append_to_response: "videos,credits,similar,recommendations",
      language: "en-US",
    });
  }

  async getCastData(id, type = "movie") {
    return this.fetchFromTMDB(`/${type}/${id}/credits`);
  }

  async searchPerson(query) {
    return this.fetchFromTMDB("/search/person", {
      query,
      include_adult: false,
      language: "en-US",
    });
  }

  async getPersonDetails(id) {
    return this.fetchFromTMDB(`/person/${id}`, {
      append_to_response: "movie_credits,tv_credits",
      language: "en-US",
    });
  }

  async searchCompany(query) {
    return this.fetchFromTMDB("/search/company", {
      query,
      language: "en-US",
    });
  }

  async getCompanyDetails(id) {
    return this.fetchFromTMDB(`/company/${id}`, {
      language: "en-US",
    });
  }

  async searchCollection(query) {
    return this.fetchFromTMDB("/search/collection", {
      query,
      language: "en-US",
    });
  }

  async getCollectionDetails(id) {
    return this.fetchFromTMDB(`/collection/${id}`, {
      language: "en-US",
    });
  }

  async getMediaByCompany(companyId, type = "movie", page = 1) {
    return this.fetchFromTMDB(`/discover/${type}`, {
      with_companies: companyId,
      page,
      language: "en-US",
    });
  }

  async getMediaByCollection(collectionId, page = 1) {
    return this.fetchFromTMDB(`/collection/${collectionId}`, {
      page,
      language: "en-US",
    });
  }

  async getMediaByPerson(personId, type = "movie") {
    const details = await this.getPersonDetails(personId);
    return type === "movie" ? details.movie_credits : details.tv_credits;
  }
}

export const apiService = new ApiService();
