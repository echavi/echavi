// Format a Date as compact UTC datetime: YYYYMMDDTHHMMSSZ
export function formatDateTimeCompact(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    return date.getUTCFullYear().toString() +
           pad(date.getUTCMonth() + 1) +
           pad(date.getUTCDate()) + "T" +
           pad(date.getUTCHours()) +
           pad(date.getUTCMinutes()) +
           pad(date.getUTCSeconds()) + "Z";
}

// Parse a compact datetime string YYYYMMDDTHHMMSSZ into a Date object (UTC)
export function parseDateTimeCompact(str) {
    if (!str || str.length !== 16) return null;
    const year = Number(str.slice(0, 4));
    const month = Number(str.slice(4, 6)) - 1;
    const day = Number(str.slice(6, 8));
    const hour = Number(str.slice(9, 11));
    const minute = Number(str.slice(11, 13));
    const second = Number(str.slice(13, 15));
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));
    return isNaN(date.getTime()) ? null : date;
}

// Format a bbox object as a compact string: left,bottom,right,top
export function formatBboxCompact(bbox) {
    return [bbox.left, bbox.bottom, bbox.right, bbox.top].map(n => n.toFixed(5)).join(',');
}

// Format a Date as ISO string: YYYY-MM-DDTHH:MM:SSZ
export function formatDateTimeIso(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).toISOString().replace(/\.\d{3}Z$/, "Z");
}

// Format a Date as local ISO-like string: YYYY-MM-DD HH:MM
export function formatDateTimeIsoLocal(date) {
    if (!date) return null;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Parse a date string into a Date object
export function parseDateTime(str) {
    if (!str) return null;
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
}

// Make a URL more human-readable
export function formatPrettyUrl(url) {
    url.href = url.href.replace(/%2C/g, ','); // make commas more readable
    return url;
}
