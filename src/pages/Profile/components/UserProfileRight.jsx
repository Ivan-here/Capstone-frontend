import PreferencesChips from "./PreferencesChips";
import RatingsReviews from "./RatingsReviews";

function StatBox({ value, label, privacy }) {
    return (
        <div className="statBox">
            <div className="statValue">{value}</div>
            <div className="statLabel">{label}</div>
            <div className="statPrivacy">{privacy}</div>
        </div>
    );
}

export default function UserProfileRight({ profile }) {
    const stats = profile?.stats || {};

    const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();

    return (
        <>
            <PreferencesChips preferences={profile.preferences || []} />

            <div className="card statsCard">
                <div className="statsHeader">Statistics</div>

                <div className="statsRow">
                    <StatBox label="reviews" value={stats.reviews ?? 0} privacy="Public" />
                    <StatBox label="purchases" value={stats.purchases ?? 0} privacy="Public" />
                    <StatBox label="following" value={stats.following ?? 0} privacy="Public" />
                    <StatBox
                        label="average rating"
                        value={`${stats.avgRating ?? 0} ★`}
                        privacy="Public"
                    />
                    <StatBox label="followers" value={stats.followers ?? 0} privacy="Private" />
                </div>
            </div>

            <RatingsReviews fullName={fullName} ratings={profile.ratings || []} />
        </>
    );
}