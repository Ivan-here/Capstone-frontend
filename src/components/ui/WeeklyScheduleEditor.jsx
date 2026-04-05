import { useEffect, useMemo, useState } from "react";
import "./WeeklyScheduleEditor.css";

const DAYS = [
    { key: "Mon", label: "Mon" },
    { key: "Tue", label: "Tue" },
    { key: "Wed", label: "Wed" },
    { key: "Thu", label: "Thu" },
    { key: "Fri", label: "Fri" },
    { key: "Sat", label: "Sat" },
    { key: "Sun", label: "Sun" },
];

function createDefaultState() {
    return DAYS.reduce((acc, day) => {
        acc[day.key] = { closed: true, open: "09:00", close: "17:00" };
        return acc;
    }, {});
}

function parseSchedule(value) {
    const state = createDefaultState();
    const raw = String(value || "").trim();
    if (!raw) return state;

    const lines = raw.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean);
    let matchedAny = false;

    for (const line of lines) {
        const match = line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(Closed|([0-2]\d:[0-5]\d)\s*-\s*([0-2]\d:[0-5]\d))$/i);
        if (!match) continue;
        matchedAny = true;
        const dayKey = match[1][0].toUpperCase() + match[1].slice(1, 3).toLowerCase();
        if (/closed/i.test(match[2])) {
            state[dayKey] = { ...state[dayKey], closed: true };
        } else {
            state[dayKey] = {
                closed: false,
                open: match[3],
                close: match[4],
            };
        }
    }

    return matchedAny ? state : state;
}

function stringifySchedule(state) {
    return DAYS.map(({ key }) => {
        const item = state[key];
        if (!item || item.closed) return `${key}: Closed`;
        return `${key}: ${item.open} - ${item.close}`;
    }).join("\n");
}

export default function WeeklyScheduleEditor({
    label,
    value,
    onChange,
    helperText = "",
}) {
    const [schedule, setSchedule] = useState(() => parseSchedule(value));

    useEffect(() => {
        setSchedule(parseSchedule(value));
    }, [value]);

    const normalizedPreview = useMemo(() => stringifySchedule(schedule), [schedule]);

    function updateDay(dayKey, nextPatch) {
        setSchedule((prev) => {
            const next = {
                ...prev,
                [dayKey]: {
                    ...prev[dayKey],
                    ...nextPatch,
                },
            };
            onChange?.(normalizedPreviewFrom(next));
            return next;
        });
    }

    function normalizedPreviewFrom(nextState) {
        return stringifySchedule(nextState);
    }

    return (
        <div className="weeklySchedule">
            <div className="weeklyScheduleHeader">
                <label className="weeklyScheduleLabel">{label}</label>
                {helperText ? <p className="weeklyScheduleHelp">{helperText}</p> : null}
            </div>

            <div className="weeklyScheduleGrid">
                {DAYS.map(({ key, label: dayLabel }) => {
                    const item = schedule[key];
                    return (
                        <div key={key} className={`weeklyScheduleRow ${item.closed ? "is-closed" : ""}`}>
                            <div className="weeklyScheduleDay">{dayLabel}</div>
                            <label className="weeklyScheduleClosed">
                                <input
                                    type="checkbox"
                                    checked={item.closed}
                                    onChange={(e) => updateDay(key, { closed: e.target.checked })}
                                />
                                <span>Closed</span>
                            </label>
                            <input
                                className="weeklyScheduleTime"
                                type="time"
                                value={item.open}
                                onChange={(e) => updateDay(key, { open: e.target.value })}
                                disabled={item.closed}
                            />
                            <span className="weeklyScheduleDash">to</span>
                            <input
                                className="weeklyScheduleTime"
                                type="time"
                                value={item.close}
                                onChange={(e) => updateDay(key, { close: e.target.value })}
                                disabled={item.closed}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="weeklySchedulePreview">
                <span>Normalized format preview</span>
                <pre>{normalizedPreview}</pre>
            </div>
        </div>
    );
}
