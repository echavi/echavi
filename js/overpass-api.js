import { formatDateTimeIso } from "./utils.js";

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

            throw new Error(
                `Overpass error: ${errorParagraph.textContent.trim()}`
            );
        }

        // Overpass sometimes returns a valid XML document containing an error remark
        if (text.includes("<osm")) {
            const doc = new DOMParser().parseFromString(text, "application/xml");

            const remark = doc.querySelector("remark");

            if (remark) {
                throw new Error(
                    `Overpass error: ${remark.textContent.trim()}`
                );
            }
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
