import Button from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function UserProfileLeft({ profile, aboutExpanded, onToggleAbout, isOwnProfile }) {
    const aboutShort =
        profile?.about?.length > 140 ? profile.about.slice(0, 140) + "..." : profile?.about;

    const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
    const hasDisplayName = profile?.displayName?.trim();
    const displayName = hasDisplayName ? profile.displayName.trim() : fullName;
    const avatarFallback = (displayName || "U").charAt(0).toUpperCase();
    const navigate = useNavigate();

    return (
        <>
            <div className="card profileCard">
                <div className="avatar">
                    {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={displayName} className="avatarImg" />
                    ) : (
                        <div className="avatarInner">{avatarFallback}</div>
                    )}
                </div>

                <div className="profileMeta">
                    <div className="name">{displayName}</div>
                    {hasDisplayName && (
                        <div className="muted" style={{ fontSize: 14 }}>
                            {fullName}
                        </div>
                    )}
                    <div className="role">{profile.role}</div>
                    <div className="location">{profile.location}</div>

                    {isOwnProfile && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                            <Button
                                className="primaryBtn"
                                variant="primary"
                                type="button"
                                onClick={() => navigate("/profile/edit")}
                            >
                                Edit profile
                            </Button>

                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => navigate("/my-orders")}
                                style={{ background: "transparent", border: "1px solid #7B8B5B", color: "#7B8B5B" }}
                            >
                                View Order History
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card aboutCard">
                <div className="cardHeader">
                    <span>About</span>
                    <span className="muted">Public</span>
                </div>
                <p className="aboutText">
                    {aboutExpanded ? profile.about : aboutShort}{" "}
                    {profile?.about?.length > 140 ? (
                        <button className="linkBtn" onClick={onToggleAbout} type="button">
                            {aboutExpanded ? "Read less" : "Read more"}
                        </button>
                    ) : null}
                </p>
            </div>

            {isOwnProfile && (
                <div className="card followCard">
                    <div className="cardHeader">
                        <span>Who you follow</span>
                        <span className="muted">Private</span>
                    </div>
                    <div className="followGrid">
                        {(profile.followingPeople || []).slice(0, 7).map((p) => (
                            <div key={p.id} className="followAvatar" title={p.name} aria-label={p.name}>
                                <span>@</span>
                            </div>
                        ))}
                    </div>
                    <button className="linkBtn seeMore" type="button">See more</button>
                </div>
            )}
        </>
    );
}
