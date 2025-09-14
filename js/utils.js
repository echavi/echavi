// Format a Date as ISO string: YYYY-MM-DDTHH:MM:SSZ
export function formatDateTimeIso(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).toISOString().replace(/\.\d{3}Z$/, "Z");
}
