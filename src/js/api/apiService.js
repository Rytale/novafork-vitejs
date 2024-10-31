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
      language: "en-US",
      append_to_response: "credits,images",
    });
  }

  async getReleaseType(mediaId, mediaType, region = "US") {
    try {
      const cacheKey = `${mediaId}_${mediaType}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      // For TV shows, only check watch providers
      if (mediaType === "tv") {
        const watchProvidersData = await this.fetchFromTMDB(
          `/${mediaType}/${mediaId}/watch/providers`
        );
        const isStreamingAvailable =
          this.checkStreamingAvailability(watchProvidersData);
        const isRentalOrPurchaseAvailable =
          this.checkRentalOrPurchaseAvailability(watchProvidersData);

        let releaseType = "Unknown Quality";
        if (isStreamingAvailable) {
          releaseType = "HD";
        } else if (isRentalOrPurchaseAvailable) {
          releaseType = "HD";
        }

        const result = {
          releaseType,
          certifications: "TV Rating",
        };
        cache.set(cacheKey, result);
        return result;
      }

      // For movies, check both release dates and watch providers
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
  }) {
    if (isInTheaters && !isStreamingAvailable && !isDigitalRelease) {
      return "Cam";
    } else if (isStreamingAvailable || isDigitalRelease) {
      return "HD";
    } else if (hasFutureRelease && !isInTheaters) {
      return "Not Released Yet";
    } else {
      return "Unknown Quality";
    }
  }

  async searchMedia(query, type = "movie", page = 1) {
    if (type === "all") {
      // Search both movies and TV shows
      const [movieResults, tvResults] = await Promise.all([
        this.fetchFromTMDB("/search/movie", {
          query,
          page,
          include_adult: false,
          language: "en-US",
        }),
        this.fetchFromTMDB("/search/tv", {
          query,
          page,
          include_adult: false,
          language: "en-US",
        }),
      ]);

      // Combine and sort results by popularity
      return {
        results: [...movieResults.results, ...tvResults.results].sort(
          (a, b) => b.popularity - a.popularity
        ),
      };
    }

    return this.fetchFromTMDB(`/search/${type}`, {
      query,
      page,
      include_adult: false,
      language: "en-US",
    });
  }

  async getMediaByCategory(
    category,
    type = "movie",
    page = 1,
    withGenres = []
  ) {
    if (type === "all") {
      // Get both movies and TV shows
      const [movieResults, tvResults] = await Promise.all([
        this.getMediaByCategory(category, "movie", page, withGenres),
        this.getMediaByCategory(category, "tv", page, withGenres),
      ]);

      // Add media_type to each result
      const moviesWithType = movieResults.results.map((movie) => ({
        ...movie,
        media_type: "movie",
      }));
      const tvWithType = tvResults.results.map((tv) => ({
        ...tv,
        media_type: "tv",
      }));

      // Combine and sort results by popularity
      return {
        results: [...moviesWithType, ...tvWithType]
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 20), // Limit to 20 items per page
        total_pages: Math.max(
          movieResults.total_pages || 1,
          tvResults.total_pages || 1
        ),
      };
    }

    // If genres are selected, use discover endpoint
    if (withGenres.length > 0) {
      const params = {
        language: "en-US",
        sort_by: "popularity.desc",
        with_genres: withGenres.join(","),
        include_adult: false,
        include_video: false,
        vote_count_gte: 10,
        page,
      };

      // Add category-specific parameters
      switch (category) {
        case "upcoming":
          const today = new Date();
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(today.getMonth() + 3);
          params.release_date_gte = today.toISOString().split("T")[0];
          params.release_date_lte = threeMonthsFromNow
            .toISOString()
            .split("T")[0];
          params.vote_count_gte = 0;
          break;
        case "now_playing":
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          params.release_date_gte = oneMonthAgo.toISOString().split("T")[0];
          params.release_date_lte = new Date().toISOString().split("T")[0];
          break;
        case "top_rated":
          params.sort_by = "vote_average.desc";
          params.vote_count_gte = 100;
          params["vote_average.gte"] = 7;
          break;
      }

      // For TV shows, adjust parameters
      if (type === "tv") {
        delete params.release_date_gte;
        delete params.release_date_lte;

        switch (category) {
          case "on_the_air":
            params.air_date_gte = new Date().toISOString().split("T")[0];
            break;
          case "airing_today":
            const today = new Date().toISOString().split("T")[0];
            params.air_date_gte = today;
            params.air_date_lte = today;
            break;
        }
      }

      const results = await this.fetchFromTMDB(`/discover/${type}`, params);

      // Add media_type to each result
      results.results = results.results.map((item) => ({
        ...item,
        media_type: type,
      }));

      return results;
    }

    // If no genres selected, use category endpoint
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

    const results = await this.fetchFromTMDB(endpoint, {
      page,
      language: "en-US",
    });

    // Add media_type to each result
    results.results = results.results.map((item) => ({
      ...item,
      media_type: type,
    }));

    return results;
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
