(() => {
  // Set to false to work without backend (frontend-only mode)
  const USE_BACKEND = false;

  const STORAGE_KEYS = {
    rowId: 'essatoLeadRowId',
    sizes: 'essatoLeadSizes',
    sizeChart: 'essatoSizeChartUrl',
    email: 'essatoLeadEmail'
  };

  const API_ROUTES = {
    submitPage1: '/backend/submitPage1.js',
    submitPage2: '/backend/submitPage2.js',
    email1: '/backend/email1.js',
    email2: '/backend/email2.js'
  };

  // Generate a mock UUID for testing
  function generateMockRowId() {
    return 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Simulate API delay for better UX
  function delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    updateYear();

    switch (page) {
      case 'page1':
        initPage1();
        break;
      case 'page2':
        initPage2();
        break;
      case 'thanks':
        initThanks();
        break;
      default:
        break;
    }
  });

  function updateYear() {
    const el = document.getElementById('year');
    if (el) {
      el.textContent = new Date().getFullYear();
    }
  }

  function initPage1() {
    const form = document.getElementById('lead-form');
    const statusEl = document.getElementById('lead-status');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      statusEl.textContent = '';
      const submitBtn = form.querySelector('button[type="submit"]');
      toggleButton(submitBtn, true);

      const payload = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim()
      };

      if (!payload.name || !payload.phone || !payload.email) {
        statusEl.textContent = 'Please fill in all required fields.';
        toggleButton(submitBtn, false);
        return;
      }

      try {
        let rowId;
        
        if (USE_BACKEND) {
          const response = await postJSON(API_ROUTES.submitPage1, payload);
          rowId = response.rowId;
          if (!rowId) throw new Error('Missing row ID from server.');
          
          await postJSON(API_ROUTES.email1, {
            rowId,
            email: payload.email,
            name: payload.name,
            phone: payload.phone,
            page2Url: new URL('page2.html', window.location.origin).href
          });
        } else {
          // Frontend-only mode: generate mock rowId and simulate delay
          await delay(800);
          rowId = generateMockRowId();
          console.log('Frontend-only mode: Mock rowId generated:', rowId);
          console.log('Would send Email #1 to:', payload.email);
        }

        localStorage.setItem(STORAGE_KEYS.rowId, rowId);
        localStorage.setItem(STORAGE_KEYS.email, payload.email);

        window.location.href = 'page2.html';
      } catch (error) {
        console.error(error);
        statusEl.textContent = error.message || 'Something went wrong. Please try again.';
        toggleButton(submitBtn, false);
      }
    });
  }

  function initPage2() {
    const form = document.getElementById('measurement-form');
    const statusEl = document.getElementById('measurement-status');
    if (!form) return;

    const rowId = localStorage.getItem(STORAGE_KEYS.rowId);
    if (!rowId) {
      window.location.href = 'page1.html';
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      statusEl.textContent = '';
      const submitBtn = form.querySelector('button[type="submit"]');
      toggleButton(submitBtn, true);

      const measurements = {
        bust: form.bust.value,
        naturalWaist: form.naturalWaist.value,
        pantWaist: form.pantWaist.value,
        hip: form.hip.value,
        thigh: form.thigh.value,
        jacketLength: form.jacketLength.value,
        jacketWidth: form.jacketWidth.value,
        pantsLength: form.pantsLength.value,
        pantsWidth: form.pantsWidth.value,
        notes: form.notes.value.trim()
      };

      if (Object.values(measurements).some((value, idx) => idx < 9 && !value)) {
        statusEl.textContent = 'Please complete all measurement fields.';
        toggleButton(submitBtn, false);
        return;
      }

      const jacketSize = formatJacketSize(measurements.bust, measurements.jacketLength, measurements.jacketWidth);
      const pantSize = formatPantSize(measurements.pantWaist, measurements.pantsLength, measurements.pantsWidth);

      const sizeChartUrl = 'https://example.com/size-chart';

      try {
        if (USE_BACKEND) {
          await postJSON(API_ROUTES.submitPage2, {
            rowId,
            measurements,
            sizes: {
              jacket: jacketSize,
              pant: pantSize
            }
          });

          await postJSON(API_ROUTES.email2, {
            rowId,
            email: localStorage.getItem(STORAGE_KEYS.email) || '',
            jacketSize,
            pantSize,
            sizeChartUrl,
            socials: {
              instagram: 'https://instagram.com/essatocustoms',
              linkedin: 'https://www.linkedin.com/company/essato-customs',
              tiktok: 'https://www.tiktok.com/@essatocustoms'
            }
          });
        } else {
          // Frontend-only mode: simulate delay
          await delay(800);
          console.log('Frontend-only mode: Measurements saved locally');
          console.log('Jacket Size:', jacketSize);
          console.log('Pant Size:', pantSize);
          console.log('Would send Email #2 to:', localStorage.getItem(STORAGE_KEYS.email));
        }

        localStorage.setItem(STORAGE_KEYS.sizes, JSON.stringify({ jacketSize, pantSize }));
        localStorage.setItem(STORAGE_KEYS.sizeChart, sizeChartUrl);
        window.location.href = 'thanks.html';
      } catch (error) {
        console.error(error);
        statusEl.textContent = error.message || 'Unable to save measurements right now.';
        toggleButton(submitBtn, false);
      }
    });
  }

  function initThanks() {
    const jacketEl = document.getElementById('jacket-size-display');
    const pantEl = document.getElementById('pant-size-display');
    const link = document.getElementById('size-chart-link');

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.sizes) || '{}');
      const jacket = saved.jacketSize || '--';
      const pant = saved.pantSize || '--';
      if (jacketEl) jacketEl.textContent = jacket;
      if (pantEl) pantEl.textContent = pant;
    } catch (error) {
      console.warn('Unable to read saved sizes', error);
    }

    const storedLink = localStorage.getItem(STORAGE_KEYS.sizeChart);
    if (link && storedLink) {
      link.href = storedLink;
    }
  }

  function roundToNearestEven(value) {
    const num = Number(value);
    if (Number.isNaN(num)) return null;
    const lower = Math.floor(num / 2) * 2;
    const upper = Math.ceil(num / 2) * 2;
    return (num - lower) <= (upper - num) ? lower : upper;
  }

  function formatJacketSize(bust, lengthPref, widthPref) {
    const evenBust = roundToNearestEven(bust);
    return evenBust ? `${evenBust} ${lengthPref}, ${widthPref}` : `${lengthPref}, ${widthPref}`;
  }

  function formatPantSize(pantWaist, lengthPref, widthPref) {
    const evenPant = roundToNearestEven(pantWaist);
    return evenPant ? `${evenPant} ${lengthPref}, ${widthPref}` : `${lengthPref}, ${widthPref}`;
  }

  async function postJSON(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      let message = 'Request failed.';
      try {
        const payload = await response.json();
        message = payload.error || message;
      } catch (error) {
        // ignore
      }
      throw new Error(message);
    }
    return response.json();
  }

  function toggleButton(button, isLoading) {
    if (!button) return;
    if (!button.dataset.defaultText) {
      button.dataset.defaultText = button.textContent.trim();
    }
    button.disabled = isLoading;
    button.dataset.loading = isLoading ? 'true' : 'false';
    button.textContent = isLoading ? 'Sending…' : button.dataset.defaultText;
  }
})();

