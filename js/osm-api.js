export async function getChangesetMetadata(changesetId) {
    const url = `https://www.openstreetmap.org/api/0.6/changeset/${changesetId}`;

    console.log("[osm-api.js] Requesting URL:", url);

    const res = await fetch(url);
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");
    const cs = xml.querySelector("changeset");

    console.log("[osm-api.js] OSM changeset metadata received");
    console.debug("[osm-api.js] OSM changeset metadata XML result:\n", xmlText);

    if (!cs) {
        console.error("[osm-api.js] No changeset found")
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
