const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isNormalizedWeeklySchedule(value) {
    const raw = String(value || "").trim();
    if (!raw) return false;
    return raw.split(/\r?\n+/).every((line) =>
        /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(Closed|([0-2]\d:[0-5]\d)\s*-\s*([0-2]\d:[0-5]\d))$/i.test(line.trim())
    );
}

export function parseWeeklySchedule(value) {
    const raw = String(value || "").trim();
    if (!raw || !isNormalizedWeeklySchedule(raw)) return null;

    return raw.split(/\r?\n+/).reduce((acc, line) => {
        const match = line.trim().match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(Closed|([0-2]\d:[0-5]\d)\s*-\s*([0-2]\d:[0-5]\d))$/i);
        if (!match) return acc;
        const day = match[1][0].toUpperCase() + match[1].slice(1, 3).toLowerCase();
        acc[day] = /closed/i.test(match[2])
            ? { closed: true, label: "Closed" }
            : { closed: false, label: `${match[3]} - ${match[4]}` };
        return acc;
    }, {});
}

export function getScheduleForDate(value, date) {
    const parsed = parseWeeklySchedule(value);
    if (!parsed || !(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const dayKey = DAY_KEYS[date.getDay()];
    return parsed[dayKey] || null;
}

export function weeklyScheduleLines(value) {
    if (!isNormalizedWeeklySchedule(value)) return [];
    return String(value || "").trim().split(/\r?\n+/).map((line) => line.trim()).filter(Boolean);
}
