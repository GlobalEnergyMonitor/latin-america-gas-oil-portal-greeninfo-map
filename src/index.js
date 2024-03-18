///////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS
///////////////////////////////////////////////////////////////////////////////////////////////////////////
import MobileDetect from 'mobile-detect';
import * as JsSearch from 'js-search';

///////////////////////////////////////////////////////////////////////////////////
// STYLES, in production, these will be written to <script> tags
///////////////////////////////////////////////////////////////////////////////////
import './loading.css';
import styles from './index.scss';

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES & STRUCTURES
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// global config
const CONFIG = {};
const DATA = {};

// minzoom and maxzoom for the map
CONFIG.minzoom = 2;
CONFIG.maxzoom = 15;

// Style definitions (see also scss exports, which are imported here as styles{})
// style for highlighting countries on hover and click
CONFIG.country_hover_style    = { stroke: 3, color: '#1267a5', opacity: 0.6, fill: '#fff', fillOpacity: 0 };
CONFIG.country_selected_style = { stroke: 3, color: '#1267a5', opacity: 1, fill: false, fillOpacity: 0 };
// an "invisible" country style, as we don't want countries to show except on hover or click
CONFIG.country_no_style = { opacity: 0, fillOpacity: 0 };

// feature highlight styles, shows below features on hover or click
CONFIG.feature_hover_style  = { color: '#fff5a3', fillOpacity: 1, stroke: 13, weight: 13, opacity: 1 };
CONFIG.feature_select_style = { color: '#f2e360', fillOpacity: 1, stroke: 13, weight: 13, opacity: 1 };

// Define the attributes used in the DataTable and map popup
// name: formatted label for presentation
// format: data type, for format function in CONFIG.format
// classname: used in DataTables <th>
CONFIG.attributes = {
  'project': {name: 'Project Name', format: 'string', classname: 'project', table: true, popup: true},
  'type': {name: 'Type', format: 'string', classname: 'type', table: true, popup: true},
  'unit': {name: 'Unit', format: 'string', classname: 'unit', table: true, popup: true},
  'owner': {name: 'Owner', format: 'string', classname: 'owner', table: true, popup: true},
  'parent': {name: 'Parent', format: 'string', classname: 'parent', table: true, popup: true},
  'province': {name: 'Province', format: 'string', classname: 'province', table: true, popup: true}, 
  'country': {name: 'Country', format: 'string', classname: 'country', table: true, popup: true},
  'status_tabular': {name: 'Status', format: 'string', classname: 'status', table: true, popup: true},
  'status': {name: 'Status', format: 'string', classname: 'status', table: false, popup: false},
  'url': {name: 'Wiki page', format: 'string', table: false, popup: false},
  'capacity': {name: 'Capacity', format: 'variable_float', classname: 'capacity', table: true, popup: true},
  'production': {name: 'Production', format: 'variable_float', classname: 'production', table: true, popup: true},
  'units': {name: 'Capacity or Production units', format: 'string', classname: 'units', table: true, popup: false, tooltip: true},
  'start_year': {name: 'Start Year', format: 'string', classname: 'start_unit', table: true, popup: true},
};

CONFIG.format = {
  // return as is
  'string': function(s) { return s },
  // string to number with 0 decimals
  'number': function(n) {
    // that's right: 'fr-FR': client wants numbers formatted with space as thousands separator
    let locale = CONFIG.language == 'en-US' ? 'en-US' : 'fr-FR';
    return parseFloat(n).toLocaleString(locale, {minimumFractionDigits: 0, maximumFractionDigits: 0});
  },
  // string to float with two decimals
  'float': function(n) {
    // that's right: 'fr-FR': client wants numbers formatted with space as thousands separator
    let locale = CONFIG.language == 'en-US' ? 'en-US' : 'fr-FR';
    return parseFloat(n).toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  },
  // string to number with as many output decimals as input
  'variable_float': function(n) {
    if (isNaN(n)) return n;
    let num = Math.round((+n + Number.EPSILON) * 100) / 100; 
    // that's right: 'fr-FR': client wants numbers formatted with space as thousands separator
    let locale = CONFIG.language == 'en-US' ? 'en-US' : 'fr-FR';
    if (num < 11) {
      return parseFloat(num).toLocaleString(locale);
    } else {
      return parseFloat(num).toLocaleString(locale, {minimumFractionDigits: 0, maximumFractionDigits: 0}); 
    }
  },
  // if entered value is NaN, then return it, otherwise same as number, above
  'mixed':  function(m) { return isNaN(m) ? m : CONFIG.format['number'](m) },
}


// Status types: these are the categories used to symbolize coal plants on the map and in clusters
//          key: allowed status names, matching those used in DATA.fossil_data
//          text: human readible display
//          color: color on the map, used primarily in pruneCluster
//          cssclass: css class used for map and legend symbology
//          order: used in pruneCluster 
// Note: the text here is no longer relevant. See translation.csv for the definitive terms in supported languages
CONFIG.status_types = {
  'operating': {text: 'Operating', color: styles.status1, cssclass: 'status1', order: 1 },
  'construction_plus': {text: 'Construction / In development', color: styles.status2, cssclass: 'status2', order: 2 },
  'pre-construction': {text: 'Pre-construction', cssclass: 'status3', color: styles.status2, order: 3},
  'proposed_plus': {text: 'Proposed / Discovered', color: styles.status4, cssclass: 'status4', order: 4 },
  'cancelled': {text: 'Cancelled', color: styles.status5, cssclass: 'status5', order: 5 },
  'shelved': {text: 'Shelved', color: styles.status6, cssclass: 'status6', order: 6 },
  'retired': {text: 'Retired', color: styles.status7, cssclass: 'status7', order: 7 },
  'mothballed_plus': {text: 'Mothballed / Idle / Shut in', color: styles.status8, cssclass: 'status8', order: 8 },
};

// A second set of status type definitions for the table and map popups
// Here we do not combine categories, but instead show them separately
CONFIG.status_types_tabular = {
  'operating': {text: 'Operating'},
  'construction': {text: 'Construction'},
  'pre-construction': {text: 'Pre-construction'},
  'in-development': {text: 'In development'},
  'proposed': {text: 'Propsed'},
  'announced': {text: 'Announced'},
  'discovered': {text: 'Discovered'},
  'cancelled': {text: 'Cancelled'},
  'shelved': {text: 'Shelved'},
  'retired': {text: 'Retired'},
  'mothballed': {text: 'Mothballed'},
  'idle': {text: 'Idle'},
  'shut-in': {text: 'Shut in'},
};

// Fossil types: The types of projects. These will form a second set of checkboxes on the map
// Note: the text here is no longer relevant. See translation.csv for the definitive terms in supported languages
CONFIG.fossil_types = {
  // points
  'lng_terminal': {text: 'LNG Terminal', symbol: 'circle', shape: 'square'},
  'gas_power_plant': {text: 'Gas Power Plant', symbol: 'circle', shape: 'circle'},
  'oil_and_gas_extraction_area':  {text: 'Oil & Extraction Area', symbol: 'circle', shape: 'triangle'},
  // lines
  'gas_pipeline': {text: 'Gas Pipeline', symbol: 'line', shape: 'line'},
  'oil_pipeline': {text: 'Oil Pipeline', symbol: 'line', shape: 'line'},
}

// Note: prunecluster.markercluster.js needs this, and I have not found a better way to provide it
CONFIG.markercluster_colors = Object.keys(CONFIG.status_types).map(function(v) { return CONFIG.status_types[v].color });

// false until the app and map are fully loaded
CONFIG.first_load = true;
CONFIG.map_loaded = false;

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// INITIALIZATION: these functions are called when the page is ready,
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function () {
  // data initialization first, then the remaining init steps
  Promise.all([initData('./data/data.csv'), initData('./data/countries.json'), initData('./data/translation.csv')])
    .then(function(data) {
      initLanguage()          // figure out which locale to use. Do this first, as initDataFormat depends on it
      initDataFormat(data)    // get data ready for use
console.log(DATA);
console.log(CONFIG);
      initButtons();          // init button listeners
      initTabs();             // init the main navigation tabs
      initSearch();           // init the full text search, and the search input behavior
      initTable();            // the Table is fully populated from the trackers dataset, but is filtered at runtime
      initMap();              // regular leaflet map setup
      initMapLayers();        // init some map layers and map feature styles
      initMapControls();      // initialize the layer pickers, etc.
      initPruneCluster();     // init the "prune cluster" library
      initTranslation();      // do language translation
      initState();            // init app state. This is the app "entry point"


      // ready!
      setTimeout(function () {
        // resize();
        $('div#loading').hide();
        CONFIG.first_load = false;
        initTooltips();         // init Tippy tooltips _after_ the table is ready, and after a delay...
      }, 500);
    }); // Promise.then()

    // initialize a resize handler
    $(window).on('resize', resize );
});

