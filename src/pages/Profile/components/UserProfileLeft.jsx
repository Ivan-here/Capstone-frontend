import Button from "@/components/ui/Button";
import {useNavigate} from "react-router-dom";

export default function UserProfileLeft({ profile, aboutExpanded, onToggleAbout }) {
    const aboutShort =
        profile?.about?.length > 140 ? profile.about.slice(0, 140) + "..." : profile?.about;

    const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
    const navigate = useNavigate();

    return (
        <>
            <div className="card profileCard">
                <div className="avatar" aria-hidden="true">
                    <div className="avatarInner">🙂</div>
                </div>

                <div className="profileMeta">
                    <div className="name">{fullName || "Your Name"}</div>
                    <div className="role">{profile.role}</div>
                    <div className="location">{profile.location}</div>

                    <Button className="primaryBtn" variant="primary" type="button" onClick={() => navigate("/profile/edit")}>
                        Edit profile
                    </Button>
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

            <div className="card followCard">
                <div className="cardHeader">
                    <span>Who you follow</span>
                    <span className="muted">Private</span>
                </div>

                <div className="followGrid">
                    {(profile.followingPeople || []).slice(0, 7).map((p) => (
                        <div
                            key={p.id}
                            className="followAvatar"
                            title={p.name}
                            aria-label={p.name}
                        >
                            <span>👤</span>
                        </div>
                    ))}
                </div>

                <button className="linkBtn seeMore" type="button">
                    See more
                </button>
            </div>
        </>
    );
}