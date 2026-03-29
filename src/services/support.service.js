import { apiFetch } from "./http";

export const supportService = {
    createStaffRequest(payload) {
        return apiFetch("/support/staff-requests", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
};
