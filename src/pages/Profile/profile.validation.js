import { ABOUT_PREVIEW_LENGTH } from "./profile.constants";

// Full name validation
export function validateFullName(name) {
    if (!name || name.trim().length === 0) {
        return "Full name is required.";
    }

    if (name.trim().length < 2) {
        return "Full name must be at least 2 characters.";
    }

    return null;
}

// About section validation
export function validateAbout(about) {
    if (!about) return null;

    if (about.length > 500) {
        return "About section cannot exceed 500 characters.";
    }

    return null;
}

// Preferences validation
export function validatePreferences(preferences) {
    if (!Array.isArray(preferences)) {
        return "Preferences must be a list.";
    }

    if (preferences.length > 10) {
        return "You can select up to 10 preferences.";
    }

    return null;
}

// Generic helper (optional)
export function hasErrors(errors) {
    return Object.values(errors).some(Boolean);
}