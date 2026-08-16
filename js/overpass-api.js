import { formatDateTimeIso } from "./utils.js";

export async function getChangesetMetadata(changesetId) {
    const url = `https://www.openstreetmap.org/api/0.6/changeset/${changesetId}`;

    console.log("[overpass-api.js] Requesting URL:", url);

    const res = await fetch(url);
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");
    const cs = xml.querySelector("changeset");

    console.log("[overpass-api.js] OSM changeset metadata received");
    console.debug("[overpass-api.js] OSM changeset metadata XML result:\n", xmlText);

    if (!cs) {
        console.error("[overpass-api.js] No changeset found")
        throw new Error("No changeset found");
    }

    // Collect all tags
    const tags = {};
    cs.querySelectorAll("tag").forEach(tag => {
        const key = tag.getAttribute("k");
        const value = tag.getAttribute("v");
        if (key) tags[key] = value;
    });

    return {
        id: cs.getAttribute("id"),
        user: cs.getAttribute("user"),
        created_at: cs.getAttribute("created_at"),
        closed_at: cs.getAttribute("closed_at"),
        open: cs.getAttribute("open"),
        bbox: {
            left: parseFloat(cs.getAttribute("min_lon")),
            bottom: parseFloat(cs.getAttribute("min_lat")),
            right: parseFloat(cs.getAttribute("max_lon")),
            top: parseFloat(cs.getAttribute("max_lat"))
        },
        tags
    };
}

export async function getOverpassAdiff(bbox, from, to) {
    // Ensure dates are ISO strings without milliseconds
    const mindate = formatDateTimeIso(from);
    const maxdate = formatDateTimeIso(to);

    const dateRange = `"${mindate}"` + (maxdate ? `,"${maxdate}"` : '');
    const data_url = 'https://overpass-api.de/api/interpreter';

    const url = `${data_url}?data=[adiff:${dateRange}];` +
                `(node(bbox)(changed);way(bbox)(changed););out meta geom(bbox);` +
                `&bbox=${bbox.left},${bbox.bottom},${bbox.right},${bbox.top}`;

    console.log("[overpass-api.js] Requesting URL:", url);

    try {
        const res = await fetch(url);
        const text = await res.text();

        if (!res.ok) {
            throw new Error(
                `Overpass HTTP error ${res.status}: ${res.statusText}`
            );
        }

        console.log("[overpass-api.js] Overpass diff received")
        console.debug("[overpass-api.js] Overpass XML result:\n", text);

        // Overpass sometimes returns an HTML error document
        if (text.includes("<html") || text.includes("<!DOCTYPE html")) {
            const doc = new DOMParser().parseFromString(text, "text/html");

            const errorParagraph = [...doc.querySelectorAll("p")]
                .find(p => p.textContent.includes("Error"));

            const message = errorParagraph
                ? errorParagraph.textContent.trim()
                : "Overpass returned an HTML error response";

            throw new Error(
                `Overpass error: ${message}`
            );
        }

        return text;
    } catch (err) {
        console.error("[overpass-api.js] Error fetching Overpass diff:", err);
        throw err;
    }
}

export async function getChangesetOverpassAdiff(changesetMetadata) {
    const fromDate = new Date(changesetMetadata.created_at);
    fromDate.setSeconds(fromDate.getSeconds() - 1); // workaround: subtract 1 second from start date
    const from = fromDate.toISOString();
    const to = changesetMetadata.closed_at;
    const bbox = changesetMetadata.bbox;
    const id = changesetMetadata.id;

    console.log(`[overpass-api.js] Loading changeset ${id} from ${from} to ${to} in bbox`, bbox);

    return getOverpassAdiff(bbox, from, to);
}