// resize everything: map, content divs, table
function resize() {
  // only thing to do here is make sure that the DT columns line up 
  CONFIG.table.columns.adjust().draw();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// FUNCTIONS CALLED ON DOC READY
///////////////////////////////////////////////////////////////////////////////////////////////////////////

// Basic data init, returns a promise
function initData(url) {
  // wrap this in a promise, so we know we have it before continuing on to remaining initialize steps
  return new Promise(function(resolve, reject) {
    $.get(url, function(data) {
      resolve(data);
    });
  });
}

// Data formatting routines, to get the static, raw data files into the form we need it in
function initDataFormat(data) {
  // set country data equal to the second data object from the initData() Promise()
  DATA.country_data = data[1];

  // keep a reference to translation keys and values
  let translation = Papa.parse(data[2], {header: true});
  DATA.translation = translation.data;

  // set up a country name translation object, for use below, and in massageCountryFeaturesAsTheyLoad()
  DATA.country_translations = {};
  let countryrows = DATA.translation.filter(function(d) { return d.type == 'country' });
  countryrows.forEach(function(d) {
    DATA.country_translations[d.text_en] = {
      'es-MX': d.text_es,
      'pt-BR': d.text_pt
    }
  })

  // get the list of valid types, for data checks, below
  var statuses = Object.keys(CONFIG.status_types);

  // format the "tracker" point and line data
  // 1) parse raw JSON from CSV
  var json = Papa.parse(data[0], {header: true});

  // 2) create stubs for geojson files, one for terminals, one for pipelines
  let fossils = {};
  fossils['type'] = 'FeatureCollection';
  fossils['features'] = [];

  // 3) iterate over raw json to extract geometry and props for GeoJSON
  json.data.forEach(function(row,i) {
    // Initial check: skip rows with invalid status
    if (statuses.indexOf(row.status) < 0) {
      console.log(`Error: ${row.project} has invalid status type: ${row.status}`);
      return;
    }

    // stub out a feature, and coords
    let feature = {
      "type": "Feature",
      "geometry": {},
      "properties": {},
      // This is not well documented, but js-search requires a unique ID for indexing
      // see initSearch()
      id: i,
    };
    let coordinates = [];
    let type;

    // track error condition
    let error = false;
    // Geometry: different for pipelines/terminals
    // only pipelines have a defined route
    if (row.route) {
      // step 1: some of these have a pipe-delimited "center", which we don't need
      let route = row.route.split('|')[0];
      // step 2: segments are semi-colon delimited
      let segments = route.split(';');
      type = segments.length > 1 ? "MultiLineString" : "LineString";
      // within segments are the coords themselves
      segments.forEach(function(segment) {
        let pairs = segment.split(':');
        let line = [];
        pairs.forEach(function(pair) {
          let coords = pair.split(',');
          // coords are in lat, long (y, x) format, and need to be flipped for GeoJSON
          if ( isNaN(parseFloat(coords[1])) || isNaN(parseFloat(coords[0])) ) {
           error = true;
           console.log(`Error: ${row.project} has invalid route`);
          }
          line.push([ parseFloat(coords[1]), parseFloat(coords[0]) ]);
        });
        segments.length > 1 ? coordinates.push(line) : coordinates = line;
      });
    } else {
      // no row.route: we likely have a point

      // validate lat/lng
      if (isNaN(parseFloat(row.lat)) || isNaN(parseFloat(row.lng))) {
        error = true;
        console.log(`Error: ${row.project} invalid latitude and/or longitude`);
      }

      if (!row.lat || !row.lng) {
        error = true;
        console.log(`Error: ${row.project} missing latitude and/or longitude`);
      } 

      type = "Point";
      coordinates[0] = parseFloat(row.lng);
      coordinates[1] = parseFloat(row.lat);
    }

    // all done setting up coordinates, add to the feature
    feature.geometry.type = type;
    feature.geometry.coordinates = coordinates;

    // Properties: Add these from the keys defined in CONFIG.attributes. These will be the same for pipelines/terminals
    let props = Object.keys(CONFIG.attributes);

    // some of the following requires lookups on the langauge.csv sheet, set that up now
    let lookup_field = 'text_en';
    if (CONFIG.language == 'es-MX') lookup_field = 'text_es';
    if (CONFIG.language == 'pt-BR') lookup_field = 'text_pt';

    props.forEach(function(property) {
      let thisprop = row[property];
      // formatting and special cases
      if (property == 'id') thisprop = feature.id; // use the same id set at feature level for search
      if (property == 'project' && CONFIG.language == 'en-US') {
        // use the English project name
        thisprop = row['project_en']
      }
      if (property == 'unit' && CONFIG.language == 'en-US') {
        // use the English unit name
        thisprop = row['unit_en']
      }
      if (property == 'url' && CONFIG.language == 'en-US') {
        // use the English URL
        thisprop = row['url_en']
      }
      if (property == 'country' && CONFIG.language != 'en-US') {
        // split and translate country names in place
        let countries = row[property].split(',');
        let translated_countries = [];
        countries.forEach(function(country) {
          country = country.trim();
          let countryname_translated = DATA.country_translations[country][CONFIG.language]; 
          translated_countries.push(countryname_translated); 
        });
        // all translated: put it back together
        thisprop = translated_countries.join(',');
      }
      if (property == 'units' && CONFIG.language != 'en-US') {
        // all of this to replace the word "boe per day" with a local equivalent
        // get the row from the language lookup we'll use to translate
        let capacity_row = DATA.translation.filter(function(d) { return d.selector == 'capacity_unit_data' });
        // only some of the entries will match, but we have to check them all
        thisprop = thisprop.replace('boe per day', capacity_row[0][lookup_field]);
      }
      if (property == 'start_year' && CONFIG.language != 'en-US') {
        // all of this to replace the words "before" and "predicted" with local equivalents
        // get the row from the language lookup we'll use to translate
        let before_row    = DATA.translation.filter(function(d) { return d.selector == 'before' });
        let predicted_row = DATA.translation.filter(function(d) { return d.selector == 'predicted' });
        // only some of the entries will match, but we have to check them all
        thisprop = thisprop.replace('before', before_row[0][lookup_field]); // note: not a global replace, but there should only be one
        thisprop = thisprop.replace('predicted', predicted_row[0][lookup_field]); // note: not a global replace, but there should only be one
      }

      // the default case: property = thisprop, which is simply row[property]
      feature.properties[property] = thisprop;
    });

    // all set with this feature, if there were no errors, push it to geojson
    if (!error) fossils['features'].push(feature);

  });

  // keep a reference to this geojson in DATA
  DATA.fossil_data = fossils;
}

// init tippy tooltips. We are using the data-tippy-content form here
function initTooltips() {
  // not much to it...
  tippy('[data-tippy-content]');
}

// init the language locale to use
// a bit out of step to do this here, and not in initState, but we need to set language/locale before other steps
// especially number formatting 
function initLanguage() {
  const params = new URLSearchParams(window.location.search);

  // parse language param
  if (params.has('lang')) {
    let lang = params.get('lang');
    switch (lang) {
      case 'en': 
        CONFIG.language = 'en-US';
        break;
      case 'es':
        // es-MX okay?
        CONFIG.language = 'es-MX';
        break;
      case 'pt': 
        CONFIG.language = 'pt-BR';
        break; 
      default: 
        CONFIG.language = 'en-US';
    }
  } else {
    // the default, if no param provided
    CONFIG.language = 'en-US';
  }
}


function initState() {
  // get params, if there are any
  if (window.location.search) {
    applyURLParams();
  } else {
    // no params
    render();
    setTimeout(function() { CONFIG.map.fitBounds(CONFIG.homebounds) }, 500);
  }
}

// init state from params, or init default values where params are absent
function applyURLParams() {
  const params = new URLSearchParams(window.location.search);
  // parse status params
  if (params.has('status')) {
    // get the checkboxes and clear them all
    let checks = $('div#status-types input').prop('checked', false);
    // gather all the checked statuses from the params
    let statuses = params.get('status').split(',');

    // check those that were specified in the params 
    statuses.forEach(function(value) {
      $(`div#status-types input[value=${value}]`).prop('checked', true);
    });
  } else {
    // default state: check them all
    $('div#status-types').prop('checked', true);
  }

  // parse type param
  if (params.has('type')) {
    // get the checkboxes and clear them all
    let checks = $('div#fossil-types input').prop('checked', false);
    // gather all the checked statuses from the params
    let types = params.get('type').split(',');

    // check those that were specified in the params 
    types.forEach(function(value) {
      $(`div#fossil-types input[value=${value}]`).prop('checked', true);
    });
  } else {
    // default state: check them all
    $('div#fossil-types').prop('checked', true);
  }

  // always trigger change on one layer checkbox. It doesn't matter which one 
  $('div#fossil-types input').first().trigger('change');

  // parse country param
  if (params.has('country')) {
    // parse the country param, to Title Case
    let countryname = params.get('country')
    countryname = countryname.toTitleCase();

    // find the matching feature for the map
    let feature;
    DATA.country_data.features.forEach(function(f) {
      if (f.properties['NAME'] == countryname) {
        feature = f;
        return;
      }
    })

    // find the matching data for the result panel
    var data = [];
    DATA.fossil_data.features.forEach(function(feature) {
      // look for matching names in feature.properties.country
      // note that we use the country lookup to match the map name to the name in the data
      if (feature.properties['country'] == countryname) data.push(feature);
    });

    // highlight it on the map and update the result panel
    CONFIG.selected_country.name = countryname;
    CONFIG.selected_country.layer.addData(feature);
    updateResultsPanel(data, countryname);
  }

  // parse view params
  if (params.has('view')) {
    let view = params.get('view');
    let views = view.split(',');
    CONFIG.map.setView([views[0],views[1]],views[2]);
  } else {
    // default view
    render();
    setTimeout(function() { CONFIG.map.fitBounds(CONFIG.homebounds) }, 500);
  }

  // parse basemapmap param
  if (params.has('basemap')) {
    let basemap = params.get('basemap');
    CONFIG.default_basemap = basemap;
    CONFIG.basemap_control.selectLayer(basemap);
  }

  // parse the search params 
  // do this last, as it makes the most UI changes
  if (params.has('search')) {
    let searchterm = params.get('search');
    $('input#search').val(searchterm);
    searchForText(searchterm);
  }

}

// the inverse of setStateFromParams: update the params on the address bar based on user interactions
function updateStateParams() {
  if (CONFIG.first_load) return;
  // get the current search params
  let params = new URLSearchParams(window.location.search);

  // set the view param
  let zoom   = CONFIG.map.getZoom();
  let center = CONFIG.map.getCenter();
  let view = `${center.lat.toPrecision(8)},${center.lng.toPrecision(8)},${zoom}`;
  params.delete('view');
  params.append('view', view);

  // set a param for language
  params.delete('lang');
  params.append('lang', CONFIG.language.split('-')[0]);

  // set a param for selected country
  // this one we want to explicity clear if it gets "unselected", so always start with delete
  params.delete('country');
  if (CONFIG.selected_country && CONFIG.selected_country.name) {
    params.append('country', CONFIG.selected_country.name);
  }

  // set a param for selected status
  let statuses = $('div#status-types input:checked').map(function(){
    return $(this).val();
  }).get();
  if (statuses.length) {
    params.delete('status');
    params.append('status', statuses);
  }

  // set a param for selected fossil type
  let types = $('div#fossil-types input:checked').map(function(){
    return $(this).val();
  }).get();
  if (types.length) {
    params.delete('type');
    params.append('type', types);
  }

  // set a basemap param
  let basemap = $('div.leaflet-control-basemapbar-option-active').data().layer;
  if (basemap) {
    params.delete('basemap');
    params.append('basemap', basemap);
  }

  // set a search term param
  let searchterm = $('input#search').val(); 
  params.delete('search'); // always delete initially
  if (searchterm) {
    params.append('search', searchterm);
  }

  // all set! if we have anything, parse the string, make it a query and
  // replace state in our local address bar
  let searchstring = decodeURIComponent(params.toString());
  if (searchstring) {
    var newparams = '?' + searchstring;
    window.history.replaceState(newparams, '', newparams);
  }

  // final step: Let the iframe know the new params
  // so we can get this on the address bar of the parent page
  parent.postMessage(newparams, '*');
}


function initButtons() {
  // "home" button to reset/restart the map
  $('div a#home-button').on('click', function(){
    resetTheMap();
  });

  // close button, generically closes it's direct parent
  $('div.close').on('click', function() { $(this).parent().hide(); });

  // init the layer icon control to open the legend
  $('#layers-icon').on('click', function() { $('div.layer-control').show(); });

  // init the menu icon to open the "results" panel
  $('div#results-icon').on('click', function() { $('div#country-results').show(); });

  // the clear search button, clears the search inputs on the map and table
  $('div.searchwrapper a.clear-search').on('click', function() {
    $('input#search').val('').trigger('keyup');
    $(this).hide();
    DATA.filtered = null;
    $('div#zoom-filtered').remove();
    updateStateParams();
  });

  // select all/clear all "buttons" by status and type
  $('div#layer-control-clear span#select-all').on('click', function(e) {
    let type = $(this).data().type;
    $(`div#${type}-types input:not(:checked)`).each(function(c) { $(this).click() });
    return false;
  });
  $('div#layer-control-clear span#clear-all').on('click', function(e) {
    let type = $(this).data().type;
    $(`div#${type}-types input:checked`).each(function(c) { $(this).click() });
    return false;
  });

  // zoom to button on reesults panel, delegated click handler
  $('body').on('click', 'a.zoomto', function() {
    zoomToResults();
  });

  // init the zoom button that shows on the modal details for an individual coal plant
  $('#btn-zoom').click(function(){
    var zoomtarget = this.dataset.zoom.split(',');
    var latlng = L.latLng([zoomtarget[0], zoomtarget[1]]);
    var zoom = 16;

    // switch to satellite view
    CONFIG.basemap_control.selectLayer('photo');

    // get the target tracker that opened this info panel
    CONFIG.backbutton.setTargetTracker($(this).data().tracker);

    // set the previous bounds that we should go to when we click the back button
    CONFIG.backbutton.setPreviousBounds(CONFIG.map.getBounds());


    // add the back button, which takes the user back to previous view (see function goBack()
    // but only if there is not already a back button on the map
    if ($('.btn-back').length == 0) CONFIG.backbutton.addTo(CONFIG.map);

    // move and zoom the map to the selected unit
    CONFIG.map.setView(latlng, zoom);
  });

  // callback on showing the tracker info panel: make the columns the same height
  $(document).on('#tracker-modal', 'shown.bs.modal', function () {
    setTimeout(function() {
      let cols = $('#tracker-modal').find('.modal-cols');

      var maxheight = -1; 
      cols.each(function() {
        let col = $(this);
        maxheight = maxheight > col.height() ? maxheight : col.height();
      })

      cols.each(function() { $(this).height(maxheight); })
    }, 500);
 })

}

// initialize the nav tabs: what gets shown, what gets hidden, what needs resizing, when these are displayed
// important: to add a functional tab, you must also include markup for it in css, see e.g. input#help-tab:checked ~ div#help-content {}
function initTabs() {
  $('input.tab').on('click', function(e) {
    // get the type from the id
    var type = e.currentTarget.id.split("-")[0];
    switch (type) {
      case 'map':
        $('input#search').show();
        // resize the map
        CONFIG.map.invalidateSize(false);
        break;
      case 'table':
        $('input#search').show();
        // resize the table, if it exists
        if (CONFIG.table) {
          resize();
        }
        break;
      default:
        // hide search forms
        $('input#search').hide();
        break;
    }
  });

  // update (c) year
  let year = new Date().getFullYear();
  $('span#year').text(year);
}

function initSearch() {
  // We use js-search as the search "engine"
  CONFIG.searchengine = new JsSearch.Search('id');
  // add fields to be indexed
  Object.keys(CONFIG.attributes).forEach(function(key){
    CONFIG.searchengine.addIndex(['properties_search', key]);
  });
  // add data documents to be searched
  // we will transform a second set of properties, without diacritics, to be the documents that are searched
  // whereas we will display the original properties when results are found
  // When paired with a similar (but opposite) switch in searchForText() this allows us do diacritic-insensitive searching
  var documents = [];
  let feats = {};
  DATA.fossil_data.features.forEach(function(feature) {
    let props_for_search = {};
    Object.keys(feature.properties).forEach(function(key) {
      // copy props, and remove all accented characters with normalize('NFD') and replace
      props_for_search[key] = feature.properties[key].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    });
    feature['properties_search'] = props_for_search;
    documents.push(feature);
  });
  // add the rendered docs to the search engine
  CONFIG.searchengine.addDocuments(documents);

  // define a search submit function, debounced for performance
  var submitSearch = debounce(function(event) {
    // prevent default browser behaviour, especially on 'enter' which would refresh the page
    event.preventDefault();
    if (event.key === 'Enter' || event.keyCode === 13) return;

    // if the input is cleared, redo the 'everything' search (e.g. show all results)
    // this is distinct from the case of "No results", in searchMapForText
    if (! this.value) {
      return render();
    } else {
      // submit the form
      searchForText(this.value);
    }
  }, 250);

  // Init form inputs to submit a search on keyup
  $('input#search').on('keyup', submitSearch);
}

// Translation happens in several places: most of it here, but some of the data is translated in place in initDataFormat()
// see also drawTable which utilizes DT own language sheets for DT specific UI bits
function initTranslation() {
  // translate all terms with a data-lang tag, using the provided language lookup
  let language = CONFIG.language.split('-')[0]; // 'en', 'es', or 'pt'
  let field = `text_${language}`; // to match the correct language field name in the language.csv, e.g. "text_en"

  // these are straightforward HTML innerText replacements
  let texts = DATA.translation.filter(function(d) { return d.type == 'text'});
  texts.forEach(function(t)  {
    let element = $(`[data-lang=${t.selector}]`);
    element.text(t[field]);
  })

  // special handling required: results text
  let results = DATA.translation.filter(function(d) { return d.type == 'results'});
  results.forEach(function(t) {
    // update the CONFIG
    CONFIG[t.selector] = t[field];
    // update the already in-place but dynamic markup
    let element = $(`[data-lang=${t.selector}]`);
    element.text(t[field]);
  })

  // special handling required: fossil type
  let types = DATA.translation.filter(function(d) { return d.type == 'type'});
  types.forEach(function(t) {
    // update the CONFIG
    CONFIG.fossil_types[t.selector].text = t[field];  
    // update the already in-place but dynamic markup 
    let element = $(`[data-lang=${t.selector}]`);
    element.text(t[field]);
  });

  // special handling required: status type
  let statuses = DATA.translation.filter(function(d) { return d.type == 'status'});
  statuses.forEach(function(t) {
    // update the CONFIG
    CONFIG.status_types[t.selector].text = t[field];  
    // update the already in-place but dynamic markup 
    let element = $(`[data-lang="${t.selector}"]`);
    element.text(t[field]);
  });

  // special handling required: status type tabular - a bit of repetition here, but so be it
  let statuses_tabular = DATA.translation.filter(function(d) { return d.type == 'status_tabular'});
  statuses_tabular.forEach(function(t) {
    // update the CONFIG
    CONFIG.status_types_tabular[t.selector].text = t[field];  
    // update the already in-place but dynamic markup 
    let element = $(`[data-lang="${t.selector}]"`);
    element.text(t[field]);
  });

  // special handling required CONFIG.popup_message
  let popups = DATA.translation.filter(function(d) { return d.type == 'popup-msg'});
  popups.forEach(function(t) {
    // update the CONFIG
    CONFIG[t.selector] = t[field];  
  }); 

  // special handling required CONFIG.zoom_to_message
  let zoom = DATA.translation.filter(function(d) { return d.type == 'zoom-to'});
  zoom.forEach(function(t) {
    // update the CONFIG
    CONFIG[t.selector] = t[field];
  })

  // special handling required for CONFIG.attributes
  let attributes = DATA.translation.filter(function(d) { return d.type == 'attribute'});
  attributes.forEach(function(t) {
    CONFIG.attributes[t.selector].name = t[field];
  });

  // special handling required for placeholder text
  let placeholders = DATA.translation.filter(function(d) { return d.type == 'placeholder'});
  placeholders.forEach(function(t) {
    $('[data-lang="search-placeholder"]').attr('placeholder', t[field]);
  });

  // special handling required for the back button
  let goback = DATA.translation.filter(function(d) { return d.type == 'back'})[0];
  CONFIG.go_back = goback[field];

  // special handling required: GEM link
  let link = CONFIG.language == 'en-US' ? 'https://globalenergymonitor.org/' : 'https://globalenergymonitor.org/es/';
  $('a#gem-link').attr('href', link);

  // about text: a simple switch between divs to show the one with the current language
  $(`div#about-content div[data-about="${CONFIG.language}"]`).show();

  // tooltips, defined in CONFIG.attributes
  let tooltips = DATA.translation.filter(function(d) { return d.type == 'tooltip'});
  tooltips.forEach(function(t) {
    CONFIG.attributes[t.selector].tooltip = t[field]; 
  });
}

// initialize the map in the main navigation map tab
function initMap() {

  // basic leaflet map setup
  CONFIG.map = L.map('map', {
    attributionControl: false,
    zoomControl: false,
    minZoom: CONFIG.minzoom, maxZoom: CONFIG.maxzoom,
  });

  // get bounds from the full dataset, and keep a reference to it
  CONFIG.homebounds = L.geoJSON(DATA.fossil_data).getBounds(); 

  // map panes
  // - create a pane for the carto streets basemap
  CONFIG.map.createPane('basemap-map'); 
  CONFIG.map.getPane('basemap-map').style.zIndex = 200;

  // - create a pane for the esri satellite tiles
  CONFIG.map.createPane('basemap-photo');  
  CONFIG.map.getPane('basemap-photo').style.zIndex = 225;

  // - create a feature highlight pane for pipelines
  CONFIG.map.createPane('feature-highlight');
  CONFIG.map.getPane('feature-highlight').style.zIndex = 400;

  // - create a feature pane for pipelines
  // the default marker-pane z-index, which PruneCluster writes to, is 600
  // so this puts pipelines below markers
  CONFIG.map.createPane('feature-pipelines');
  CONFIG.map.getPane('feature-pipelines').style.zIndex = 500;
  
  // - create a pane for basemap tile labels
  CONFIG.map.createPane('basemap-labels');
  CONFIG.map.getPane('basemap-labels').style.zIndex = 575;
  CONFIG.map.getPane('basemap-labels').style.pointerEvents = 'none';


  // - create map panes for county interactions, which will sit between the basemap and labels
  CONFIG.map.createPane('country-hover');
  CONFIG.map.getPane('country-hover').style.zIndex = 350;
  CONFIG.map.createPane('country-select');
  CONFIG.map.getPane('country-select').style.zIndex = 450;

  // define the basemaps
  CONFIG.basemaps = [
    {
      type: 'google-mutant',
      label: 'photo',
      pane: 'basemap-photo',
      url: 'satellite',
      tooltip: 'Google Satellite'
    },
    {
      type:'xyz',
      label: 'map',
      pane: 'basemap-map',
      maxZoom: CONFIG.maxzoom,
      minZoom: CONFIG.minzoom,
      url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'),
      attribution: 'Map tiles by <a target="_blank" href="http://www.mapbox.com">MapBox</a>. Tile data &copy; <a target="_blank" href="http://openstreetmap.org/copyright" target="_blank">OpenStreetMap contributers</a>',
      tooltip: 'Plain grey map with Open Street Map data'
    },
  ];

  // add attribution
  var credits = L.control.attribution({ 
    prefix: 'Interactive mapping by <a href="http://greeninfo.org" target="_blank">GreenInfo Network</a>. Data: <a href="https://globalenergymonitor.org/" target="_blank">Global Energy Monitor</a>',
    position: 'bottomleft' 
  }).addTo(CONFIG.map);

  // construct the basemapbar, it will be added later
  CONFIG.basemap_control = new L.Control.BasemapBar({
    layers: CONFIG.basemaps,
    position: 'topright',
    credits: credits,
  });

  // specify which basemap will be on by default, and when the map is reset by the 'Home' button
  CONFIG.default_basemap = 'map';
  // and then use it
  CONFIG.basemap_control.selectLayer(CONFIG.default_basemap);

  // construct the custom zoom home control, it will be added later
  CONFIG.zoombar = new L.Control.ZoomBar({
    position: 'topright',
    // homeLatLng: [CONFIG.startlat, CONFIG.startlng],
    homeBounds: CONFIG.homebounds,
    homeZoom: CONFIG.startzoom,
  });

  // Add a layer to hold countries, for click and hover (not mobile) events on country features
  CONFIG.countries = L.featureGroup([], { pane: 'country-hover' }).addTo(CONFIG.map);
  var countries = L.geoJSON(DATA.country_data,{ 
    style: CONFIG.country_no_style, 
    onEachFeature: massageCountryFeaturesAsTheyLoad 
  }).addTo(CONFIG.countries);

  // add a layer to hold any selected country
  CONFIG.selected_country = {};
  CONFIG.selected_country.layer = L.geoJson([], {
    style: CONFIG.country_selected_style, pane: 'country-select'
  }).addTo(CONFIG.map);

  // mobile: hide legend
  var layercontrol = $('.layer-control');
  if (isMobile()) layercontrol.hide();

  // once the map is done loading, resize and hide the loading spinner
  CONFIG.map.on('load', function() {
    CONFIG.map.invalidateSize();
    CONFIG.map_loaded = true;
  });

  // create an instance of L.backButton()
  // not added now, see initButtons()
  CONFIG.backbutton = new L.backButton({
    basemapControl: CONFIG.basemap_control,
    config: CONFIG,
  });

  // listen for changes to the map, and update state params
  CONFIG.map.on('move zoom', function() {
    updateStateParams();
  });

  // country hover is annoying at high zoom
  CONFIG.map.on('zoomend', function() {
    if (CONFIG.map.getZoom() > 10) {
      CONFIG.countries.removeFrom(CONFIG.map);
    } else {
      CONFIG.countries.addTo(CONFIG.map);
    }
  });

  // double click zoom is confusing if it selects a country; try and track and prevent that
  // see also massageCountryFeaturesAsTheyLoad()
  // we don't bother with this on other features: it seems unlikely a doubleClick to zoom will be right on top of a marker
  CONFIG._dblClickTimer = null;
  CONFIG.map.on("dblclick", function() {
    clearTimeout(CONFIG._dblClickTimer);
    CONFIG._dblClickTimer = null;
  });

}

function initMapLayers() {
  // add the labels to the top of the stack
  let labels = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}@2x.png', { pane: 'basemap-labels' });
  CONFIG.map.addLayer(labels);

  // Add a layer to hold features for point clusters
  CONFIG.cluster_layer = L.featureGroup([], {}).addTo(CONFIG.map); // on by default
 
  // add a layer to hold features for pipelines
  CONFIG.pipelines_layer = L.featureGroup([], {}).addTo(CONFIG.map); // on by default

  // Add a layer to hold feature highlights, for click and hover (not mobile) events on fossil features
  CONFIG.feature_hover = L.featureGroup([], {}).addTo(CONFIG.map);
  CONFIG.feature_select = L.featureGroup([], {}).addTo(CONFIG.map);

  // add the basemap control, and the zoom control
  CONFIG.basemap_control.addTo(CONFIG.map).selectLayer('map');
  CONFIG.zoombar.addTo(CONFIG.map);

  // create a mutation observer, so we can respond to changes to the map and basemap buttons
  const attrObserver = new MutationObserver((mutations) => {
    mutations.forEach(mu => {
      if (mu.type !== "attributes" && mu.attributeName !== "class") return;
      let layer = mu.target.dataset.layer;
      switch (layer) {
        case 'map':
        case 'photo':
          updateStateParams();
          break;
      }
    });
  });

  // register the observers on the specified elements
  const basemap_observers = document.querySelectorAll(".leaflet-control-basemapbar-option");
  basemap_observers.forEach(el => attrObserver.observe(el, {attributes: true}));

  // mobile feature styles: larger lines, bigger circles, for easier clicks
  if ( isMobile() ) {
    styles.circlesize = styles.circlesize_mobile;
  }
}

