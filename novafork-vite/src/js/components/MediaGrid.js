import { dom } from '../utils/helpers';
import { API_CONFIG } from '../api/config';
import { apiService } from '../api/apiService';

export class MediaGrid {
  constructor() {
    this.container = dom.$('#popularMedia');
    if (!this.container) {
      throw new Error('Container with id "popularMedia" not found');
    }
  }

  getQualityClass(releaseType) {
    switch (releaseType) {
      case 'Cam':
        return 'bg-red-600';
      case 'HD':
        return 'bg-yellow-600';
      case 'Not Released Yet':
        return 'bg-blue-600';
      case 'Rental/Buy Available':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  }

  async displayMedia(mediaList, mediaType) {
    if (!mediaList || !mediaList.length) {
      this.container.innerHTML = '<p class="text-center text-gray-400">No results found</p>';
      return;
    }

    // Get release types for all media items concurrently
    const releasePromises = mediaList.map(media => apiService.getReleaseType(media.id, mediaType));
    const releaseTypes = await Promise.all(releasePromises);

    const mediaCards = mediaList.map((media, index) => 
      this.createMediaCard(media, mediaType, releaseTypes[index])
    ).join('');

    this.container.innerHTML = mediaCards;

    // Add click event listeners to each card
    const cards = this.container.querySelectorAll('.media-card');
    cards.forEach(card => {
      dom.on(card, 'click', () => {
        const mediaId = card.dataset.id;
        const mediaType = card.dataset.type;
        window.dispatchEvent(new CustomEvent('mediaSelect', {
          detail: { mediaId, mediaType }
        }));
      });
    });
  }

  createMediaCard(media, mediaType, releaseInfo) {
    const title = media.title || media.name;
    const releaseDate = media.release_date || media.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const rating = media.vote_average ? (media.vote_average * 10).toFixed(0) + '%' : 'N/A';
    const overview = media.overview ? media.overview.slice(0, 150) + (media.overview.length > 150 ? '...' : '') : 'No overview available';
    const posterPath = media.poster_path 
      ? `${API_CONFIG.imageBaseUrl}/${API_CONFIG.imageSizes.poster.large}${media.poster_path}`
      : 'placeholder.jpg';
    const popularity = media.popularity ? media.popularity.toFixed(1) : 'N/A';
    const voteCount = media.vote_count ? media.vote_count.toLocaleString() : '0';
    const qualityClass = this.getQualityClass(releaseInfo.releaseType);

    return `
      <div class="media-card relative overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105 cursor-pointer" data-id="${media.id}" data-type="${mediaType}">
        <img 
          src="${posterPath}" 
          alt="${title}" 
          class="w-full h-[300px] object-cover"
          onerror="this.src='placeholder.jpg'">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
          <h3 class="text-lg font-bold text-white mb-2">${title}</h3>
          <p class="text-sm text-gray-300 mb-2">${mediaType === 'movie' ? 'Movie' : 'TV Show'} (${year})</p>
          <div class="space-y-2 text-sm text-gray-300">
            <div class="flex items-center space-x-2">
              <i class="fas fa-star text-yellow-400"></i>
              <span>${rating}</span>
              <span class="text-gray-400">(${voteCount} votes)</span>
            </div>
            <div class="flex items-center space-x-2">
              <i class="fas fa-fire text-orange-500"></i>
              <span>${popularity}</span>
            </div>
            <p class="text-xs text-gray-400 mt-2">${overview}</p>
          </div>
        </div>
        <div class="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded bg-purple-600 text-white">
          ${mediaType === 'movie' ? 'Movie' : 'TV'}
        </div>
        <div class="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded ${qualityClass} text-white">
          ${releaseInfo.releaseType}
        </div>
      </div>
    `;
  }
}
