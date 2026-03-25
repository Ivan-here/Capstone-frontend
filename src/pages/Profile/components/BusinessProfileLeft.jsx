import Button from "@/components/ui/Button";
import {useNavigate} from "react-router-dom";

// Added isOwnProfile prop
export default function BusinessProfileLeft({ businessProfile, isOwnProfile }) {
    const displayName = businessProfile?.businessName || "Your Business";
    const businessType = businessProfile?.businessType || "Business";
    const address = businessProfile?.address || "No address set";
    const navigate = useNavigate();

    return (
        <>
            <div className="card profileCard businessProfileCard">
                <div className="avatar" aria-hidden="true">
                    <div className="avatarInner">🙂</div>
                </div>

                <div className="profileMeta">
                    <div className="name">{displayName}</div>
                    <div className="role">{businessType}</div>
                    <div className="location">{address}</div>

                    {/* Button is now conditional */}
                    {isOwnProfile && (
                        <Button
                            className="primaryBtn"
                            variant="primary"
                            type="button"
                            onClick={() => navigate("/profile/business/edit")}
                        >
                            Edit business profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="card aboutCard businessAboutCard">
                <div className="cardHeader">
                    <span>About</span>
                    <span className="muted">Public</span>
                </div>

                <p className="aboutText">
                    {businessProfile?.description?.trim() ||
                        "Add a short description of your business..."}
                </p>
            </div>
        </>
    );
}