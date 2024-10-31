// DOM utility functions
export const dom = {
  // Query selector with error handling
  $(selector, parent = document) {
    const element = parent.querySelector(selector);
    if (!element && selector !== '#loadingScreen') {
      console.warn(`Element not found: ${selector}`);
    }
    return element;
  },

  // Query selector all with error handling
  $$(selector, parent = document) {
    const elements = parent.querySelectorAll(selector);
    if (!elements.length) {
      console.warn(`No elements found: ${selector}`);
    }
    return elements;
  },

  // Event listener with error handling
  on(element, event, handler) {
    if (!element) {
      console.warn('Cannot add event listener to null element');
      return;
    }
    element.addEventListener(event, handler);
  },

  // Remove event listener with error handling
  off(element, event, handler) {
    if (!element) {
      console.warn('Cannot remove event listener from null element');
      return;
    }
    element.removeEventListener(event, handler);
  },

  // Create element with attributes and children
  create(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Append children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    
    return element;
  },

  // Add multiple classes
  addClass(element, ...classes) {
    if (!element) {
      console.warn('Cannot add class to null element');
      return;
    }
    element.classList.add(...classes);
  },

  // Remove multiple classes
  removeClass(element, ...classes) {
    if (!element) {
      console.warn('Cannot remove class from null element');
      return;
    }
    element.classList.remove(...classes);
  },

  // Toggle class with optional force parameter
  toggleClass(element, className, force) {
    if (!element) {
      console.warn('Cannot toggle class on null element');
      return;
    }
    element.classList.toggle(className, force);
  },

  // Check if element has class
  hasClass(element, className) {
    if (!element) {
      console.warn('Cannot check class on null element');
      return false;
    }
    return element.classList.contains(className);
  },

  // Set or get data attribute
  data(element, key, value) {
    if (!element) {
      console.warn('Cannot access data attribute on null element');
      return;
    }
    if (value === undefined) {
      return element.dataset[key];
    }
    element.dataset[key] = value;
  },

  // Show element (remove hidden class)
  show(element) {
    if (!element) {
      console.warn('Cannot show null element');
      return;
    }
    element.classList.remove('hidden');
  },

  // Hide element (add hidden class)
  hide(element) {
    if (!element) {
      console.warn('Cannot hide null element');
      return;
    }
    element.classList.add('hidden');
  },

  // Toggle element visibility
  toggle(element) {
    if (!element) {
      console.warn('Cannot toggle null element');
      return;
    }
    element.classList.toggle('hidden');
  }
};
