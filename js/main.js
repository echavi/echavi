import { LeafletMap, TileLayer, Control } from 'leaflet';
import { getChangesetMetadata } from './overpass-api.js';
import { getLayersFromChangesetMetadata } from './map-layers.js';

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
let bboxLayer;

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
    if (bboxLayer) map.removeLayer(bboxLayer);

    // Load and display changeset metadata
    const changesetMetadata = await getChangesetMetadata(id);
    bboxLayer = getLayersFromChangesetMetadata(changesetMetadata);
    bboxLayer.addTo(map);
    map.fitBounds(bboxLayer.getBounds());
});
