import Navbar from "@/components/layout/Navbar";
import NavbarFarmer from "@/components/layout/NavbarFarmer";
import NavbarNGO from "@/components/layout/NavbarNGO";
import NavbarRestaurant from "@/components/layout/NavbarRestaurant";
import { authService } from "@/services/auth.service";

export default function RoleNavbar() {
    const roles = authService.getRoles();

    // priority if someone has multiple roles
    if (roles.includes("FARMER")) return <NavbarFarmer />;
    if (roles.includes("RESTAURANT")) return <NavbarRestaurant />;
    if (roles.includes("NGO")) return <NavbarNGO />;

    // default: shopper or unknown
    return <Navbar />;
}
