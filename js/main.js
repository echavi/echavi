import { LeafletMap, TileLayer, Control, FeatureGroup } from 'leaflet';
import { getChangesetMetadata, getOverpassAdiff } from './overpass-api.js';
import { getLayersFromChangesetMetadata, getLayersFromOverpassAdiff } from './map-layers.js';

const TILE_DARKNESS = 'brightness(30%)';

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

// Add custom control for changeset input
const changesetControl = new Control({ position: 'topright' });
changesetControl.onAdd = function(map) {
    const container = document.createElement('div');
    container.id = 'changeset-control'; // optional, for styling
    container.innerHTML = `
        <div id="controls">
            <form id="changesetForm">
                <input id="changesetIdInput" placeholder="Changeset ID" />
                <button type="submit" id="loadButton">Load</button>
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

// Keep references to layers for clearing
let oldPolyLayer, newPolyLayer, oldMarkerLayer, newMarkerLayer, bboxLayer;

// Get controls
const changesetIdInput = document.getElementById('changesetIdInput');
const changesetForm = document.getElementById('changesetForm');

changesetForm.addEventListener('submit', async (event) => {
    // Prevent the page from reloading
    event.preventDefault();

    const id = parseInt(input.value, 10);
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
    changesetIdInput.value = id;

    // Update the URL without reloading the page
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('changeset', id);
    history.replaceState(null, '', newUrl);
    
    // Load and display changeset metadata
    const changesetMetadata = await getChangesetMetadata(id);
    bboxLayer = getLayersFromChangesetMetadata(changesetMetadata);
    bboxLayer.addTo(map);
    map.fitBounds(bboxLayer.getBounds());

    // Load and display changeset content
    const adiff = await getOverpassAdiff(changesetMetadata);
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
const params = new URLSearchParams(window.location.search);
const csId = params.get('changeset');
if (csId) {
    loadChangesetDiff(csId);
}
