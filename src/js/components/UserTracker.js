import { database } from '../api/firebaseConfig';
import { ref, onValue, onDisconnect, set, increment } from 'firebase/database';
import { dom } from '../utils/helpers';

export class UserTracker {
  constructor() {
    this.setupActiveUsersCounter();
  }

  setupActiveUsersCounter() {
    try {
      // Reference to active users count in Firebase
      const activeUsersRef = ref(database, 'activeUsers/count');
      
      // Create a reference for this user's presence
      const userPresenceRef = ref(database, `activeUsers/${Date.now()}`);

      // When this user connects, increment the count
      set(activeUsersRef, increment(1)).catch(error => {
        console.warn('Failed to increment user count:', error.message);
      });

      // When this user disconnects, decrement the count and remove presence
      onDisconnect(activeUsersRef).set(increment(-1)).catch(error => {
        console.warn('Failed to setup disconnect handler for count:', error.message);
      });
      
      // Clean up user's presence reference on disconnect
      onDisconnect(userPresenceRef).remove().catch(error => {
        console.warn('Failed to setup disconnect handler for presence:', error.message);
      });

      // Listen for changes in active users count
      onValue(activeUsersRef, (snapshot) => {
        const count = snapshot.val() || 0;
        this.updateActiveUsersDisplay(count);
      }, (error) => {
        console.warn('Failed to listen to user count changes:', error.message);
        this.updateActiveUsersDisplay('--');
      });

      // Set user's presence
      set(userPresenceRef, true).catch(error => {
        console.warn('Failed to set user presence:', error.message);
      });

    } catch (error) {
      console.warn('Failed to initialize user tracking:', error.message);
      this.updateActiveUsersDisplay('--');
    }
  }

  updateActiveUsersDisplay(count) {
    // Create or get the active users display element
    let activeUsersDisplay = dom.$("#activeUsersDisplay");
    
    if (!activeUsersDisplay) {
      // If the display doesn't exist, create it
      const header = dom.$(".text-center.mb-12");
      if (header) {
        activeUsersDisplay = document.createElement('div');
        activeUsersDisplay.id = 'activeUsersDisplay';
        activeUsersDisplay.className = 'text-center mb-6';
        header.insertAdjacentElement('afterend', activeUsersDisplay);
      }
    }

    if (activeUsersDisplay) {
      // Update the display with current count
      activeUsersDisplay.innerHTML = `
        <div class="glassmorphism inline-flex items-center px-4 py-2 rounded-full text-white text-xs sm:text-sm">
          <i class="fas fa-users mr-2"></i>
          <span>${count} active ${count === 1 ? 'user' : 'users'}</span>
        </div>
      `;
    }
  }
}
