import { dom } from "../utils/helpers";

export class AdvancedFilters {
  constructor() {
    this.selectedGenres = new Set();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const toggleButton = dom.$("#toggleFiltersButton");
    const filtersSection = dom.$("#additionalFilters");
    const toggleIcon = dom.$("#toggleIcon");
    const genreCheckboxes = document.querySelectorAll(".filter-checkbox");

    if (toggleButton && filtersSection && toggleIcon) {
      dom.on(toggleButton, "click", () => {
        filtersSection.classList.toggle("hidden");
        const path = toggleIcon.querySelector("path");
        if (path) {
          path.setAttribute(
            "d",
            filtersSection.classList.contains("hidden")
              ? "M19 9l-7 7-7-7"
              : "M19 15l-7-7-7 7"
          );
        }
      });
    }

    // Handle genre selection
    genreCheckboxes.forEach((checkbox) => {
      dom.on(checkbox, "change", (e) => {
        if (e.target.checked) {
          this.selectedGenres.add(e.target.value);
        } else {
          this.selectedGenres.delete(e.target.value);
        }
        this.emitFilterChange();
      });
    });

    // Handle actor search
    const actorSearchInput = dom.$("#actorSearchInput");
    if (actorSearchInput) {
      dom.on(actorSearchInput, "input", (e) => {
        this.handleActorSearch(e.target.value);
      });
    }

    // Handle company search
    const companySearchInput = dom.$("#companySearchInput");
    if (companySearchInput) {
      dom.on(companySearchInput, "input", (e) => {
        this.handleCompanySearch(e.target.value);
      });
    }

    // Handle collection search
    const collectionSearchInput = dom.$("#collectionSearchInput");
    if (collectionSearchInput) {
      dom.on(collectionSearchInput, "input", (e) => {
        this.handleCollectionSearch(e.target.value);
      });
    }

    // Handle franchise search
    const franchiseSearchInput = dom.$("#franchiseSearchInput");
    if (franchiseSearchInput) {
      dom.on(franchiseSearchInput, "input", (e) => {
        this.handleFranchiseSearch(e.target.value);
      });
    }
  }

  emitFilterChange() {
    // Emit a custom event with the current filter state
    const filterChangeEvent = new CustomEvent("filterChange", {
      detail: {
        genres: Array.from(this.selectedGenres),
        actor: dom.$("#actorSearchInput")?.value || "",
        company: dom.$("#companySearchInput")?.value || "",
        collection: dom.$("#collectionSearchInput")?.value || "",
        franchise: dom.$("#franchiseSearchInput")?.value || "",
      },
    });
    window.dispatchEvent(filterChangeEvent);
  }

  async handleActorSearch(query) {
    if (query.length < 2) return;
    // Implement actor search logic here
    this.emitFilterChange();
  }

  async handleCompanySearch(query) {
    if (query.length < 2) return;
    // Implement company search logic here
    this.emitFilterChange();
  }

  async handleCollectionSearch(query) {
    if (query.length < 2) return;
    // Implement collection search logic here
    this.emitFilterChange();
  }

  async handleFranchiseSearch(query) {
    if (query.length < 2) return;
    // Implement franchise search logic here
    this.emitFilterChange();
  }

  getSelectedGenres() {
    return Array.from(this.selectedGenres);
  }

  clearFilters() {
    this.selectedGenres.clear();
    const inputs = [
      "#actorSearchInput",
      "#companySearchInput",
      "#collectionSearchInput",
      "#franchiseSearchInput",
    ];
    inputs.forEach((selector) => {
      const input = dom.$(selector);
      if (input) input.value = "";
    });
    document.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
      checkbox.checked = false;
    });
    this.emitFilterChange();
  }
}
