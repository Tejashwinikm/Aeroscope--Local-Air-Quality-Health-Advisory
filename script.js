/* ==========================================================================
   AEROSCOPE — Local Air Quality & Health Advisory
   Pure vanilla JS. Talks directly to the OpenWeatherMap
   Geocoding + Air Pollution APIs from the browser.
   ========================================================================== */

const OWM_BASE = 'https://api.openweathermap.org';

/* 👇 Your OpenWeatherMap API key 👇 */
const HARDCODED_API_KEY = '282660594a83b8bff9e2434ee42ce924';

/* ---------- AQI reference data (OpenWeather 1–5 scale) ---------- */

const AQI_INFO = {
  1: {
    label: 'Good',
    color: '--aqi-1',
    summary: 'Air quality is satisfying and poses little or no risk. A great day to be outside.',
    headline: 'Enjoy the outdoors freely today.',
    advice: [
      'Outdoor exercise, sports, and long walks are all safe.',
      'Fine to open windows and let fresh air circulate indoors.',
      'No precautions needed for children, elderly, or people with respiratory conditions.'
    ]
  },
  2: {
    label: 'Fair',
    color: '--aqi-2',
    summary: 'Air quality is acceptable. A small number of unusually sensitive people may notice mild effects.',
    headline: 'Generally safe — light caution for sensitive individuals.',
    advice: [
      'Most people can continue normal outdoor activity without concern.',
      'If you have asthma or a chronic respiratory condition, keep an eye on how you feel during longer exertion.',
      'Good day to ventilate indoor spaces.'
    ]
  },
  3: {
    label: 'Moderate',
    color: '--aqi-3',
    summary: 'Air quality is acceptable for most, but sensitive groups may start to experience mild irritation.',
    headline: 'Sensitive groups should ease up on prolonged outdoor exertion.',
    advice: [
      'People with asthma, heart or lung conditions, children, and older adults should limit prolonged or intense outdoor exercise.',
      'The general public can continue normal activity, but consider shortening intense workouts outdoors.',
      'Watch for symptoms like coughing or shortness of breath and move indoors if they appear.'
    ]
  },
  4: {
    label: 'Poor',
    color: '--aqi-4',
    summary: 'Air quality is unhealthy for sensitive groups, and everyone else may begin to notice effects.',
    headline: 'Avoid outdoor exercise — especially if you\u2019re in a sensitive group.',
    advice: [
      'Postpone strenuous outdoor exercise; move workouts indoors if possible.',
      'Sensitive groups (children, elderly, asthma/heart conditions) should stay indoors as much as possible.',
      'Keep windows closed and run an air purifier indoors if you have one.',
      'Consider an N95/KN95 mask if you must be outside for extended periods.'
    ]
  },
  5: {
    label: 'Very Poor',
    color: '--aqi-5',
    summary: 'Air quality is hazardous. Health warnings of emergency conditions — the entire population is likely affected.',
    headline: 'Stay indoors. Avoid all outdoor exertion today.',
    advice: [
      'Cancel outdoor exercise entirely and stay indoors as much as possible.',
      'Everyone, not just sensitive groups, should minimize time outside.',
      'Keep windows and doors sealed; run an air purifier on a high setting if available.',
      'Wear a well-fitted N95/KN95 mask for any essential trips outside.',
      'Seek medical attention if you experience chest pain, dizziness, or difficulty breathing.'
    ]
  }
};

/* WHO-ish reference bands used only to flag the dominant pollutant in the UI copy */
const POLLUTANTS = [
  { key: 'pm2_5', label: 'PM2.5', unit: 'μg/m³', threshold: 15 },
  { key: 'pm10',  label: 'PM10',  unit: 'μg/m³', threshold: 45 },
  { key: 'o3',    label: 'Ozone (O₃)', unit: 'μg/m³', threshold: 100 },
  { key: 'no2',   label: 'NO₂',   unit: 'μg/m³', threshold: 25 },
  { key: 'so2',   label: 'SO₂',   unit: 'μg/m³', threshold: 40 },
  { key: 'co',    label: 'CO',    unit: 'μg/m³', threshold: 4000 },
  { key: 'nh3',   label: 'NH₃',   unit: 'μg/m³', threshold: 200 },
  { key: 'no',    label: 'NO',    unit: 'μg/m³', threshold: 200 }
];

