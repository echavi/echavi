import { LeafletMap, TileLayer, Control, FeatureGroup } from 'leaflet';
import { getChangesetMetadata, getChangesetOverpassAdiff, getOverpassAdiff } from './overpass-api.js';
import { getLayersFromChangesetMetadata, getLayersFromOverpassAdiff } from './map-layers.js';
import { formatDateTimeIsoLocal, formatDateTimeCompact, parseDateTime, formatBboxCompact, parseDateTimeCompact, formatPrettyUrl } from './utils.js';

const TILE_DARKNESS = 'brightness(30%)';

// Load params from URL
const params = new URLSearchParams(window.location.search);

const map = new LeafletMap('map').setView([51.505, -0.09], 13);

const tiles = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Apply a dark filter to the tile layer
tiles.getContainer().style.filter = TILE_DARKNESS;

// Add github link to attribution
const attributionDiv = document.querySelector('div.leaflet-control-attribution');
attributionDiv.innerHTML = `<a href="https://github.com/echavi/echavi">echavi</a> | ` + attributionDiv.innerHTML;

// Get default start date/time value
function getDefaultStartDate() {
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 1);
    return defaultStart;
}

// Add custom control for changeset input
const changesetControl = new Control({ position: 'topright' });
changesetControl.onAdd = function(map) {
    const container = document.createElement('div');
    container.id = 'changeset-control'; // optional, for styling
    container.innerHTML = `
        <div id="controls">
            <form id="datetimeForm">
                <input id="startDateInput" placeholder="${formatDateTimeIsoLocal(getDefaultStartDate())}"/>
                <input id="endDateInput" placeholder="now" />
                <button type="submit" id="datetimeLoadButton">Load</button>
            </form>
            <form id="changesetForm">
                <input id="changesetIdInput" placeholder="Changeset ID" />
                <button type="submit" id="changesetLoadButton">Load</button>
            </form>
        </div>
    `;
    // Prevent clicks from propagating to the map
    container.addEventListener('click', e => e.stopPropagation());
    container.addEventListener('mousedown', e => e.stopPropagation());
    container.addEventListener('dblclick', e => e.stopPropagation());
    return container;
};
changesetControl.addTo(map);

// Get form controls
const changesetIdInput = document.getElementById('changesetIdInput');
const changesetForm = document.getElementById('changesetForm');
const changesetLoadButton = document.getElementById('changesetLoadButton')

const startDateInput = document.getElementById('startDateInput');
const endDateInput = document.getElementById('endDateInput');
const datetimeForm = document.getElementById('datetimeForm');

// Keep references to layers for clearing
let oldPolyLayer, newPolyLayer, oldMarkerLayer, newMarkerLayer, bboxLayer;

changesetForm.addEventListener('submit', async (event) => {
    // Prevent the page from reloading
    event.preventDefault();

    const id = parseInt(changesetIdInput.value, 10);
    loadChangesetDiff(id);
});

async function loadChangesetDiff(id) {
    // Clear previous layers
    if (oldPolyLayer) map.removeLayer(oldPolyLayer);
    if (newPolyLayer) map.removeLayer(newPolyLayer);
    if (oldMarkerLayer) map.removeLayer(oldMarkerLayer);
    if (newMarkerLayer) map.removeLayer(newMarkerLayer);
    if (bboxLayer) map.removeLayer(bboxLayer);

    // Update the control inputs
    startDateInput.value = '';
    endDateInput.value = '';
    changesetIdInput.value = id;

    // Update the URL without reloading the page
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('changeset', id);
    newUrl.searchParams.delete('start');
    newUrl.searchParams.delete('end');
    newUrl.searchParams.delete('bbox');
    history.replaceState(null, '', formatPrettyUrl(newUrl));
    
    // Load and display changeset metadata
    const changesetMetadata = await getChangesetMetadata(id);
    bboxLayer = getLayersFromChangesetMetadata(changesetMetadata);
    bboxLayer.addTo(map);
    map.fitBounds(bboxLayer.getBounds());

    // Load and display changeset content
    const adiff = await getChangesetOverpassAdiff(changesetMetadata);
    const layers = getLayersFromOverpassAdiff(adiff);
    oldPolyLayer = layers.oldPolyLayer;
    newPolyLayer = layers.newPolyLayer;
    oldMarkerLayer = layers.oldMarkerLayer;
    newMarkerLayer = layers.newMarkerLayer;
    
    oldPolyLayer.addTo(map);
    newPolyLayer.addTo(map);
    oldMarkerLayer.addTo(map);
    newMarkerLayer.addTo(map);

    // combine all layers to fit map
    const combined = new FeatureGroup([bboxLayer, oldPolyLayer, newPolyLayer, oldMarkerLayer, newMarkerLayer]);
    if (combined.getBounds().isValid()) {
        map.fitBounds(combined.getBounds());
    }
}

