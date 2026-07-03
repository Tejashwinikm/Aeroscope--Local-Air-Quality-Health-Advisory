# Aeroscope — Local Air Quality & Health Advisory

A single-page, no-backend web app that reads live air pollution data for any city
and turns it into a plain-English health advisory ("avoid outdoor exercise today",
etc). Built with plain HTML, CSS, and JavaScript — no frameworks, no build step,
no server. Powered by the free [OpenWeatherMap Air Pollution API](https://openweathermap.org/api/air-pollution).

## Features

- Search any city, or use one-tap browser geolocation
- Live AQI on OpenWeatherMap's 1–5 scale, with a color-coded "atmosphere column" gauge
- Health advisory tailored to the current AQI band (exercise, masks, sensitive groups, windows)
- Full pollutant breakdown: PM2.5, PM10, O₃, NO₂, SO₂, CO, NH₃, NO
- 48-hour forecast strip so you can plan around bad-air windows
- Your API key stays in your own browser's `localStorage` — never sent anywhere but OpenWeatherMap

## Getting started

1. **Get a free API key**
   Sign up at [home.openweathermap.org/users/sign_up](https://home.openweathermap.org/users/sign_up).
   New keys can take up to ~2 hours to activate.

2. **Clone / download this repo**

   ```bash
   git clone https://github.com/<your-username>/aeroscope.git
   cd aeroscope
   ```

3. **Open it**
   Just open `index.html` in a browser — that's it, no build step. For geolocation
   to work reliably in some browsers you may want to serve it locally instead of
   using `file://`:

   ```bash
   # any static server works, e.g.
   python3 -m http.server 8000
   # then visit http://localhost:8000
   ```

4. **Paste your API key** into the prompt on first load. It's saved locally so
   you only do this once per browser.

## Project structure

```
aeroscope/
├── index.html      # markup + layout
├── style.css       # design system (CSS variables, atmosphere-column gauge)
├── script.js        # geocoding, API calls, AQI → advisory logic, rendering
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

Because the API key is entered by each visitor and stored only in their own
browser, it's safe to make this repo public — you're not committing any secret.

## Notes & limitations

- OpenWeatherMap's free tier air-pollution endpoints don't require a paid plan.
- The forecast endpoint returns hourly data; the UI samples every 3rd hour to
  keep the strip readable.
- This is an informational tool, not medical advice — for official guidance,
  always defer to local public health authorities.

## License

MIT — do whatever you'd like with it.
