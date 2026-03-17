import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth.service";

export default function AdminRoute({ children }) {
    const location = useLocation();

    if (!authService.isLoggedIn()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!authService.hasRole("ADMIN")) {
        return <Navigate to="/browse" replace />;
    }

    return children;
}