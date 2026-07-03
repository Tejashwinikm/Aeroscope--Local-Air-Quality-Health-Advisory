# Aeroscope — Local Air Quality & Health Advisory

A single-page, no-backend web app that reads live air pollution data for any city
and turns it into a English health advisory ("avoid outdoor exercise today",
etc). Built with HTML, CSS, and JavaScript — no frameworks, no build step,
no server. Powered by the free [OpenWeatherMap Air Pollution API](https://openweathermap.org/api/air-pollution).

## 🌐 Live Demo
 
🔗 [https://tejashwinikm.github.io/Aeroscope--Local-Air-Quality-Health-Advisory/](https://tejashwinikm.github.io/Aeroscope--Local-Air-Quality-Health-Advisory/)

## Features

- Search any city, or use one-tap browser geolocation
- Live AQI (Air Quality Index) on OpenWeatherMap's 1–5 scale, with a color-coded "atmosphere column" gauge
- Health advisory tailored to the current AQI band (exercise, masks, sensitive groups, windows)
- Full pollutant breakdown: PM2.5, PM10, O₃, NO₂, SO₂, CO, NH₃, NO
- 48-hour forecast strip so you can plan around bad-air windows
- Your API key stays in your own browser's `localStorage`

## Getting started

1. **Get a free API key**
   Sign up at [home.openweathermap.org/users/sign_up](https://home.openweathermap.org/users/sign_up).
   New keys can take up to ~2 hours to activate.
   
3. **Clone / download this repo**
```bash
   git clone https://github.com/Tejashwinikm/Aeroscope--Local-Air-Quality-Health-Advisory.git
   cd Aeroscope--Local-Air-Quality-Health-Advisory
```
 
3. **Add your API key**
   Open `script.js` and paste your key into the `HARDCODED_API_KEY` constant near
   the top of the file:
```javascript
   const HARDCODED_API_KEY = 'your_key_here';
```
 
4. **Run it**
   Open `index.html` in a browser, or serve it locally for more reliable
   geolocation support (recommended: VS Code's Live Server extension, or):
```bash
   python3 -m http.server 8000
   # then visit http://localhost:8000
```

## 📁 Project structure

```
aeroscope/
├── index.html      # markup + layout
├── style.css       # design system 
├── script.js       # geocoding, API calls, AQI → advisory logic, rendering
└── README.md
```

## How the AQI → advisory logic works

OpenWeatherMap reports air quality on a **1–5 index** (Good → Very Poor), not the
US EPA 0–500 scale you may be used to. `script.js` maps each of the five levels to:
 
- a headline recommendation (e.g. "Avoid outdoor exercise")
- a short list of concrete actions (masks, windows, sensitive groups, indoor exercise)
It also compares each pollutant's concentration against a WHO-style reference
threshold to call out whichever pollutant is the main driver that day (e.g. "PM2.5
is the main contributor today").
 
## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to `Deploy from a branch`, branch
   `main`, folder `/ (root)`.
4. Save — your app will be live at `https://<your-username>.github.io/<repo-name>/`
   within a minute or two.
⚠️ This project keeps the API key directly in `script.js`, which means it's visible
to anyone who views the source of a public repo. That's an acceptable tradeoff for
a portfolio/demo project, but if you'd rather not expose your key publicly, consider
regenerating it periodically, or switching back to a per-visitor key-entry flow
stored in `localStorage`.
 
## Notes & limitations
 
- OpenWeatherMap's free tier air-pollution endpoints don't require a paid plan.
- The forecast endpoint returns hourly data; the UI samples every 3rd hour to
  keep the strip readable.
- This is an informational tool, not medical advice — for official guidance,
  always defer to local public health authorities.