/* ---------- DOM refs ---------- */

const el = (id) => document.getElementById(id);

const loadingState = el('loading-state');
const errorState = el('error-state');
const dashboard = el('dashboard');

const searchForm = el('search-form');
const cityInput = el('city-input');
const locateBtn = el('locate-btn');

const errorMessage = el('error-message');
const errorRetry = el('error-retry');

/* ---------- state ---------- */

let lastQuery = null; // { lat, lon, label } — used for retry

/* ---------- view helpers ---------- */

function showOnly(section) {
  [loadingState, errorState, dashboard].forEach(s => s.hidden = true);
  section.hidden = false;
}

function getApiKey() {
  return HARDCODED_API_KEY;
}

/* ---------- init ---------- */

function init() {
  showOnly(loadingState);
  requestGeolocation();
}

errorRetry.addEventListener('click', () => {
  if (lastQuery) {
    loadByCoords(lastQuery.lat, lastQuery.lon, lastQuery.label);
  } else {
    init();
  }
});

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  showOnly(loadingState);
  try {
    const { lat, lon, label } = await geocodeCity(city);
    await loadByCoords(lat, lon, label);
  } catch (err) {
    showError(err.message);
  }
});

locateBtn.addEventListener('click', () => {
  showOnly(loadingState);
  requestGeolocation();
});

function requestGeolocation() {
  if (!navigator.geolocation) {
    showError('Geolocation isn\u2019t available in this browser. Try searching for a city instead.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const label = await reverseGeocode(latitude, longitude);
        await loadByCoords(latitude, longitude, label);
      } catch (err) {
        showError(err.message);
      }
    },
    () => {
      // Permission denied or unavailable — fall back to a default city so the app isn't empty
      geocodeCity('Bengaluru')
        .then(({ lat, lon, label }) => loadByCoords(lat, lon, label))
        .catch((err) => showError(err.message));
    },
    { timeout: 8000 }
  );
}

/* ---------- API calls ---------- */

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('The API key was rejected. Double check it in script.js, or wait a bit if you just created it — new keys take time to activate.');
    }
    if (res.status === 404) {
      throw new Error('Couldn\u2019t find that location. Try a different spelling, or add a country, e.g. "Springfield, US".');
    }
    throw new Error(`Request failed (${res.status}). Please try again.`);
  }
  return res.json();
}

async function geocodeCity(city) {
  const key = getApiKey();
  const url = `${OWM_BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`;
  const data = await apiGet(url);
  if (!data.length) throw new Error(`Couldn\u2019t find "${city}". Try adding a country code, e.g. "Paris, FR".`);
  const place = data[0];
  const label = [place.name, place.state, place.country].filter(Boolean).join(', ');
  return { lat: place.lat, lon: place.lon, label };
}

async function reverseGeocode(lat, lon) {
  const key = getApiKey();
  const url = `${OWM_BASE}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`;
  try {
    const data = await apiGet(url);
    if (data.length) {
      const place = data[0];
      return [place.name, place.state, place.country].filter(Boolean).join(', ');
    }
  } catch (_) { /* fall through */ }
  return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
}