// Create and init the legend and layer control
// there are several classes of controls, that work independently, 
// you can toggle features on the map by type OR by status OR ...
function initMapControls() {
  // grab keys for fossil and status types. Each of these will be one legend 'section', and the keys within will form one entry per type
  let types = Object.keys(CONFIG.fossil_types);
  let statuses  = Object.keys(CONFIG.status_types);

  // iterate STATUS, and create the legend entries for each
  statuses.forEach(function(status){
    let target = $('div.layer-control div#status-types div.leaflet-control-layers-overlays');
    // add a wrapper for the legend items
    let inner = $('<div>', {'class': 'legend-labels'}).appendTo(target);
    // then add a label and checkbox
    let label = $('<label>').appendTo(inner);
    let input = $('<input>', {
      type: 'checkbox',
      value: status,
      checked: true,
    }).appendTo(label);
    // add colored circle and text to label    
    let outerSpan = $('<span>').appendTo(label);
    let div = $('<div>', {
      'class': `circle ${CONFIG.status_types[status].cssclass}`,
    }).appendTo(outerSpan);
    // adds text to legend
    let innerSpan = $('<span>', {
      text: ' ' + CONFIG.status_types[status].text,
      'class': 'legend-label',
      'data-lang': status,
    }).appendTo(outerSpan);
  });

  // iterate FOSSIL TYPES, and create the legend entries for each
  types.sort(function(a,b) {return CONFIG.fossil_types[a]["order"] - CONFIG.fossil_types[b]["order"]});
  types.forEach(function(type) {
    let target = $('div.layer-control div#fossil-types div.leaflet-control-layers-overlays');
    // add a wrapper for the legend items
    let inner = $('<div>', {'class': 'legend-labels'}).appendTo(target);
    // then add a label and checkbox
    let label = $('<label>').appendTo(inner);
    let input = $('<input>', {
      type: 'checkbox',
      value: type,
      checked: true,
    }).appendTo(label);
    // now add shape to legend
    let outerSpan = $('<span>').appendTo(label);
    let div = $('<div>', {
      'class': `empty ${CONFIG.fossil_types[type].shape}`,
    }).appendTo(outerSpan);
    let innerSpan = $('<span>', {
      text: CONFIG.fossil_types[type].text,
      'class': 'legend-label',
      'data-lang': type,
    }).appendTo(outerSpan);
  });

  // Set up change triggers on the status and type checkboxes. 
  // In short, filter the data and send it off to various handlers for drawing the map, table, etc.
  $('div.layer-control div.leaflet-control-layers-overlays').on('change', 'input', function(e) {
    var status = e.currentTarget.dataset.layer;
    var checkbox = $(this);

    // get selected statuses
    var statuses = $('div#status-types input:checkbox:checked').map(function() {
      return this.value;
    }).get();

    // get selected types
    var types = $('div#fossil-types input:checkbox:checked').map(function() {
      return this.value;
    }).get();

    // filter all data for the current set of checkboxes. This means we also need to clear any search term
    let data_to_filter = DATA.fossil_data.features;
    var filtered = data_to_filter.filter(function(d) {
      return statuses.indexOf(d.properties.status) > -1 && types.indexOf(d.properties.type) > -1;
    });

    $('input#search').val(''); // clear out search. This is either "search a term" or "search using filters", not both
    $('div.searchwrapper a.clear-search').hide();
    let message = getResultsMessage();
    updateResultsPanel(filtered, message);
    drawMap(filtered); 
    drawTable(filtered, message);
    updateStateParams();
  });
}

