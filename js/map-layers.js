import { FeatureGroup, Rectangle } from 'leaflet';
import { COLORS } from './colors.js';

/**
 * Parse OSM changeset metadata and create Leaflet layers
 */
export function getLayersFromChangesetMetadata(changesetMetadata) {

    const bbox = changesetMetadata.bbox;
    const bounds = [
        [bbox.bottom, bbox.left],
        [bbox.top, bbox.right]
    ];

    const rectangle = new Rectangle(bounds, { color: COLORS.BBOX, weight: 5, fill: false });

    const bboxLayer = new FeatureGroup();
    bboxLayer.addLayer(rectangle);
    return bboxLayer;
    
}
