export default function BusinessProfileRight({ businessStats }) {
    // Placeholder for later: listings, sales, reviews, etc.
    return (
        <div className="card placeholderCard">
            <div className="sectionTitle">Business Dashboard</div>

            <p className="muted">
                Placeholder. Later you can show listings, orders, business ratings, and analytics
                here.
            </p>

            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <div className="statBox">
                    <div className="statValue">{businessStats?.activeListings ?? 0}</div>
                    <div className="statLabel">active listings</div>
                    <div className="statPrivacy">Private</div>
                </div>

                <div className="statBox">
                    <div className="statValue">{businessStats?.ordersThisMonth ?? 0}</div>
                    <div className="statLabel">orders this month</div>
                    <div className="statPrivacy">Private</div>
                </div>
            </div>
        </div>
    );
}