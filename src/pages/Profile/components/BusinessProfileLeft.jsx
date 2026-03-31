import Button from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import { Clock3, Mail, MapPin, PackageCheck } from "lucide-react";

export default function BusinessProfileLeft({ businessProfile, isOwnProfile }) {
    const displayName = businessProfile?.businessName || "Your Business";
    const businessType = businessProfile?.businessType || "Business";
    const address = businessProfile?.address || "No address set";
    const avatarFallback = displayName.charAt(0).toUpperCase();
    const navigate = useNavigate();
    const publicEmail = businessProfile?.email?.trim();
    const operatingHours = businessProfile?.hours?.trim();
    const serviceArea = businessProfile?.serviceArea?.trim();
    const pickupInstructions = businessProfile?.eligibilityNotes?.trim();
    const hasBusinessDetails = !!(publicEmail || operatingHours || serviceArea || pickupInstructions);

    return (
        <>
            <div className="card profileCard businessProfileCard">
                <div className="avatar">
                    {businessProfile?.avatarUrl ? (
                        <img src={businessProfile.avatarUrl} alt={displayName} className="avatarImg" />
                    ) : (
                        <div className="avatarInner">{avatarFallback}</div>
                    )}
                </div>

                <div className="profileMeta">
                    <div className="name">{displayName}</div>
                    <div className="role">{businessType}</div>
                    <div className="location">{address}</div>

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

            {hasBusinessDetails && (
                <div className="card businessDetailsCard">
                    <div className="cardHeader">
                        <span>Business Details</span>
                        <span className="muted">Public</span>
                    </div>

                    <div className="businessDetailsList">
                        {publicEmail && (
                            <div className="businessDetailRow">
                                <div className="businessDetailLabel">
                                    <Mail size={16} />
                                    <span>Public email</span>
                                </div>
                                <div className="businessDetailValue">
                                    <a href={`mailto:${publicEmail}`} className="linkBtn businessDetailLink">
                                        {publicEmail}
                                    </a>
                                </div>
                            </div>
                        )}

                        {operatingHours && (
                            <div className="businessDetailRow">
                                <div className="businessDetailLabel">
                                    <Clock3 size={16} />
                                    <span>Operating hours</span>
                                </div>
                                <div className="businessDetailValue">{operatingHours}</div>
                            </div>
                        )}

                        {serviceArea && (
                            <div className="businessDetailRow">
                                <div className="businessDetailLabel">
                                    <MapPin size={16} />
                                    <span>Service area</span>
                                </div>
                                <div className="businessDetailValue">{serviceArea}</div>
                            </div>
                        )}

                        {pickupInstructions && (
                            <div className="businessDetailRow businessDetailRow--stacked">
                                <div className="businessDetailLabel">
                                    <PackageCheck size={16} />
                                    <span>Pickup instructions</span>
                                </div>
                                <div className="businessDetailValue">{pickupInstructions}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
