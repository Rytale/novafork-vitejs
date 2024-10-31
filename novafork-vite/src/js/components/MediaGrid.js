import { dom } from '../utils/helpers';

export class MediaGrid {
  constructor() {
    this.container = dom.$('#popularMedia');
    if (!this.container) {
      throw new Error('Container with id "popularMedia" not found');
    }
  }

  async displayMedia(mediaList, mediaType) {
    if (!mediaList || !mediaList.length) {
      this.container.innerHTML = '<p class="text-center text-gray-400">No results found</p>';
      return;
    }

    const mediaCards = mediaList.map(media => this.createMediaCard(media, mediaType)).join('');
    this.container.innerHTML = mediaCards;

    // Add click event listeners to each card
    const cards = this.container.querySelectorAll('.media-card');
    cards.forEach(card => {
      dom.on(card, 'click', () => {
        const mediaId = card.dataset.id;
        const mediaType = card.dataset.type;
        // Dispatch custom event for media selection
        window.dispatchEvent(new CustomEvent('mediaSelect', {
          detail: { mediaId, mediaType }
        }));
      });
    });
  }

  createMediaCard(media, mediaType) {
    const title = media.title || media.name;
    const releaseDate = media.release_date || media.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const rating = media.vote_average ? (media.vote_average * 10).toFixed(0) + '%' : 'N/A';
    const overview = media.overview ? media.overview.slice(0, 150) + (media.overview.length > 150 ? '...' : '') : 'No overview available';
    const posterPath = media.poster_path 
      ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
      : 'placeholder.jpg';
    const popularity = media.popularity ? media.popularity.toFixed(1) : 'N/A';
    const voteCount = media.vote_count ? media.vote_count.toLocaleString() : '0';

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
      </div>
    `;
  }
}
