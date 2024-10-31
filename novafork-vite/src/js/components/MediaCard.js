import { dom } from '../utils/helpers';

export class MediaCard {
  constructor(mediaData, options = {}) {
    this.data = mediaData;
    this.options = {
      onClick: () => {},
      imageSize: 'w500',
      ...options
    };
  }

  formatDate(dateString) {
    if (!dateString) return 'Release date unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  generateRatingStars(rating) {
    const stars = Math.round(rating / 2);
    return `
      <div class="rating-stars">
        ${Array(5).fill(0).map((_, i) => `
          <i class="fas fa-star ${i < stars ? 'text-yellow-400' : 'text-gray-600'}"></i>
        `).join('')}
      </div>
    `;
  }

  render() {
    const card = dom.createElement('div', {
      classes: 'media-card'
    });

    const imageUrl = this.data.poster_path 
      ? `https://image.tmdb.org/t/p/${this.options.imageSize}${this.data.poster_path}`
      : '/placeholder-poster.jpg';

    // Quality badge (if available)
    if (this.data.releaseType) {
      const badge = dom.createElement('div', {
        classes: 'release-type',
        text: this.data.releaseType
      });
      card.appendChild(badge);
    }

    // Poster image
    const image = dom.createElement('img', {
      classes: 'media-image',
      attributes: {
        src: imageUrl,
        alt: this.data.title || this.data.name,
        loading: 'lazy'
      }
    });
    card.appendChild(image);

    // Content overlay
    const content = dom.createElement('div', {
      classes: 'media-content'
    });

    // Title
    const title = dom.createElement('h3', {
      classes: 'media-title',
      text: this.data.title || this.data.name
    });
    content.appendChild(title);

    // Media type
    const type = this.data.media_type || (this.data.title ? 'movie' : 'tv');
    const typeIcon = type === 'movie' ? 'film' : 'tv';
    const mediaType = dom.createElement('p', {
      classes: 'media-type',
      html: `<i class="fas fa-${typeIcon} mr-2"></i>${type === 'movie' ? 'Movie' : 'TV Show'}`
    });
    content.appendChild(mediaType);

    // Details
    const details = dom.createElement('div', {
      classes: 'media-details'
    });

    // Genres
    if (this.data.genreNames) {
      const genres = dom.createElement('p', {
        html: `<i class="fas fa-theater-masks mr-2"></i>${this.data.genreNames}`
      });
      details.appendChild(genres);
    }

    // Rating
    if (this.data.vote_average) {
      const rating = dom.createElement('div', {
        classes: 'flex items-center space-x-2',
        html: `
          ${this.generateRatingStars(this.data.vote_average)}
          <span class="text-white">${this.data.vote_average.toFixed(1)}/10</span>
        `
      });
      details.appendChild(rating);
    }

    // Release date
    const releaseDate = dom.createElement('p', {
      html: `<i class="fas fa-calendar-alt mr-2"></i>${this.formatDate(this.data.release_date || this.data.first_air_date)}`
    });
    details.appendChild(releaseDate);

    content.appendChild(details);
    card.appendChild(content);

    // Click handler
    dom.on(card, 'click', () => this.options.onClick(this.data));

    return card;
  }
}
