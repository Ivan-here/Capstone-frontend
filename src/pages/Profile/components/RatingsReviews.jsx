import React from 'react';
import { useNavigate } from 'react-router-dom';

function Stars({ value }) {
    const full = Math.max(0, Math.min(5, value));
    return (
        <div className="stars" style={{ display: 'flex', gap: '2px', color: '#FBBF24' }}>
            {"★★★★★".split("").map((_, i) => (
                <span key={i} style={{ opacity: i < full ? 1 : 0.2, fontSize: '1.1rem' }}>★</span>
            ))}
        </div>
    );
}

export default function RatingsReviews({ fullName, ratings = [] }) {
    const navigate = useNavigate();

    return (
        <div className="card reviewsCard">
            <div className="sectionTitle" style={{ marginBottom: '20px', fontWeight: 'bold', fontSize: '1.2rem' }}>
                Ratings & Reviews
            </div>

            <div className="reviewList">
                {ratings.length === 0 ? (
                    <div className="muted" style={{ textAlign: "center", padding: "30px 0", color: '#888' }}>No reviews yet.</div>
                ) : (
                    ratings.map((r) => {
                        const displayName = r.reviewerName || fullName;
                        const avatarLetter = displayName.charAt(0).toUpperCase();

                        return (
                            <div key={r.id} className="reviewItem" style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                                {/* MINI AVATAR LINK */}
                                <div className="reviewLeft">
                                    <button
                                        onClick={() => navigate(`/profile/${r.reviewerId}`)}
                                        style={{
                                            width: '40px', height: '40px', background: '#4a7c59', color: 'white',
                                            borderRadius: '50%', border: 'none', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                                            fontWeight: 'bold', cursor: 'pointer'
                                        }}
                                    >
                                        {avatarLetter}
                                    </button>
                                </div>

                                <div className="reviewBody" style={{ flex: 1 }}>
                                    <div className="reviewTop" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <div className="reviewName">
                                            {/* NAME LINK */}
                                            <button
                                                onClick={() => navigate(`/profile/${r.reviewerId}`)}
                                                style={{ fontWeight: 'bold', color: '#333', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '1rem' }}
                                            >
                                                {displayName}
                                            </button>
                                        </div>
                                        <div className="reviewDate" style={{ fontSize: '0.8rem', color: '#999' }}>{r.reviewedAt}</div>
                                    </div>

                                    <Stars value={r.rating} />
                                    <div className="reviewText" style={{ margin: '10px 0', color: '#555', lineHeight: '1.4' }}>{r.text}</div>
                                    <div className="reviewItemName" style={{ fontSize: '0.75rem', color: '#7B8B5B', fontWeight: '600', textTransform: 'uppercase' }}>{r.itemName}</div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}