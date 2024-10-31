const API_KEY = 'ea021b3b0775c8531592713ab727f254';
const BASE_URL = 'https://api.themoviedb.org/3';

class ApiService {
  async fetchFromTMDB(endpoint, params = {}) {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', API_KEY);
    
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
      console.error('Error fetching from TMDB:', error);
      throw error;
    }
  }

  async searchMedia(query, type = 'movie', page = 1) {
    return this.fetchFromTMDB(`/search/${type}`, {
      query,
      page,
      include_adult: false,
      language: 'en-US'
    });
  }

  async getMediaByCategory(category, type = 'movie', page = 1) {
    let endpoint;
    if (type === 'movie') {
      switch (category) {
        case 'popular':
          endpoint = '/movie/popular';
          break;
        case 'top_rated':
          endpoint = '/movie/top_rated';
          break;
        case 'upcoming':
          endpoint = '/movie/upcoming';
          break;
        case 'now_playing':
          endpoint = '/movie/now_playing';
          break;
        default:
          endpoint = '/movie/popular';
      }
    } else {
      switch (category) {
        case 'popular':
          endpoint = '/tv/popular';
          break;
        case 'top_rated':
          endpoint = '/tv/top_rated';
          break;
        case 'on_the_air':
          endpoint = '/tv/on_the_air';
          break;
        case 'airing_today':
          endpoint = '/tv/airing_today';
          break;
        default:
          endpoint = '/tv/popular';
      }
    }

    return this.fetchFromTMDB(endpoint, {
      page,
      language: 'en-US'
    });
  }

  async getMediaDetails(id, type = 'movie') {
    return this.fetchFromTMDB(`/${type}/${id}`, {
      append_to_response: 'videos,credits,similar,recommendations',
      language: 'en-US'
    });
  }

  async getCastData(id, type = 'movie') {
    return this.fetchFromTMDB(`/${type}/${id}/credits`);
  }

  async searchPerson(query) {
    return this.fetchFromTMDB('/search/person', {
      query,
      include_adult: false,
      language: 'en-US'
    });
  }

  async getPersonDetails(id) {
    return this.fetchFromTMDB(`/person/${id}`, {
      append_to_response: 'movie_credits,tv_credits',
      language: 'en-US'
    });
  }

  async searchCompany(query) {
    return this.fetchFromTMDB('/search/company', {
      query,
      language: 'en-US'
    });
  }

  async getCompanyDetails(id) {
    return this.fetchFromTMDB(`/company/${id}`, {
      language: 'en-US'
    });
  }

  async searchCollection(query) {
    return this.fetchFromTMDB('/search/collection', {
      query,
      language: 'en-US'
    });
  }

  async getCollectionDetails(id) {
    return this.fetchFromTMDB(`/collection/${id}`, {
      language: 'en-US'
    });
  }

  async getMediaByCompany(companyId, type = 'movie', page = 1) {
    return this.fetchFromTMDB(`/discover/${type}`, {
      with_companies: companyId,
      page,
      language: 'en-US'
    });
  }

  async getMediaByCollection(collectionId, page = 1) {
    return this.fetchFromTMDB(`/collection/${collectionId}`, {
      page,
      language: 'en-US'
    });
  }

  async getMediaByPerson(personId, type = 'movie') {
    const details = await this.getPersonDetails(personId);
    return type === 'movie' ? details.movie_credits : details.tv_credits;
  }
}

export const apiService = new ApiService();
