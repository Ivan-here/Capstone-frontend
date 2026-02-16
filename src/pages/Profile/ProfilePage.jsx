import { useMemo, useState } from "react";
import "./profile.css";

import ProfileTabs from "./components/ProfileTabs";
import UserProfileLeft from "./components/UserProfileLeft";
import UserProfileRight from "./components/UserProfileRight";
import BusinessProfileLeft from "./components/BusinessProfileLeft";
import BusinessProfileRight from "./components/BusinessProfileRight";

export default function ProfilePage() {
    const hasBusinessProfile = true;

    const [activeTab, setActiveTab] = useState("USER"); // "USER" | "BUSINESS"
    const [aboutExpanded, setAboutExpanded] = useState(false);

    const userProfile = useMemo(
        () => ({
            fullName: "John Doe",
            role: "Farmer",
            location: "Toronto, ON",
            about:
                "I’m someone who enjoys discovering new products, supporting local sellers, and finding high-quality items that match my needs. I love seasonal produce, sustainable farming practices, and connecting with the community.",
            preferences: [
                "no dairy",
                "organic",
                "gluten free",
                "keto friendly",
                "vegan",
                "no peanuts",
                "seafood free",
                "seasonal veggies",
            ],
            stats: {
                reviews: 47,
                purchases: 20,
                following: 100,
                avgRating: 4.8,
                followers: 20,
            },
            followingPeople: [
                { id: 1, name: "A" },
                { id: 2, name: "B" },
                { id: 3, name: "C" },
                { id: 4, name: "D" },
                { id: 5, name: "E" },
                { id: 6, name: "F" },
                { id: 7, name: "G" },
            ],
            ratings: [
                {
                    id: 1,
                    itemName: "Cherries",
                    rating: 5,
                    reviewedAt: "Aug 10, 2025",
                    text:
                        "Great quality and fast service! Everything was fresh and exactly as described. The only thing keeping it from 5...",
                },
                {
                    id: 2,
                    itemName: "Tomatoes",
                    rating: 4,
                    reviewedAt: "Aug 06, 2025",
                    text: "Good flavor and packaging. Would buy again.",
                },
            ],
        }),
        []
    );

    // Mock business data placeholders (replace later)
    const businessProfile = useMemo(
        () => ({
            businessName: "Doe Farms",
            businessType: "Verified Farmer",
            address: "Toronto, ON",
        }),
        []
    );

    const businessStats = useMemo(
        () => ({
            activeListings: 12,
            ordersThisMonth: 34,
        }),
        []
    );

    return (
        <div className="profilePage">
            {/* Top bar */}
            <header className="profileTopbar">
                <div className="profileTitle">PROFILE</div>

                <div className="profileIcons">
                    <IconButton label="Notifications" symbol="🔔" />
                    <IconButton label="Cart" symbol="🛒" />
                    <IconButton label="Account" symbol="👤" />
                    <IconButton label="Settings" symbol="⚙️" />
                </div>
            </header>

            {/* Secondary nav */}
            <nav className="profileSubnav">
                <span className="subnavItem">COMMUNITY</span>
                <span className="subnavItem">BROWSE</span>
                <span className="subnavItem">FARMER’S HUB</span>
            </nav>

            {/* Main content */}
            <main className="profileMain">
                {/* Left column */}
                <div className="profileContainer">
                    <section className="leftCol">
                        <ProfileTabs
                            activeTab={activeTab}
                            onChange={setActiveTab}
                            showBusiness={hasBusinessProfile}
                        />

                        {activeTab === "USER" ? (
                            <UserProfileLeft
                                profile={userProfile}
                                aboutExpanded={aboutExpanded}
                                onToggleAbout={() => setAboutExpanded((v) => !v)}
                            />
                        ) : (
                            <BusinessProfileLeft businessProfile={businessProfile} />
                        )}
                    </section>

                    {/* Right column */}
                    <section className="rightCol">
                        {activeTab === "USER" ? (
                            <UserProfileRight profile={userProfile} />
                        ) : (
                            <BusinessProfileRight businessStats={businessStats} />
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

function IconButton({ symbol, label }) {
    return (
        <button className="iconBtn" aria-label={label} title={label} type="button">
            {symbol}
        </button>
    );
}