datetimeForm.addEventListener('submit', async (event) => {
    // Prevent the page from reloading
    event.preventDefault();

    const start = parseDateTime(startDateInput.value) || getDefaultStartDate();
    const end = parseDateTime(endDateInput.value);

    // Get bbox of current map view
    const bounds = map.getBounds();
    const bbox = {
        left: bounds.getWest(),
        bottom: bounds.getSouth(),
        right: bounds.getEast(),
        top: bounds.getNorth()
    };

    loadDatetimeDiff(bbox, start, end);
});

async function loadDatetimeDiff(bbox, start, end) {
    // Clear previous layers
    if (oldPolyLayer) map.removeLayer(oldPolyLayer);
    if (newPolyLayer) map.removeLayer(newPolyLayer);
    if (oldMarkerLayer) map.removeLayer(oldMarkerLayer);
    if (newMarkerLayer) map.removeLayer(newMarkerLayer);
    if (bboxLayer) map.removeLayer(bboxLayer);

    // Update the control inputs
    startDateInput.value = formatDateTimeIsoLocal(start);
    endDateInput.value = formatDateTimeIsoLocal(end) || '';
    changesetIdInput.value = '';

    // Update the URL without reloading the page
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('start', formatDateTimeCompact(start));
    if (end) newUrl.searchParams.set('end', formatDateTimeCompact(end));
    newUrl.searchParams.set('bbox', formatBboxCompact(bbox));
    newUrl.searchParams.delete('changeset');
    history.replaceState(null, '', formatPrettyUrl(newUrl));

    // Load and display changes
    const adiff = await getOverpassAdiff(bbox, start, end);
    const layers = getLayersFromOverpassAdiff(adiff);
    oldPolyLayer = layers.oldPolyLayer;
    newPolyLayer = layers.newPolyLayer;
    oldMarkerLayer = layers.oldMarkerLayer;
    newMarkerLayer = layers.newMarkerLayer;
    
    oldPolyLayer.addTo(map);
    newPolyLayer.addTo(map);
    oldMarkerLayer.addTo(map);
    newMarkerLayer.addTo(map);

    // combine all layers to fit map
    const combined = new FeatureGroup([bboxLayer, oldPolyLayer, newPolyLayer, oldMarkerLayer, newMarkerLayer]);
    if (combined.getBounds().isValid()) {
        map.fitBounds(combined.getBounds());
    }
}

// Load changeset from URL if present
const csId = params.get('changeset');
if (csId) {
    loadChangesetDiff(csId);
}

// Load datetime from URL if present
const startParam = params.get('start');
const endParam = params.get('end');
const bboxParam = params.get('bbox');
if (bboxParam && startParam) {
    let bbox;
    const bboxParam = params.get('bbox');
    if (bboxParam) {
        const parts = bboxParam.split(',').map(parseFloat);
        if (parts.length === 4 && parts.every(n => !isNaN(n))) {
            bbox = { left: parts[0], bottom: parts[1], right: parts[2], top: parts[3] };
        }
    }
    if (bbox) {
        loadDatetimeDiff(bbox, parseDateTimeCompact(startParam), parseDateTimeCompact(endParam));
    }
}
