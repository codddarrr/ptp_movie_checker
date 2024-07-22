// ==UserScript==
// @name        PTP Movie Checker
// @namespace   Violentmonkey Scripts
// @match       *://avistaz.to/*
// @grant       none
// @version     0.1.0
// @description Checks movie existence on PassThePopcorn via a proxy server with confetti on no match
// @require     https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js
// @require     https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/js/iziToast.min.js
// ==/UserScript==

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    AUTO_CLICK: true, // Set to false to disable auto-clicking
    // UPDATE THIS IF YOU MODIFIED YOUR APP_DOMAIN IN .env
    PROXY_SERVER_URL: 'https://pmc.local/movies/check',
  };

  function loadCSS(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    document.head.appendChild(link);
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .glow {
        font-size: 24px;
        color: #fff;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  function applyGlowAnimation() {
    anime({
      targets: '.glow',
      color: ['#ff0000', '#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'],
      duration: 3000,
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutSine',
    });
  }

  async function checkMovieOnPTP(imdb_id, url) {
    try {
      const response = await fetch(CONFIG.PROXY_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imdb_id, url }),
      });

      if (response.status === 429) {
        throw new Error('429: Too Many Requests');
      }

      if (response.status === 404) {
        throw new Error('404: This IMDb Page Does Not Exist');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`Error checking movie ${imdb_id}:`, error);
      throw error;
    }
  }

  function parseImdbId(url) {
    const match = url.match(/tt\d+/);
    return match ? match[0] : null;
  }

  function triggerConfetti() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  function handleError(element, error) {
    const errorMessage = error.toString();
    element.textContent = errorMessage;
    element.parentElement.classList.remove('glow');
    element.classList.remove('glow');
    element.removeEventListener('click', handleCheckButtonClick);
    element.disabled = true;
    iziToast.error({
      message: errorMessage,
      position: 'bottomRight',
    });
  }

  async function handleCheckButtonClick(event) {
    const button = event.target;
    const imdbUrl = button.getAttribute('data-imdb-url');
    const imdb_id = parseImdbId(imdbUrl);
    if (!imdb_id) {
      handleError(button, new Error('Invalid IMDb URL.'));
      return;
    }

    button.textContent = 'Checking...';
    button.disabled = true;

    try {
      const result = await checkMovieOnPTP(imdb_id, window.location.href);
      if (result.ptp_data.Torrents) {
        const ptpPage = `https://passthepopcorn.me/torrents.php?torrentid=${result.ptp_data.Torrents[0].Id}`;
        button.textContent = 'See on PTP';
        button.parentElement.classList.remove('glow');
        button.classList.remove('glow');
        button.removeEventListener('click', handleCheckButtonClick);
        button.addEventListener('click', () => window.open(ptpPage, '_blank'));
      } else {
        button.textContent = 'Not on PTP!!';
        triggerConfetti();
      }
    } catch (error) {
      if (error.message.includes('429')) {
        // Rate limit hit
        button.textContent = 'Rate limited. Retry in 2s';
        setTimeout(() => {
          button.textContent = 'On PTP?';
          button.disabled = false;
        }, 2000);
      } else {
        handleError(button, error);
      }
    } finally {
      button.disabled = false;
    }
  }

  function createCheckButton(link) {
    const checkButton = document.createElement('button');
    checkButton.textContent = 'On PTP?';
    checkButton.classList.add('btn', 'btn-primary', 'glow');
    checkButton.style.marginLeft = '10px';
    checkButton.setAttribute('data-imdb-url', link.href);
    checkButton.addEventListener('click', handleCheckButtonClick);
    link.parentElement.appendChild(checkButton);
    return checkButton;
  }

  function autoClickButtons(buttons) {
    buttons.forEach(button => button.click());
  }

  function init() {
    loadCSS(
      'https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/css/iziToast.min.css'
    );
    addStyles();

    const links = document.querySelectorAll('a');
    const checkButtons = [];
    links.forEach(link => {
      const imdb_id = parseImdbId(link.href);
      if (imdb_id) {
        link.parentElement.classList.add('glow');
        const checkButton = createCheckButton(link);
        checkButtons.push(checkButton);
      }
    });

    if (CONFIG.AUTO_CLICK && checkButtons.length > 0) {
      autoClickButtons(checkButtons);
    }

    applyGlowAnimation();
  }

  // Run the script
  init();
})();
