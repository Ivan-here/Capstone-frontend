export default function ProfileTabs({ activeTab, onChange, showBusiness = false }) {
    if (!showBusiness) return null;

    return (
        <div className="tabRow">
            <button
                className={`tabBtn ${activeTab === "USER" ? "active" : ""}`}
                onClick={() => onChange("USER")}
                type="button"
            >
                User
            </button>

            <button
                className={`tabBtn ${activeTab === "BUSINESS" ? "active" : ""}`}
                onClick={() => onChange("BUSINESS")}
                type="button"
            >
                Business
            </button>
        </div>
    );
}