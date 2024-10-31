import { dom } from "../utils/helpers";

export class MediaCard {
  constructor(mediaData, options = {}) {
    this.data = mediaData;
    this.options = {
      onClick: () => {},
      imageSize: "w500",
      ...options,
    };
  }

  formatDate(dateString) {
    if (!dateString) return "Release date unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  generateRatingStars(rating) {
    const stars = Math.round(rating / 2);
    return `
      <div class="rating-stars">
        ${Array(5)
          .fill(0)
          .map(
            (_, i) => `
          <i class="fas fa-star ${
            i < stars ? "text-yellow-400" : "text-gray-600"
          }"></i>
        `
          )
          .join("")}
      </div>
    `;
  }

  handleImageError(img) {
    if (img.src !== "/placeholder-poster.jpeg") {
      img.src = "/placeholder-poster.jpeg";
      img.classList.add("placeholder-poster");
      // Remove loading attribute to prevent lazy loading of placeholder
      img.removeAttribute("loading");
    }
  }

  render() {
    const card = dom.createElement("div", {
      classes: "media-card group",
    });

    // Image container for better aspect ratio control
    const imageContainer = dom.createElement("div", {
      classes: "aspect-[2/3] overflow-hidden relative bg-gray-800 rounded-lg",
    });

    // Quality badge (if available)
    if (this.data.releaseType) {
      const badge = dom.createElement("div", {
        classes: "media-badge",
        text: this.data.releaseType,
      });
      card.appendChild(badge);
    }

    // Poster image
    const imageUrl = this.data.poster_path
      ? `https://image.tmdb.org/t/p/${this.options.imageSize}${this.data.poster_path}`
      : "/placeholder-poster.jpeg";

    const image = dom.createElement("img", {
      classes: `media-image transition-all duration-300 group-hover:scale-110 ${
        !this.data.poster_path ? "placeholder-poster" : ""
      }`,
      attributes: {
        src: imageUrl,
        alt: this.data.title || this.data.name,
        loading: this.data.poster_path ? "lazy" : null, // Only lazy load actual images
      },
    });

    // Add error handler
    image.onerror = () => this.handleImageError(image);
    imageContainer.appendChild(image);
    card.appendChild(imageContainer);

    // Content overlay with gradient
    const content = dom.createElement("div", {
      classes:
        "media-content bg-gradient-to-t from-black via-black/70 to-transparent",
    });

    // Title with truncation
    const title = dom.createElement("h3", {
      classes: "media-title line-clamp-2",
      text: this.data.title || this.data.name,
    });
    content.appendChild(title);

    // Media type with icon
    const type = this.data.media_type || (this.data.title ? "movie" : "tv");
    const typeIcon = type === "movie" ? "film" : "tv";
    const mediaType = dom.createElement("p", {
      classes: "media-type flex items-center gap-2",
      html: `<i class="fas fa-${typeIcon}"></i>${
        type === "movie" ? "Movie" : "TV Show"
      }`,
    });
    content.appendChild(mediaType);

    // Details section
    const details = dom.createElement("div", {
      classes: "media-details space-y-2",
    });

    // Genres with icon
    if (this.data.genreNames) {
      const genres = dom.createElement("p", {
        classes: "flex items-center gap-2 text-sm",
        html: `<i class="fas fa-theater-masks"></i><span class="line-clamp-1">${this.data.genreNames}</span>`,
      });
      details.appendChild(genres);
    }

    // Rating with stars
    if (this.data.vote_average) {
      const rating = dom.createElement("div", {
        classes: "flex items-center gap-2",
        html: `
          ${this.generateRatingStars(this.data.vote_average)}
          <span class="text-sm font-medium">${this.data.vote_average.toFixed(
            1
          )}/10</span>
        `,
      });
      details.appendChild(rating);
    }

    // Release date with icon
    const releaseDate = dom.createElement("p", {
      classes: "flex items-center gap-2 text-sm",
      html: `<i class="fas fa-calendar-alt"></i>${this.formatDate(
        this.data.release_date || this.data.first_air_date
      )}`,
    });
    details.appendChild(releaseDate);

    content.appendChild(details);
    card.appendChild(content);

    // Click handler
    dom.on(card, "click", () => this.options.onClick(this.data));

    return card;
  }
}
