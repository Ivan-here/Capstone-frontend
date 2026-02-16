import { useEffect, useState } from "react";
import { profileService } from "@/services/profile.service";
import { authService } from "@/services/auth.service";
import { useNavigate } from "react-router-dom";
import "./profile.css";

import ProfileTabs from "./components/ProfileTabs";
import UserProfileLeft from "./components/UserProfileLeft";
import UserProfileRight from "./components/UserProfileRight";
import BusinessProfileLeft from "./components/BusinessProfileLeft";
import BusinessProfileRight from "./components/BusinessProfileRight";

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("USER");
    const [aboutExpanded, setAboutExpanded] = useState(false);

    const [userProfile, setUserProfile] = useState(null);
    const [businessProfile, setBusinessProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await profileService.getMe();
                setUserProfile(data.personalProfile ?? null);
                setBusinessProfile(data.businessProfile ?? null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const hasBusinessProfile = !!businessProfile;

    function logout() {
        authService.logout();
        navigate("/login");
    }

    if (loading) return <div className="profilePage">Loading...</div>;
    if (!userProfile) return <div className="profilePage">No personal profile found.</div>;

    return (
        <div className="profilePage">
            <header className="profileTopbar">
                <div className="profileTitleSpacer" />
                <button className="logoutBtn" onClick={logout}>Logout</button>
            </header>

            <main className="profileMain">
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
                                onToggleAbout={() => setAboutExpanded(v => !v)}
                            />
                        ) : (
                            <BusinessProfileLeft businessProfile={businessProfile} />
                        )}
                    </section>

                    <section className="rightCol">
                        {activeTab === "USER" ? (
                            <UserProfileRight profile={userProfile} />
                        ) : (
                            <BusinessProfileRight businessStats={{
                                activeListings: businessProfile?.activeListings ?? 0,
                                ordersThisMonth: businessProfile?.ordersThisMonth ?? 0
                            }} />
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
