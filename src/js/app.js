// Import React and ReactDOM
import React from 'react';
import { createRoot } from 'react-dom/client';

// Import Framework7
import Framework7 from 'framework7/lite-bundle';

// Import Framework7-React Plugin
import Framework7React from 'framework7-react';

// Import Framework7 Styles
import 'framework7/css/bundle';
import 'skeleton-elements/css';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';

// Import App Component
import MyApp from '../components/app.jsx';

// Init F7 React Plugin
Framework7.use(Framework7React)



// Function to manually check for updates
function checkForUpdates() {
  if (serviceWorkerRegistration) {
    serviceWorkerRegistration.update();
  }
}

// Make the function available globally
window.checkForUpdates = checkForUpdates;

// Mount React App
const root = createRoot(document.getElementById('app'));
root.render(React.createElement(MyApp));

// Mark app as mounted after the first paint so the boot overlay can fade out
// and the app container can fade/slide in smoothly.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.add('app-mounted');
  });
});