// initialize the PruneClusters, and override some factory methods
function initPruneCluster() {
  // create a new PruceCluster object, with a minimal cluster size of (X)
  // updated arg to 30; seems to really help countries like China/India
  CONFIG.clusters = new PruneClusterForLeaflet(30);
  CONFIG.cluster_layer.addLayer(CONFIG.clusters);

  // this is from the categories example; sets ups cluster stats used to derive category colors in the clusters
  CONFIG.clusters.BuildLeafletClusterIcon = function(cluster) {
    var e = new L.Icon.MarkerCluster();    
    e.stats = cluster.stats;
    e.population = cluster.population;
    return e;
  };

  var pi2 = Math.PI * 2;

  L.Icon.MarkerCluster = L.Icon.extend({
    options: {
      iconSize: new L.Point(22, 22),
      className: 'prunecluster leaflet-markercluster-icon'
    },

    createIcon: function () {
      // based on L.Icon.Canvas from shramov/leaflet-plugins (BSD licence)
      var e = document.createElement('canvas');
      this._setIconStyles(e, 'icon');
      var s = this.options.iconSize;
      e.width = s.x;
      e.height = s.y;
      this.draw(e.getContext('2d'), s.x, s.y);
      return e;
    },

    createShadow: function () {
      return null;
    },

    draw: function(canvas, width, height) {
      // the pie chart itself
      var start = 0;
      for (var i = 0, l = CONFIG.markercluster_colors.length; i < l; ++i) {
        // the size of this slice of the pie
        var size = this.stats[i] / this.population;
        if (size > 0) {
          canvas.beginPath();
          canvas.moveTo(11, 11);
          canvas.fillStyle = CONFIG.markercluster_colors[i];
          // start from a smidgen away, to create a tiny gap, unless this is a single slice pie
          // in which case we don't want a gap
          var gap = size == 1 ? 0 : 0.15
          var from = start + gap;
          var to = start + size * pi2;

          if (to < from) {
            from = start;
          }
          canvas.arc(11,11,11, from, to);
          start = start + size*pi2;
          canvas.lineTo(11,11);
          canvas.fill();
          canvas.closePath();
        }
      }

      // the white circle on top of the pie chart, to make the middle of the "donut"
      canvas.beginPath();
      canvas.fillStyle = 'white';
      canvas.arc(11, 11, 7, 0, Math.PI*2);
      canvas.fill();
      canvas.closePath();

      // the text label count
      canvas.fillStyle = '#555';
      canvas.textAlign = 'center';
      canvas.textBaseline = 'middle';
      canvas.font = 'bold 9px sans-serif';

      canvas.fillText(this.population, 11, 11, 15);
    }
  });

  // we override this method: don't force zoom to a cluster on click (the default)
  CONFIG.clusters.BuildLeafletCluster = function (cluster, position) {
    var _this = this;
    var m = new L.Marker(position, {
      icon: this.BuildLeafletClusterIcon(cluster)
    });
    // this defines what happen when you click a cluster, not the underlying icons
    m.on('click', function () {
      var markersArea = _this.Cluster.FindMarkersInArea(cluster.bounds);
      var b = _this.Cluster.ComputeBounds(markersArea);
      if (b) {
        // skip the force zoom that is here by default, instead, spiderfy the overlapping icons
        _this._map.fire('overlappingmarkers', { cluster: _this, markers: markersArea, center: m.getLatLng(), marker: m });
      }
    });
    return m;
  }

  // we override this method to handle clicks on individual plant markers (not the clusters)
  CONFIG.clusters.PrepareLeafletMarker = function(leafletMarker, data){
    var shape = data.shape;
    var message = CONFIG[`popup_message_${shape}`];
    var html = `<div style='text-align:center;'><strong>${data.title}</strong><br><div class='popup-click-msg'>${message}</div></div>`;
    leafletMarker.bindPopup(html);
    leafletMarker.setIcon(data.icon);
    leafletMarker.attributes = data.attributes;
    leafletMarker.coordinates = data.coordinates;
    leafletMarker.on('click',function () {
      openTrackerInfoPanel(this);
    });
    leafletMarker.on('mouseover', function() {
      this.openPopup();
    });
    leafletMarker.on('mouseout', function() { CONFIG.map.closePopup(); });
  }

  // A convenience method for marking a given feature as "filtered" (e.g. not shown on the map and removed from a cluster)
  CONFIG.clusters.FilterMarkers = function (markers, filter) {
    for (var i = 0, l = markers.length; i < l; ++i) {
      // false to add, true to remove
      markers[i].filtered = filter;
    }
  };
}

