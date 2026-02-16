import Button from "@/components/ui/Button";

export default function BusinessProfileLeft({ businessProfile }) {
    // businessProfile can be null for now. This is a placeholder UI.
    const displayName = businessProfile?.businessName || "Your Business";
    const businessType = businessProfile?.businessType || "Business";
    const address = businessProfile?.address || "No address set";

    return (
        <div className="card placeholderCard">
            <div className="sectionTitle">Business Profile</div>

            <div style={{ display: "grid", gap: 6 }}>
                <div className="name" style={{ fontSize: 22 }}>
                    {displayName}
                </div>
                <div className="role">{businessType}</div>
                <div className="location">{address}</div>
            </div>

            <Button className="primaryBtn" variant="primary">
                Edit business profile
            </Button>
        </div>
    );
}