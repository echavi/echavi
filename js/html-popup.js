
/**
 * Generate HTML for a changeset popup
 */
export function htmlChangesetPopup(changesetMetadata) {

    const osmLink = `https://www.openstreetmap.org/changeset/${changesetMetadata.id}`;

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

    // Change type
    let changeType;
    if (!oldElem && newElem) changeType = "create";
    else if (oldElem && !newElem) changeType = "delete";
    else changeType = "modify";

    return `
        <b>${changeType} ${type} <a href="${url}" target="_blank">${id}</a></b>
        <br>${diffTags(oldElem, newElem)}
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
        return "<i>No tags</i>";
    }

    return `
        <table class="tags">
            ${rows.join("\n")}
        </table>
    `;
}