// itialization functions for the table. Table data is populated only after a search is performed
function initTable() {
  // not much here, see also drawTable()

  // custom sort function, can be applied field by field in columnDefs
  jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    'numeric-compare-asc': function ( a, b ) {
      // always sort n/a to the end
      if (a == 'n/a' && b != 'n/a') return 1;
      if (b == 'n/a' && a != 'n/a') return -1;
      if (CONFIG.language == 'en-US') {
        a = parseFloat(a.replace(/,/g,'') * 1000000);
        b = parseFloat(b.replace(/,/g,'') * 1000000);
      } else {
        // for non 'en-US' languages, the formatted strings use a space for thousands separator (see CONFIG.format)
        a = parseFloat(a.replace(/\s/g,'').replace(/,/g,'.') * 1000000);
        b = parseFloat(b.replace(/\s/g,'').replace(/,/g,'.') * 1000000);
      } 

      return ((a < b) ? -1 : ((a > b) ? 1 : 0));
      

    },
    'numeric-compare-desc': function ( a, b ) {
      // always sort n/a to the end
      if (a == 'n/a' && b != 'n/a') return 1;
      if (b == 'n/a' && a != 'n/a') return -1;
      if (CONFIG.language == 'en-US') {
        a = parseFloat(a.replace(/,/g,'') * 1000000);
        b = parseFloat(b.replace(/,/g,'') * 1000000);
      } else {
        // for non 'en-US' languages, the formatted strings use a space for thousands separator (see CONFIG.format)
        a = parseFloat(a.replace(/\s/g,'').replace(/,/g,'.') * 1000000);
        b = parseFloat(b.replace(/\s/g,'').replace(/,/g,'.') * 1000000);
      } 

      return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
  })

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// NAMED FUNCTIONS 
///////////////////////////////////////////////////////////////////////////////////////////////////////////

