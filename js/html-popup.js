
/**
 * Generate HTML for a changeset popup
 */
export function htmlChangesetPopup(changesetMetadata) {

    const osmLink = `https://www.openstreetmap.org/changeset/${changesetMetadata.id}`;
    const achaviLink = `https://overpass-api.de/achavi/?changeset=${changesetMetadata.id}`;
    const osmchaLink = `https://osmcha.org/changesets/${changesetMetadata.id}`;

    // Build table rows for every tag key/value
    const tagRows = Object.entries(changesetMetadata.tags || {})
        .map(([k, v]) => `<tr><td class="key">${k}</td><td class="value">${v}</td></tr>`)
        .join("");

    return `
            <strong>Changeset <a href="${osmLink}" target="_blank">${changesetMetadata.id}</a></strong><br>
            <table class="tags">
                <tr><td class="key">user</td><td class="value">${changesetMetadata.user || 'N/A'}</td></tr>
                <tr><td class="key">created_at</td><td class="value">${changesetMetadata.created_at}</td></tr>
                <tr><td class="key">closed_at</td><td class="value">${changesetMetadata.closed_at || 'N/A'}</td></tr>
                <tr><td class="key">open</td><td class="value">${changesetMetadata.open}</td></tr>
                <tr><td colspan="2"><hr style="display:none;"></td></tr>
                ${tagRows}
            </table>
            <div>
                View in <a href="${achaviLink}">achavi</a>, <a href="${osmchaLink}">OSMCha</a>
            </div>
        `;
}

/**
 * Generate HTML for a node/way popup
 */
export function htmlElemPopup(oldElem, newElem) {
    const elem = newElem || oldElem;
    if (!elem) return "<i>No data</i>";

    const type = elem.tagName.toLowerCase();
    const id = elem.getAttribute("id");

    const url = type === "node"
        ? `https://www.openstreetmap.org/node/${id}` 
        : `https://www.openstreetmap.org/way/${id}`;

    // Determine change type
    let changeType;
    if (!oldElem && newElem) changeType = "create";
    else if (oldElem && !newElem) changeType = "delete";
    else changeType = "modify";

    function getOsmLink(changeset) {
        return `<a href=https://www.openstreetmap.org/changeset/${changeset}>${changeset}</a>`;
    }

    // Extract metadata from <old> and <new> elements
    let versionOld, changesetOld, timestampOld, userOld;
    if (oldElem) {
        versionOld = oldElem.getAttribute("version");
        changesetOld = getOsmLink(oldElem.getAttribute("changeset"));
        timestampOld = oldElem.getAttribute("timestamp");
        userOld = oldElem.getAttribute("user");
    }
    let versionNew, changesetNew, timestampNew, userNew;
    if (newElem) {
        versionNew = newElem.getAttribute("version");
        changesetNew = getOsmLink(newElem.getAttribute("changeset"));
        timestampNew = newElem.getAttribute("timestamp");
        userNew = newElem.getAttribute("user");
    }

    // Build metadata table rows
    let metadata;
    if (oldElem && newElem) {
        metadata = `
            <tr><td class="key">version</td><td class="value">${versionOld}</td><td class="value">${versionNew}</td></tr>
            <tr><td class="key">changeset</td><td class="value">${changesetOld}</td><td class="value">${changesetNew}</td></tr>
            <tr><td class="key">timestamp</td><td class="value">${timestampOld}</td><td class="value">${timestampNew}</td></tr>
            <tr><td class="key">user</td><td class="value">${userOld}</td><td class="value">${userNew}</td></tr>
            <tr><td colspan="3"><hr style="display:none;"></td></tr>
        `;
    }
    else {
        metadata = `
            <tr><td class="key">version</td><td class="value">${versionOld || versionNew}</td></tr>
            <tr><td class="key">changeset</td><td class="value">${changesetOld || changesetNew}</td></tr>
            <tr><td class="key">timestamp</td><td class="value">${timestampOld || timestampNew}</td></tr>
            <tr><td class="key">user</td><td class="value">${userOld || userNew}</td></tr>
            <tr><td colspan="2"><hr style="display:none;"></td></tr>
        `;
    }

    return `
        <b>${changeType} ${type} <a href="${url}" target="_blank">${id}</a></b>
        <br>
        <table class="tags">
            ${metadata}
            ${diffTags(oldElem, newElem)}
        </table>
    `;
}

/**
 * Compare tags in <old> and <new> elements
 */
function diffTags(oldElem, newElem) {
    const oldTags = new Map();
    const newTags = new Map();

    if (oldElem) {
        oldElem.querySelectorAll("tag").forEach(tag =>
            oldTags.set(tag.getAttribute("k"), tag.getAttribute("v"))
        );
    }
    if (newElem) {
        newElem.querySelectorAll("tag").forEach(tag =>
            newTags.set(tag.getAttribute("k"), tag.getAttribute("v"))
        );
    }

    const allKeys = new Set([...oldTags.keys(), ...newTags.keys()]);
    const rows = [];

    for (const k of allKeys) {
        const vOld = oldTags.get(k);
        const vNew = newTags.get(k);

        if (oldElem && !newElem) {
            // Only old available
            rows.push(`<tr><td class="key old">${k}</td><td class="value old">${vOld ?? ""}</td></tr>`);
        } else if (!oldElem && newElem) {
            // Only new available
            rows.push(`<tr><td class="key new">${k}</td><td class="value new">${vNew ?? ""}</td></tr>`);
        } else {
            // Both old and new available
            if (vOld === undefined) {
                rows.push(`<tr><td class="key new">${k}</td><td></td><td class="value new">${vNew}</td></tr>`);
            } else if (vNew === undefined) {
                rows.push(`<tr><td class="key old">${k}</td><td class="value old">${vOld}</td><td></td></tr>`);
            } else if (vOld !== vNew) {
                rows.push(`<tr><td class="key">${k}</td><td class="value old">${vOld}</td><td class="value new">${vNew}</td></tr>`);
            } else {
                rows.push(`<tr><td class="key">${k}</td><td class="value">${vOld}</td><td class="value">${vNew}</td></tr>`);
            }
        }
    }

    if (rows.length === 0) {
        return "<tr><td><i>No tags</i></td></tr>";
    }

    return rows.join("\n");
}
