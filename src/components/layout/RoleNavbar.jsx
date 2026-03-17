import Navbar from "@/components/layout/Navbar";
import NavbarFarmer from "@/components/layout/NavbarFarmer";
import NavbarNGO from "@/components/layout/NavbarNGO";
import NavbarRestaurant from "@/components/layout/NavbarRestaurant";
import NavbarAdmin from "@/components/layout/NavbarAdmin";
import { authService } from "@/services/auth.service";

export default function RoleNavbar({ businessType }) {
    // 1) Fallback to JWT roles first for ADMIN
    const roles = (authService.getRoles?.() || [])
        .map(r => String(r).toUpperCase().replace(/^ROLE_/, "").trim());

    if (roles.includes("ADMIN")) return <NavbarAdmin />;

    // 2) If you have a business profile => use it
    if (businessType === "FARMER") return <NavbarFarmer />;
    if (businessType === "RESTAURANT") return <NavbarRestaurant />;
    if (businessType === "NGO") return <NavbarNGO />;

    // 3) fallback to JWT roles for non-admin business roles
    if (roles.includes("FARMER")) return <NavbarFarmer />;
    if (roles.includes("RESTAURANT")) return <NavbarRestaurant />;
    if (roles.includes("NGO")) return <NavbarNGO />;

    return <Navbar />;
}