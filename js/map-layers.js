import { FeatureGroup, Rectangle, CircleMarker, Polyline } from 'leaflet';
import { COLORS } from './colors.js';
import { htmlChangesetPopup, htmlElemPopup } from './html-popup.js';

/**
 * Parse OSM changeset metadata and create Leaflet layers
 */
export function getLayersFromChangesetMetadata(changesetMetadata) {

    const bbox = changesetMetadata.bbox;

    // Minimum size in degrees
    const MIN_SIZE = 0.00005;

    // Calculate width and height
    let width = bbox.right - bbox.left;
    let height = bbox.top - bbox.bottom;

    // Expand bbox if below minimum size
    const expandX = Math.max(MIN_SIZE - width, 0) / 2;
    const expandY = Math.max(MIN_SIZE - height, 0) / 2;

    const bounds = [
        [bbox.bottom - expandY, bbox.left - expandX],
        [bbox.top + expandY, bbox.right + expandX]
    ];

    const rectangle = new Rectangle(bounds, { color: COLORS.BBOX, weight: 5, fill: false });
    rectangle.bindPopup(htmlChangesetPopup(changesetMetadata));

    const bboxLayer = new FeatureGroup();
    bboxLayer.addLayer(rectangle);
    return bboxLayer;
}

/**
 * Parse Overpass adiff XML and create Leaflet layers
 * Returns an object with: oldLayer, newLayer
 */
export function getLayersFromOverpassAdiff(adiffXml) {
    if (typeof adiffXml === "string") {
        adiffXml = new DOMParser().parseFromString(adiffXml, "application/xml");
    }

    const oldLayer = new FeatureGroup();
    const newLayer = new FeatureGroup();

    const actions = adiffXml.querySelectorAll("action");

    actions.forEach(action => {
        
        let oldNode, newNode;
        let oldWay, newWay;
        let oldColor, newColor;

        switch (action.getAttribute("type")) {
            case "create":
                newNode = action.querySelector("node");
                newWay = action.querySelector("way");
                newColor = COLORS.CREATED;
                break;

            case "delete":
                oldNode = action.querySelector("node");
                oldWay = action.querySelector("way");
                oldColor = COLORS.DELETED;
                break;

            case "modify":
                const oldContainer = action.querySelector("old");
                const newContainer = action.querySelector("new");
                oldNode = oldContainer?.querySelector("node");
                newNode = newContainer?.querySelector("node");
                oldWay = oldContainer?.querySelector("way");
                newWay = newContainer?.querySelector("way");
                break;
            
            default:
                return;
        }

        if (oldNode && newNode) {
            const geomChanged = (oldNode.getAttribute("lat") !== newNode.getAttribute("lat") || 
                oldNode.getAttribute("lon") !== newNode.getAttribute("lon"));
            if (geomChanged) {
                oldColor = COLORS.GEOM_OLD;
                newColor = COLORS.GEOM_NEW;
            } else {
                oldColor = COLORS.MODIFIED;
                newColor = COLORS.MODIFIED;
            }
        }

        if (oldNode) {
            const oldLat = parseFloat(oldNode.getAttribute("lat"));
            const oldLon = parseFloat(oldNode.getAttribute("lon"));
            const oldMarker = new CircleMarker([oldLat, oldLon], { radius: 5, color: oldColor });
            oldMarker.bindPopup(htmlElemPopup(oldNode, newNode));
            oldLayer.addLayer(oldMarker);
        }

        if (newNode) {
            const newLat = parseFloat(newNode.getAttribute("lat"));
            const newLon = parseFloat(newNode.getAttribute("lon"));
            const newMarker = new CircleMarker([newLat, newLon], { radius: 5, color: newColor });
            newMarker.bindPopup(htmlElemPopup(oldNode, newNode));
            newLayer.addLayer(newMarker);
        }

        let oldCoords, newCoords;

        if (oldWay) {
            oldCoords = [...oldWay.querySelectorAll("nd")]
                .map(nd => {
                    const lat = parseFloat(nd.getAttribute("lat"));
                    const lon = parseFloat(nd.getAttribute("lon"));
                    return isNaN(lat) || isNaN(lon) ? null : [lat, lon];
                })
                .filter(c => c !== null);
        }

        if (newWay) {
            newCoords = [...newWay.querySelectorAll("nd")]
                .map(nd => {
                    const lat = parseFloat(nd.getAttribute("lat"));
                    const lon = parseFloat(nd.getAttribute("lon"));
                    return isNaN(lat) || isNaN(lon) ? null : [lat, lon];
                })
                .filter(c => c !== null);
        }

        if (oldWay && newWay) {
            const geomChanged = oldCoords.length !== newCoords.length || 
                oldCoords.some((c, i) => c[0] !== newCoords[i][0] || c[1] !== newCoords[i][1]);
            if (geomChanged) {
                oldColor = COLORS.GEOM_OLD;
                newColor = COLORS.GEOM_NEW;
            } else {
                oldColor = COLORS.MODIFIED;
                newColor = COLORS.MODIFIED;
            }
        }

        if (oldWay) {
            const oldPoly = new Polyline(oldCoords, { color: oldColor, weight: 5 });
            oldPoly.bindPopup(htmlElemPopup(oldWay, newWay));
            oldLayer.addLayer(oldPoly);
        }

        if (newWay) {
            const newPoly = new Polyline(newCoords, { color: newColor, weight: 5 });
            newPoly.bindPopup(htmlElemPopup(oldWay, newWay));
            newLayer.addLayer(newPoly);
        }

    });

    return { oldLayer, newLayer };
}