// restart action, to reset the map
function resetTheMap() {
  // clear anything in the search inputs
  $('input#search').val('');

  // reset map & table display with the default search
  render({name: '', map: true, results: true, table: true });

  // clear any existing country and feature selection
  CONFIG.feature_hover.clearLayers();
  CONFIG.feature_select.clearLayers();
  CONFIG.selected_country.layer.clearLayers();
  CONFIG.selected_country.name = '';
  DATA.filtered = null;
  $('div#zoom-filtered').remove();

  // switch back to the map tab
  $('input#map-tab').click();

  // resize everything
  resize(); 

  // reset the default view extent and basemap
  CONFIG.map.fitBounds(CONFIG.homebounds);
  CONFIG.basemap_control.selectLayer(CONFIG.default_basemap);

  // reset the map type
  // TO DO: What are these? 
  $('div#map-type-controls input[value="clusters"]').click();

  // check all checkboxes 
  $('div.leaflet-control-layers-overlays input').prop('checked','checked'); // select everything in the legend
}

// a controller for rendering 'everything', with the following options
function render(options) {

  // get or set the following options
  if (options === undefined) options = {};
  if (options.name === undefined) options.name = '';
  if (options.map === undefined) options.map = true;
  if (options.results === undefined) options.results = true;
  if (options.table === undefined) options.table = true;

  // optionally draw the map (and legend) table, results
  $('div.searchwrapper a.clear-search').hide();
  if (options.map) drawMap(DATA.fossil_data.features);
  if (options.results) updateResultsPanel(DATA.fossil_data.features);
  if (options.table) drawTable(DATA.fossil_data.features, options.name);
}

// the main map update rendering function
function drawMap(data) {
  // clear the map (points will get cleared in updateClusters)
  CONFIG.pipelines_layer.clearLayers();

  // create a container for the points to pass to updateClusters()
  var points_to_cluster = [];

  var layers = L.geoJSON(data, {
    pane: 'feature-pipelines',
    onEachFeature: function (feature, layer) {
      // Bind tooltips and popups, and set the color for this status
      // but only for pipelines - PruneCluster handles points
      if (layer.feature.geometry.type == "Point") return;

      // bind a popup that matches the point popups
      var html = `<div style='text-align:center;'><strong>${feature.properties.project}</strong><br><div class='popup-click-msg2'>${CONFIG.popup_message_line}</div></div>`;
      layer.bindPopup(html, {autoPan: false});

      // clear click highlights on popup close
      layer.on('popupclose', function() {
        CONFIG.feature_select.clearLayers();
      });

      // define click functionality
      layer.on('click',function (e) {
        // clear any existing feature highlights
        CONFIG.feature_select.clearLayers();
        // bypass point features, and only highlight lines
        if ( e.target.feature.geometry.type == 'LineString' || e.target.feature.geometry.type == 'MultiLineString' ) {
          var highlight = L.polyline(e.target.getLatLngs(), { pane: 'feature-highlight' });
          highlight.setStyle(CONFIG.feature_select_style);
          highlight.addTo(CONFIG.feature_select);
        } 
        // finally, open the info panel
        openTrackerInfoPanel(this);
      });

      layer.on('mouseover', function(e) {
        this.openPopup();
        // show hovered line features with a hover style
        // but only on Desktop
        if (! (isTouch() && ( isMobile() || isIpad() ))) {
          // for now bypass point features, and only highlight lines
          if ( e.target.feature.geometry.type == 'LineString' || e.target.feature.geometry.type == 'MultiLineString' ) {
            var hover = L.polyline(e.target.getLatLngs(), { pane: 'feature-highlight' });
            hover.setStyle(CONFIG.feature_hover_style);
            hover.addTo(CONFIG.feature_hover);
          }
        }
      });
      layer.on('mouseout', function() { 
        CONFIG.feature_hover.clearLayers();
      });

      let status = feature.properties.status;
      let cssclass = `status${CONFIG.status_types[status]['order']}`;
      // fossil-feature class allows us to distinguish between fossil features and countries on hover
      layer.setStyle({ 
        color: styles[cssclass], 
        weight: styles.linewidth, 
        opacity: styles.lineopacity, 
        'className': 'fossil-feature',
      });

    },
    filter: function(feature) {        
      // tricky part: return true for Lines, false for Points
      // also grab a copy of points to send to PruneCluster
      if (feature.geometry.type == "Point") {
        points_to_cluster.push(feature);
        return false;
      } else {
        return true;
      }
    }
  })

  layers.addTo(CONFIG.pipelines_layer);

  // final step: update the clusters with the points we just collected
  updateClusters(points_to_cluster);
}

// given filtered data, update and render the clusters
function updateClusters(data, fitbounds=false) {
  // start by clearing out existing clusters
  CONFIG.clusters.RemoveMarkers();
  // iterate over the data and set up the clusters
  data.forEach(function(feature) {
    // the "status" of the tracker point affects its icon color
    var status = feature.properties.status;
    var type = feature.properties.type;
    var statusId = CONFIG.status_types[status]['order'];
    var statusClass = `status${statusId}`;
    var shape = CONFIG.fossil_types[type]['shape'];
    var symbolClass = `${shape}-div`;

    var lng = feature.geometry.coordinates[0];
    var lat = feature.geometry.coordinates[1];

    var cssClass = CONFIG.status_types[status]['cssclass'];
    var marker = new PruneCluster.Marker(parseFloat(lat), parseFloat(lng), {
      title: feature.properties.project,
      icon: L.divIcon({
          className: symbolClass + ' ' + statusClass, // Specify a class name we can refer to in CSS.
          iconSize: [15, 15] // Set the marker width and height
        })
    });

    // keep track of the marker "shape", so we know what title to apply (click the circle, click the triangle, etc.)
    marker.data.shape = shape;

    // get the attributes for use in the custom popup dialog (see openTrackerInfoPanel())
    marker.data.attributes = feature.properties;

    // get the lat-lng now so we can zoom to the plant's location later
    // getting the lat-lng of the spider won't work, since it gets spidered out to some other place
    // tip: the raw dataset is lng,lat and Leaflet is lat,lng
    marker.data.coordinates = [ lat, lng ];

    // set the category for PruneCluster-ing. Note this is 0 indexed
    let order = CONFIG.status_types[status]['order'];
    marker.category = parseInt(order - 1);

    // register the marker for PruneCluster clustering
    CONFIG.clusters.RegisterMarker(marker);
  });

  // all set! process the view
  CONFIG.clusters.ProcessView();
}

