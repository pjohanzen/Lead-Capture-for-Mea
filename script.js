(() => {
  // Set to true to enable Google Sheets integration
  const USE_BACKEND = true;

  // IMPORTANT: Replace this URL with your Google Apps Script Web App URL
  // after deploying the script (see SETUP_INSTRUCTIONS.md)
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw223ky386uwylwqQYKawizC5njmqltcLR_EED_wZgU28hXIBJb5aSHBb9_0HrRBEKGnw/exec';

  const STORAGE_KEYS = {
    rowId: 'essatoLeadRowId',
    sizes: 'essatoLeadSizes',
    sizeChart: 'essatoSizeChartUrl',
    email: 'essatoLeadEmail'
  };

  const API_ROUTES = {
    submitPage1: GOOGLE_APPS_SCRIPT_URL,
    submitPage2: GOOGLE_APPS_SCRIPT_URL, // Same URL, different formType
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
        formType: 'page1',
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
          
          console.log('Response received:', response);
          
          // Check if the response indicates success
          if (!response.success) {
            throw new Error(response.error || 'Failed to save your entry. Please try again.');
          }
          
          // Google Apps Script returns rowNumber, we'll use that as rowId
          rowId = response.rowNumber ? `row-${response.rowNumber}` : generateMockRowId();
          
          console.log('Entry saved successfully! Row ID:', rowId);
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
        console.error('Submission error:', error);
        statusEl.textContent = error.message || 'Failed to submit form. Please try again.';
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
        pantsWidth: form.pantsWidth.value
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
          // Extract the actual row number from rowId (format: "row-123")
          const rowNumber = rowId ? parseInt(rowId.split('-')[1]) : null;
          
          if (!rowNumber) {
            throw new Error('Invalid row number. Please start from page 1.');
          }

          const response = await postJSON(API_ROUTES.submitPage2, {
            formType: 'page2',
            rowNumber: rowNumber,
            measurements,
            sizes: {
              jacket: jacketSize,
              pant: pantSize
            }
          });

          if (!response.success) {
            throw new Error(response.error || 'Failed to save measurements.');
          }

          console.log('Measurements saved successfully to Google Sheets!');
          
          // Skip email sending for now (can be added later)
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
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain' // Changed to avoid CORS preflight
        },
        body: JSON.stringify(data),
        redirect: 'follow'
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Google Apps Script returns the response
      const result = await response.json();
      
      // Log the full response for debugging
      console.log('Server response:', result);
      
      return result;
    } catch (error) {
      console.error('Fetch error:', error);
      throw new Error('Failed to connect to server. Please check your connection and try again.');
    }
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