async function fetchCurrentPollution(lat, lon) {
  const key = getApiKey();
  const url = `${OWM_BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;
  return apiGet(url);
}

async function fetchForecastPollution(lat, lon) {
  const key = getApiKey();
  const url = `${OWM_BASE}/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${key}`;
  return apiGet(url);
}

/* ---------- orchestration ---------- */

async function loadByCoords(lat, lon, label) {
  lastQuery = { lat, lon, label };
  showOnly(loadingState);
  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentPollution(lat, lon),
      fetchForecastPollution(lat, lon)
    ]);
    render(current, forecast, label);
    showOnly(dashboard);
  } catch (err) {
    showError(err.message);
  }
}

function showError(message) {
  errorMessage.textContent = message;
  showOnly(errorState);
}

/* ---------- rendering ---------- */

function render(current, forecast, label) {
  const point = current.list[0];
  const aqi = point.main.aqi; // 1..5
  const info = AQI_INFO[aqi];
  const components = point.components;

  document.documentElement.style.setProperty('--aqi-color-live', `var(${info.color})`);

  // hero
  el('loc-name').textContent = label;
  el('updated-at').textContent = 'Updated ' + new Date(point.dt * 1000).toLocaleString(undefined, {
    hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
  });

  const category = el('aqi-category');
  category.textContent = info.label;
  category.style.setProperty('--aqi-color', `var(${info.color})`);

  const indexRow = document.querySelector('.hero__index-row');
  indexRow.style.setProperty('--aqi-color', `var(${info.color})`);
  el('aqi-index').textContent = aqi;
  el('aqi-index').style.setProperty('--aqi-color', `var(${info.color})`);

  el('aqi-summary').textContent = info.summary + ' ' + dominantPollutantNote(components);

  // atmosphere column marker: band 1 sits at bottom, band 5 at top.
  // marker's vertical position = center of the band matching current aqi.
  const marker = el('atmo-marker');
  const bandHeightPct = 100 / 5;
  const bandIndexFromTop = 5 - aqi; // aqi 5 -> band 0 (top), aqi 1 -> band 4 (bottom)
  const centerPct = (bandIndexFromTop * bandHeightPct) + (bandHeightPct / 2);
  marker.style.top = `${centerPct}%`;
  marker.style.setProperty('--aqi-color', `var(${info.color})`);

  // advisory
  const advisory = el('advisory');
  advisory.style.setProperty('--aqi-color', `var(${info.color})`);
  el('advisory-headline').textContent = info.headline;
  const list = el('advisory-list');
  list.innerHTML = '';
  info.advice.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });

  // pollutant grid
  const grid = el('pollutant-grid');
  grid.innerHTML = '';
  POLLUTANTS.forEach(p => {
    const value = components[p.key];
    if (value === undefined) return;
    const card = document.createElement('div');
    card.className = 'pollutant-card';
    card.innerHTML = `
      <p class="pollutant-card__label">${p.label}</p>
      <p class="pollutant-card__value">${value.toFixed(1)} <span>${p.unit}</span></p>
    `;
    grid.appendChild(card);
  });

  // forecast strip (next 48h, sampled hourly from OWM's hourly list)
  const strip = el('forecast-strip');
  strip.innerHTML = '';
  const upcoming = forecast.list.slice(0, 48).filter((_, i) => i % 3 === 0); // every 3rd hour
  upcoming.forEach(item => {
    const itemAqi = item.main.aqi;
    const itemInfo = AQI_INFO[itemAqi];
    const time = new Date(item.dt * 1000).toLocaleTimeString(undefined, { hour: 'numeric' });
    const el2 = document.createElement('div');
    el2.className = 'forecast-item';
    el2.innerHTML = `
      <div class="forecast-item__bar">
        <div class="forecast-item__fill" style="height:${itemAqi * 20}%; background: var(${itemInfo.color})"></div>
      </div>
      <span class="forecast-item__time">${time}</span>
    `;
    el2.title = `${itemInfo.label} (${itemAqi}/5)`;
    strip.appendChild(el2);
  });
}

function dominantPollutantNote(components) {
  let worst = null;
  let worstRatio = 0;
  POLLUTANTS.forEach(p => {
    const value = components[p.key];
    if (value === undefined) return;
    const ratio = value / p.threshold;
    if (ratio > worstRatio) {
      worstRatio = ratio;
      worst = p;
    }
  });
  if (worst && worstRatio > 1) {
    return `${worst.label} is the main contributor today.`;
  }
  return '';
}

/* ---------- go ---------- */

init();