// update the "results" panel that sits above the map, top left
// this always shows either the Global tally of things, or a country-specific count, or a count from a search term enterd in the "Free Search" input
function updateResultsPanel(data, country=CONFIG.results_title) {
  // first off, clean up 
  $('div#zoom-filtered').remove();
  $('div#country-results div#total-count span#results_name').text('');
  $('div#country-results div#total-count span#total-number').text('');

  // update primary content
  $('div#country-results div#results_title h3').text(country);
  // update the total count
  let numbertext = data.length ? CONFIG.format['number'](data.length) : '';
  $('div#country-results div#total-count span#total-number').text(numbertext);
  let totaltext = data.length > 0 ? CONFIG.results_name : CONFIG.results_notfound;
  $('div#country-results div#total-count span#results_name').text(totaltext);

  // add the "zoom to" button
  if (DATA.filtered && data.length) {
    $(`<div id="zoom-filtered"><a class="zoomto">${CONFIG.zoom_to_message}</a></div>`).appendTo($('div#total-count'));
  }

  // tally results per type of fossil project, and add a row for each if there is more than one
  var results = $('div#type-count').empty();
  // for each fossil type, get the count of that type from the data
  Object.keys(CONFIG.fossil_types).forEach(function(type) {
    var count = 0;
    data.forEach(function(d) {
      // count matching processes, but only if the accompanying checkbox is checked
      // and its process is selected
      if (d.properties.type == type) count += 1;
    });
    // format label for type(s) and add to results
    // show a count for all types, whether 0 or >0
    var label = CONFIG.fossil_types[type].text;
    var html = `<span data-lang=${type}>${label}</span><span class='type-counts'>${count}</span>`;
    let div = $('<div>', {html: html, 'data-type': type}).appendTo(results);
    if (count == 0) div.addClass('zerocount');
  });
}

// invoked by clicking "zoom to results" on zoom panel
function zoomToResults() {
  // not much to it: 
  if (DATA.filtered.length) {
    let bounds = L.geoJSON(DATA.filtered).getBounds();
    CONFIG.map.fitBounds(bounds);
  }
}

// draw or update the table on the "Table" tab
function drawTable(trackers, title) {
  // set up table names. These are the formatted column names for the table
  var names = Object.keys(CONFIG.attributes);
  names = names.filter(function(name) {
    return CONFIG.attributes[name].table === true;
  });

  // put table column names into format we need for DataTables
  var colnames = names.map(function(d) { return { 'title': CONFIG.attributes[d].name, 'className': CONFIG.attributes[d].classname } });

  // set up the table data
  var data = [];
  trackers.forEach(function(tracker) {
    if (! tracker.properties.project) return; // no project name = bad data, bail
    // get the properties for each feature
    var properties = tracker.properties;
    // make up a row entry for the table: a list of column values.
    // and copy over all columns from [names] as is to this row
    var row = [];
    names.forEach(function(name) {
      // if it has a value, lookup the value on properties, and format it 
      let value = properties[name];
      if (value === undefined || value == '' ) {
        value = 'n/a';
      } else {
        value = CONFIG.format[CONFIG.attributes[name].format](value);
        // custom handlers for certain types: get the formatted string, format as a link, etc.
        if (name == 'type')            value = CONFIG.fossil_types[value].text;
        if (name == 'status_tabular')  value = CONFIG.status_types_tabular[value].text;
        if (name == 'project') {
          if (properties['url']) {
            value = '<a href="' + properties['url'] + '" target="_blank" title="click to open the Wiki page for this project">' + properties.project + '</a>';
          } else {
            value = properties.project;
          }
        }
      }
      // all set, push this to the row
      row.push(value);
    });

    // and all set with the row, push the row to the data array
    data.push(row);
  });
  // from CONFIG.language, determine which language pack to use
  // we could used the CDN urls provided by DT, but this gives us additional options to tweak things oursleves
  let language_url; 
  switch (CONFIG.language) {
    case 'en-US':
      language_url = './static/libs/dt-en.json';
      break; 
    case 'es-MX':
      language_url = './static/libs/dt-es.json';
      break; 
    case 'pt-BR':
      language_url = './static/libs/dt-pt.json';
      break; 
  }

  // purge and reinitialize the DataTable instance
  // first time initialization
  if (!CONFIG.table) {
    CONFIG.table = $('#table-content table').DataTable({
      data: data,
      columnDefs : [
        // use localeCompare to sort Capacity column
        { targets: 7, type: 'numeric-compare' },
      ],
      columns: colnames,
      language: {
        url: language_url,
      },
      autoWidth: true,
      scrollResize: true,
      scrollY: 500, // initial value only, scrollResize should do the rest
      scrollX: false,
      lengthMenu: [50, 100, 500],
      iDisplayLength : 500, // 100 has a noticable lag to it when displaying and filtering; 10 is fastest
      dom: 'litp',
      initComplete: function() {
        // add tooltips indicated by key of 'tooltip' in CONFIG.attributes
        let attrs = Object.keys(CONFIG.attributes);
        attrs.forEach(function(a) {
          if (! CONFIG.attributes[a].hasOwnProperty('tooltip')) return;
          let classname = CONFIG.attributes[a].classname;
          let tooltip_content = CONFIG.attributes[a]['tooltip'];
          let th = $(`#table-content table th.${classname}`);
          $('<span>', {
            'class': 'info',
            'data-tippy-content': tooltip_content,
          }).appendTo(th);
        }); // forEach attr

        // last step: adjust the table columns
        // could also do: if ! CONFIG.first_load
        waitForIt(CONFIG.table, resize);
      }
    });

  // every subsequent redraw with new data: we don't need to reinitialize, just clear and update rows
  } else {
    CONFIG.table.clear();
    CONFIG.table.rows.add(data);
    CONFIG.table.search('').draw();
  }

  // finally, update the table name, if provided
  var text = title ? title : CONFIG.results_title;
  $('div#table h3 span').text(text);

}

function searchForText(keywords) {
  // In short: find data matching the keyword
  // note: we perform the actual search without accents (diacritics), 
  // whereas everything is displayed (including results) with accents
  let keywords_normalized = keywords.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  DATA.filtered = CONFIG.searchengine.search(keywords_normalized);
  
  // add to the results to map, table, legend
  drawMap(DATA.filtered);                           // update the map (and legend)
  updateResultsPanel(DATA.filtered, keywords)       // update the results-panel
  drawTable(DATA.filtered, keywords);               // populate the table
  CONFIG.selected_country.layer.clearLayers();      // clear any selected country
  CONFIG.selected_country.name = '';                // ... and reset the name
  $('form#nav-table-search input').val(keywords);   // sync the table search input with the keywords
  $('div#country-results').show();                  // show the results panel, in case hidden
  $('a.clear-search').show();                       // show the clear search links
  $('div.leaflet-control-layers-overlays input').prop('checked','checked'); // select everything in the legend
  updateStateParams();                              // update state params
  return false;
}

// this callback is used when CONFIG.countries is loaded via GeoJSON; see initMap() for details
function massageCountryFeaturesAsTheyLoad(rawdata,feature) {
  // translate country names in countries features
  if (CONFIG.language != 'en-US') {
    let country = feature.feature.properties['NAME'];
    let country_translated = DATA.country_translations[country][CONFIG.language];
    feature.feature.properties['NAME'] = country_translated;
  }

  // only register hover events for non-touch, non-mobile devices
  // including isMobile() || isIpad() here to include iPad and exclude "other" touch devices here, e.g. my laptop, which is touch, but not mobile
  if (! (isTouch() && ( isMobile() || isIpad() ))) {

    // on mouseover, highlight me; on mouseout quit highlighting
    feature.on('mouseover', function (e) {
      // keep a reference to the hovered featured feature
      // and unhighlight other countries that may already be highlighted
      var name = this.feature.properties['NAME'];
      if (name != CONFIG.hovered) CONFIG.countries.setStyle(CONFIG.country_no_style);
      CONFIG.hovered = name;
      // then highlight this country
      this.setStyle(CONFIG.country_hover_style);
    }).on('mouseout', function (e) {
      // on mouseout, remove the highlight, unless
      // we are entering one of our map features, i.e. a pipeline, or terminal
      // note: this isn't enough to trap everything, see mouseover() above
      if ( e.originalEvent.toElement && e.originalEvent.toElement.classList.contains('fossil-feature') ) return;
      CONFIG.hovered = '';
      this.setStyle(CONFIG.country_no_style);
    });
  }
  // always register a click event: on click, search and zoom to the selected country
  // _dblClickTimer is an attempt to differentiate between doubleClicks to zoom, and single clicks on countries
  feature.on('click', function() {
    if (CONFIG._dblClickTimer !== null) {
      return;
    }
    CONFIG._dblClickTimer = setTimeout(() => {
      // now fire the desired 'click' event handler here
      selectCountry(this.feature); 

      CONFIG._dblClickTimer = null;
    }, 200);
  });
}

