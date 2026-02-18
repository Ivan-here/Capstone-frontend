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

                if (!data?.personalProfile) {
                    authService.logout();
                    navigate("/login", { replace: true });
                    return;
                }
                setUserProfile(data.personalProfile);
                setBusinessProfile(data.businessProfile ?? null);
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                // If backend returns 401 or anything suspicious
                authService.logout();
                navigate("/login", { replace: true });
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);
    const hasBusinessProfile = !!businessProfile;

    function logout() {
        authService.logout();
        navigate("/login");
    }

    if (loading) return <div className="profilePage">Loading...</div>;

    return (
        <div className="profilePage profilePage--view">
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
                    <div className="profileFooter">
                        <button className="logoutBtn logoutBtnBottom" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
