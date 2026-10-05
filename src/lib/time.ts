const MONTHS = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function plural(count: number, unit: string) {
    return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/** Formats a Unix timestamp like Hacker News: "5 minutes ago", "89 days ago", "3 months ago", "on Sept 26, 2025" */
export function hnAge(time: number, now = Date.now()) {
    const minutes = Math.max(0, Math.floor((now / 1000 - time) / 60));
    const days = Math.floor(minutes / 1440);

    if (days >= 365) {
        const date = new Date(time * 1000);
        return `on ${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
    }
    if (days >= 90) return `${plural(Math.floor(days / 30), 'month')} ago`;
    if (days >= 1) return `${plural(days, 'day')} ago`;
    if (minutes >= 60) return `${plural(Math.floor(minutes / 60), 'hour')} ago`;
    return `${plural(minutes, 'minute')} ago`;
}
