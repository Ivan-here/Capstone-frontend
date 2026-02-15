import Chip from "@/components/ui/Chip";

export default function PreferencesChips({ preferences = [] }) {
    return (
        <div className="card prefsCard">
            <div className="sectionTitle">Preferences</div>

            <div className="chipRow">
                {preferences.map((p) => (
                    <Chip key={p} label={p} />
                ))}
            </div>
        </div>
    );
}