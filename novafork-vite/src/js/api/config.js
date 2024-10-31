export const API_CONFIG = {
  baseUrl: "https://api.themoviedb.org/3",
  key: "ea021b3b0775c8531592713ab727f254",
  imageBaseUrl: "https://image.tmdb.org/t/p",
  endpoints: {
    search: {
      movie: "search/movie",
      tv: "search/tv",
      multi: "search/multi",
      person: "search/person",
    },
    trending: {
      movie: "trending/movie/week",
      tv: "trending/tv/week",
      all: "trending/all/week",
    },
    discover: {
      movie: "discover/movie",
      tv: "discover/tv",
    },
    genre: {
      movie: "genre/movie/list",
      tv: "genre/tv/list",
    },
  },
  imageSizes: {
    poster: {
      small: "w185",
      medium: "w342",
      large: "w500",
      original: "original",
    },
    backdrop: {
      small: "w300",
      medium: "w780",
      large: "w1280",
      original: "original",
    },
    profile: {
      small: "w45",
      medium: "w185",
      large: "h632",
      original: "original",
    },
  },
};

export const DEV_CONFIG = {
  showLoadingAnimation: false, // Toggle this to enable/disable loading animation
  loadingProviders: ["vidbinge", "vidsrcnl", "filmxy"], // Providers that should show loading animation
};
