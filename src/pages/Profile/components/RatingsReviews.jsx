function Stars({ value }) {
    const full = Math.max(0, Math.min(5, value));
    return (
        <div className="stars" aria-label={`${full} out of 5 stars`}>
            {"★★★★★".split("").map((_, i) => (
                <span key={i} className={`star ${i < full ? "on" : ""}`}>
          ★
        </span>
            ))}
        </div>
    );
}

export default function RatingsReviews({ fullName, ratings = [] }) {
    return (
        <div className="card reviewsCard">
            <div className="sectionTitle">Ratings & Reviews</div>

            <div className="reviewList">
                {ratings.map((r) => (
                    <div key={r.id} className="reviewItem">
                        <div className="reviewLeft">
                            <div className="miniAvatar">🙂</div>
                        </div>

                        <div className="reviewBody">
                            <div className="reviewTop">
                                <div className="reviewName">{fullName}</div>
                                <div className="reviewDate">Reviewed • {r.reviewedAt}</div>
                            </div>

                            <Stars value={r.rating} />

                            <div className="reviewText">
                                {r.text}{" "}
                                <button className="linkBtn" type="button">
                                    View Full Review
                                </button>
                            </div>

                            <div className="reviewItemName">{r.itemName}</div>
                        </div>
                    </div>
                ))}

                {ratings.length === 0 ? (
                    <div className="muted" style={{ textAlign: "center", padding: "10px 0" }}>
                        No reviews yet.
                    </div>
                ) : null}
            </div>
        </div>
    );
}