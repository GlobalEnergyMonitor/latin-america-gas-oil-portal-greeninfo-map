# Latin America Coal Tracker

Project with [Global Energy Monitor](https://globalenergymonitor.org), based on previous trackers, specifically Fossil Tracker and Coal Tracker, and the more recent 2021 trackers

Quickbooks: "CoalSwarm:Latin America Energy Tracker"

* Point based with clustering (production method)
* Three types: Coal projects, Coal mines, Steel plants
* Status filters
* Some support for URL parameters (though these were never ported to WP in previous versions for some reason)

## Hosting

An iframe embedded in a WordPress page: https://portalenergetico.org/oil-gas-map 

GH pages links 
https://greeninfo-network.github.io/latin-america-gas-tracker/
https://greeninfo-network.github.io/latin-america-gas-tracker/?lang=es
https://greeninfo-network.github.io/latin-america-gas-tracker/?lang=pt

## Development

Pre-requisites:
* Node (>=12.0.0), npm (>=6.14.9), nvm (>= 0.32.1)

To match the development node version:
```bash
nvm use
```

To install required packages (first time only on a new machine):
```bash
npm install
```

To start a development server on `localhost:8080` and watch for changes:
```bash
npm run start
```

## Production
```bash
# build to the docs directory and commit to `main`
npm run build
```
The app is hosted on GitHub pages (via the `docs/` folder).

## Data update
- Typically the client will email an update as a separate spreadsheet. Import this into a new tab into [this sheet](https://docs.google.com/spreadsheets/d/1IbR6nWZc_SNDqknGqeTcLnFwzi2sNfgrtYmMBDxAUIc/edit#gid=1095235442), and then replace the `raw_data` tab with the new data, making sure that columns are maintained in the same order 
- Then download the `data_export` tab and save as `data/data.csv`
- On major updates, run `documentation/update_country_geojson/make_countries_json.py` to capture boundaries for new countries that may have been added. 

## Translation
Terms to be translated are managed [on this sheet](https://docs.google.com/spreadsheets/d/1IbR6nWZc_SNDqknGqeTcLnFwzi2sNfgrtYmMBDxAUIc/edit#gid=421379935). Download `csv` and save as `data/translation.csv`. Translation itself happens on load only - there is no option to switch langauge within the application. The chosen language must be set by URL param for `lang`, options are `lang=en`, `lang=es`, and `lang=pt`. The bulk of translation happens in `initTranslation()`, but some data is also tranlated in-place in `initDataFormat()`. Finally, DataTables has its own language sheets, and these are loaded in `drawTable()`, and served from here in `static/libs`
