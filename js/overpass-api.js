import { formatDateTimeIso } from "./utils.js";

export async function getChangesetMetadata(changesetId) {
    const url = `https://www.openstreetmap.org/api/0.6/changeset/${changesetId}`;
    const res = await fetch(url);
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");
    const cs = xml.querySelector("changeset");

    console.log("Changeset metadata XML result:\n", xmlText);

    if (!cs) {
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

    console.log("Requesting URL:", url);

    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log("Overpass XML result:\n", text);
        return text;
    } catch (err) {
        console.error("Error fetching Overpass diff:", err);
    }
}

export async function getChangesetOverpassAdiff(changesetMetadata) {
    const fromDate = new Date(changesetMetadata.created_at);
    fromDate.setSeconds(fromDate.getSeconds() - 1); // workaround: subtract 1 second from start date
    const from = fromDate.toISOString();
    const to = changesetMetadata.closed_at;
    const bbox = changesetMetadata.bbox;
    const id = changesetMetadata.id;

    console.log(`Loading changeset ${id} from ${from} to ${to} in bbox`, bbox);

    return getOverpassAdiff(bbox, from, to);
}
