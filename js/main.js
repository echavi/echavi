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
    return container;
};
changesetControl.addTo(map);

// Keep references to layers for clearing
let oldLayer, newLayer, bboxLayer;

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
    if (oldLayer) map.removeLayer(oldLayer);
    if (newLayer) map.removeLayer(newLayer);
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
    oldLayer = layers.oldLayer;
    newLayer = layers.newLayer;
    oldLayer.addTo(map);
    newLayer.addTo(map);

    // combine both layers to fit map
    const combined = new FeatureGroup([oldLayer, newLayer]);
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