// define what happens when we click a country
function selectCountry(feature) {
  // clear the search input
  $('form.free-search input').val('');
  // get the name of the clicked country, and keep a reference to it
  var name = feature.properties['NAME'];
  // if we've clicked an alredy-selected country again, clear the selection, reset the search
  if (CONFIG.selected_country.name == name) {
    CONFIG.selected_country.name = '';
    CONFIG.selected_country.layer.clearLayers();
    render();
  } else {
    CONFIG.selected_country.name = name;
    // highlight it on the map, first clearning any existing selection
    CONFIG.selected_country.layer.clearLayers();
    CONFIG.selected_country.layer.addData(feature);
    // call the search function
    let bounds = L.geoJSON(feature).getBounds();
    console.log(name)
    searchCountryByName(name, bounds);
  }

  // no matter what, clear DATA.filtered
  DATA.filtered = null;

  // update state params
  updateStateParams();
}

// on other applications, this has filtered the data to this country;
// here, we only zoom to the bounds of the country, and continue to show items outside of its boundaries
function searchCountryByName(countryname, bounds) {
  // get the data for this country, *only* for updating the results panel
  // the map and table, continue to show all data
  var data = [];
  DATA.fossil_data.features.forEach(function(feature) {
    // look for matching names in feature.properties.country
    let countries = feature.properties['country'].split(',').map((item)=>item.trim());
    if (countries.indexOf(countryname) > -1) data.push(feature);
  });
  // if we don't have data, then we don't have a matching country name
  if (! data.length) return false;

  // if bounds were provided, zoom the map to the selected country
  // some countries require special/custom bounds calcs, because they straddle the dateline or are otherwise non-standard
  if (bounds) {
    switch (countryname) {
      case 'Russia':
        bounds = L.latLngBounds([38.35400, 24], [78.11962,178]);
        break;
      case 'United States':
        bounds = L.latLngBounds([18.3, -172.6], [71.7,-67.4]);
        break;
      case 'Canada':
        bounds = L.latLngBounds([41.6, -141.0], [81.7,-52.6]);
        break;
      default: break;
    }
    // got bounds, fit the map to it
    setTimeout(function() {
      CONFIG.map.fitBounds(bounds);  
    }, 0);
    
  } // has bounds

  // because we are not filtering the map, but only changing the bounds
  // results on the map can easily get out of sync due to a previous search filter
  // so first we need to explicity render() the map with all data, but not the table or results
  // THEN the table, with all data, but not with this countryname
  // THEN update results panel for *this* country data only
  // also odd about this approach: this is the only "search" which doesn't update the legend for what you've search for (a country)
  // instead, it shows everything in the legend (since everything IS on the map, but not in the results panel)
  $('div.leaflet-control-layers-overlays input').prop('checked','checked'); // select everything in the legend
  render({name: countryname, map: true, results: false, table: false});
  updateResultsPanel(data, countryname);
  drawTable(DATA.fossil_data.features);
  return true; // success
}

// craft a message for the results panel, depending on what's checked and what's not
function getResultsMessage() {
  let statuscount = $('div#status-types input').length;
  let statuschecked = $('div#status-types input:checked').length; 
  let typecount = $('div#process-types input').length;
  let typechecked = $('div#process-types input:checked').length; 

  let message = '';
  if (statuscount == statuschecked) {
    message = CONFIG.results_title;
  } else if (statuscount != statuschecked) {
    message = CONFIG.results_status;
  }  
  return message;
}

// when user clicks on a coal plant point, customize a popup dialog and open it
function openTrackerInfoPanel(feature) {
  // get the features properties, i.e. the data to show on the modal
  // pipelines and points have these stored in a diffferent location
  let properties = feature.attributes || feature.feature.properties;

  // get the popup target itself and customize
  let target = $('#tracker-modal');
  let inner  = $('#tracker-modal div.modal-body').empty();

  // get the attribute list, and split into two even buckets to form two columns
  let attribute_list = Object.keys(CONFIG.attributes);
  let length = Math.ceil(attribute_list.length / 2);
  attribute_list = chunkArray(attribute_list, length);
  attribute_list.forEach(function(list) {
    let col = $('<div>', { 'class': 'col-md-6 modal-cols' }).appendTo(inner);
    list.forEach(function(listitem) {
      // skip attributes not flagged for the popup
      if (! CONFIG.attributes[listitem].popup) return;

      let p = $('<p>', {}).appendTo(col);
      let name = CONFIG.attributes[listitem].name;
      let b = $('<b>', {text: `${name}: `}).appendTo(p);
      let format = CONFIG.attributes[listitem].format;
      let value;
      if (listitem == 'type') {
        value = CONFIG.fossil_types[properties[listitem]].text;
      } 
      else if (listitem == 'status_tabular') {
        value = CONFIG.status_types_tabular[properties[listitem]].text;
      }
      else if (listitem == 'capacity' || listitem == 'production' ) {
        // append the units to the value
        value = properties[listitem] ? `${CONFIG.format[format](properties[listitem])} ${properties['units']}` : '';
      } else {
        value = properties[listitem] ? CONFIG.format[format](properties[listitem]) : 'n/a';
      }
      let span = $('<span>', {text: value}).appendTo(p);
    })
  })
  
  // wiki page needs special handling to format as <a> link
  var wikilink = target.find('a#wiki-link');
  if (properties['url']) {
    wikilink.attr('href', properties['url']);
    wikilink.show();
  } else {
    wikilink.hide();
  }

  // format the zoom-to button data.zoom attribute. See $('#btn-zoom').click();
  // this lets one zoom to the location of the clicked plant
  // note: We aren't doing this for pipelines, which conveniently don't have feature.coordinates
  var zoomButton = $('#btn-zoom').hide();
  if (feature.coordinates) {
    zoomButton.show();
    zoomButton.attr('data-zoom', feature.coordinates[0] + "," + feature.coordinates[1]);

    // add the feature to the zoom button as well, for access by the back button
    // the desire is for the back button to open this same info-panel
    // because this is a full-blown Leaflet object with functions and such, use jQuery data() not the low-level HTML data attribute
    zoomButton.data().tracker = feature;
  }

  // all set: open the dialog
  target.modal();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// SHIMS AND UTILITIES: Various polyfills to add functionality
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// trim() function
if(!String.prototype.trim) { String.prototype.trim = function () {return this.replace(/^\s+|\s+$/g,'');};}


// check if a div has a horizontal scrollbar
$.fn.hasHorizontalScrollBar = function() {return this.get(0).scrollWidth > this.get(0).clientWidth; }

// get an object's keys
Object.keys||(Object.keys=function(){"use strict";var t=Object.prototype.hasOwnProperty,r=!{toString:null}.propertyIsEnumerable("toString"),e=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],o=e.length;return function(n){if("object"!=typeof n&&("function"!=typeof n||null===n))throw new TypeError("Object.keys called on non-object");var c,l,p=[];for(c in n)t.call(n,c)&&p.push(c);if(r)for(l=0;o>l;l++)t.call(n,e[l])&&p.push(e[l]);return p}}());

// string Capitalize first letter
String.prototype.capitalize = function() { return this.charAt(0).toUpperCase() + this.slice(1);}

// get a string's Proper Case
String.prototype.toTitleCase=function(){var e,r,t,o,n;for(t=this.replace(/([^\W_]+[^\s-]*) */g,function(e){return e.charAt(0).toUpperCase()+e.substr(1).toLowerCase()}),o=["A","An","The","And","But","Or","For","Nor","As","At","By","For","From","In","Into","Near","Of","On","Onto","To","With"],e=0,r=o.length;r>e;e++)t=t.replace(new RegExp("\\s"+o[e]+"\\s","g"),function(e){return e.toLowerCase()});for(n=["Id","Tv"],e=0,r=n.length;r>e;e++)t=t.replace(new RegExp("\\b"+n[e]+"\\b","g"),n[e].toUpperCase());return t};

// function to indicate whether we are likely being viewed on a touch device
function isTouch() { return !!("ontouchstart" in window) || window.navigator.msMaxTouchPoints > 0; }

// function to detect if we are likely being view on iPad
function isIpad() { return (navigator.userAgent.match(/iPad/i)) && (navigator.userAgent.match(/iPad/i)!= null); }

// variable to show if we are are on a mobile or iPad client
var mobileDetect = new MobileDetect(window.navigator.userAgent);
function isMobile() { return mobileDetect.mobile(); }

// reduce arrays to unique items
const uniq = (a) => { return Array.from(new Set(a));}

// wait for a variable to exist. When it does, fire the given callback
function waitForIt(key, callback) {
  if (key) {
    callback();
  } else {
    setTimeout(function() {
      waitForIt(key, callback);
    }, 100);
  }
};

// slice array into even chunks
function chunkArray(arr, len) {
  var chunks = [], i = 0, n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }
  return chunks;
}

// https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};
