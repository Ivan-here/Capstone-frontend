import Navbar from "@/components/layout/Navbar";
import NavbarFarmer from "@/components/layout/NavbarFarmer";
import NavbarNGO from "@/components/layout/NavbarNGO";
import NavbarRestaurant from "@/components/layout/NavbarRestaurant";
import { authService } from "@/services/auth.service";


export default function RoleNavbar({ businessType }) {
    // 1) If you have a business profile => use it (most reliable)
    if (businessType === "FARMER") return <NavbarFarmer />;
    if (businessType === "RESTAURANT") return <NavbarRestaurant />;
    if (businessType === "NGO") return <NavbarNGO />;

    // 2) fallback to JWT roles (if no business profile yet)
    const roles = (authService.getRoles?.() || [])
        .map(r => String(r).toUpperCase().replace(/^ROLE_/, "").trim());

    if (roles.includes("FARMER")) return <NavbarFarmer />;
    if (roles.includes("RESTAURANT")) return <NavbarRestaurant />;
    if (roles.includes("NGO")) return <NavbarNGO />;

    return <Navbar />;
}