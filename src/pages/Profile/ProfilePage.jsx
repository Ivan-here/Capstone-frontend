import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { profileService } from "@/services/profile.service";
import { authService } from "@/services/auth.service";
import "./profile.css";

import ProfileTabs from "./components/ProfileTabs";
import UserProfileLeft from "./components/UserProfileLeft";
import UserProfileRight from "./components/UserProfileRight";
import BusinessProfileLeft from "./components/BusinessProfileLeft";
import BusinessProfileRight from "./components/BusinessProfileRight";

export default function ProfilePage() {
    // 1. Extract userId from the URL to determine if we are viewing a seller
    const { userId } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("USER");
    const [aboutExpanded, setAboutExpanded] = useState(false);

    const [userProfile, setUserProfile] = useState(null);
    const [businessProfile, setBusinessProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. Identify if the current view is for the logged-in user or an external seller
    const myId = localStorage.getItem('userId');
    const isViewingOthers = userId && userId !== myId;

    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setLoading(true);

                // 3. Fetch specific seller data if userId exists, otherwise fetch personal data
                const data = isViewingOthers
                    ? await profileService.getProfileById(userId)
                    : await profileService.getMe();

                if (!data?.personalProfile) {
                    if (!isViewingOthers) {
                        authService.logout();
                        navigate("/login", { replace: true });
                    }
                    return;
                }

                setUserProfile(data.personalProfile);
                setBusinessProfile(data.businessProfile ?? null);

                // 4. Automatically switch to the Business tab when viewing a seller
                if (isViewingOthers && data.businessProfile) {
                    setActiveTab("BUSINESS");
                } else {
                    setActiveTab("USER");
                }

            } catch (err) {
                console.error("Error loading profile:", err);
                if (!isViewingOthers) {
                    authService.logout();
                    navigate("/login", { replace: true });
                }
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();
    }, [userId, navigate, isViewingOthers]);

    const hasBusinessProfile = !!businessProfile;

    function logout() {
        authService.logout();
        navigate("/login");
    }

    if (loading) return <div className="profilePage">Loading Profile...</div>;
    if (!userProfile) return <div className="profilePage">Profile not found.</div>;

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
                                // 5. Pass ownership flag to hide "Edit" and "Order History" buttons
                                isOwnProfile={!isViewingOthers}
                            />
                        ) : (
                            <BusinessProfileLeft
                                businessProfile={businessProfile}
                                // 6. Pass ownership flag to hide business edit buttons
                                isOwnProfile={!isViewingOthers}
                            />
                        )}
                    </section>

                    <section className="rightCol">
                        {activeTab === "USER" ? (
                            <UserProfileRight
                                profile={userProfile}
                                // 7. Pass ownership flag to handle private statistics visibility
                                isOwnProfile={!isViewingOthers}
                            />
                        ) : (
                            <BusinessProfileRight
                                businessProfile={businessProfile}
                                userId={userProfile.userId || userId}
                                // 8. Pass ownership flag for seller-specific statistics
                                isOwnProfile={!isViewingOthers}
                            />
                        )}
                    </section>

                    {/* 9. Logout is only visible to the profile owner */}
                    {!isViewingOthers && (
                        <div className="profileFooter">
                            <button className="logoutBtn logoutBtnBottom" onClick={logout}>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}