import React, { useState, useEffect } from 'react';
import { verificationService } from "@/services/verification.service";
import { listingService } from "@/services/listing.service";
import { reviewService } from "@/services/reviewService";
import StarRating from '../../../myOrders/StarRating.jsx'
import InteractiveStarRating from '../common/InteractiveStarRating.jsx'; // Clickable selection
// import RatingsReviews from "./RatingsReviews"; // Assuming we are replacing this with styled inline code for now

// Placeholder component for reviewer initials avatar
const AvatarCircle = ({ name }) => {
    const initials = name ? name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2) : "??";
    return (
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#4a7c59', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', marginRight: '15px' }}>
            {initials}
        </div>
    );
};

export default function BusinessProfileRight({ businessProfile, userId, isOwnProfile }) {
    const [verificationDoc, setVerificationDoc] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [businessReviews, setBusinessReviews] = useState([]);
    const [ratingData, setRatingData] = useState({ averageRating: 0, totalReviews: 0 });

    const [showReviewForm, setShowReviewForm] = useState(false);
    // Integer rating for selection (1, 2, 3, 4, 5)
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");

    const isRestaurant = businessProfile?.businessType === "RESTAURANT";
    const verified = businessProfile?.verified;
    const docStatus = verified ? "Verified" : "Pending verification";

    useEffect(() => {
        const loadBusinessData = async () => {
            if (!userId) return;
            try {
                setLoading(true);

                const [vData, avgData, reviewsList] = await Promise.all([
                    verificationService.getUserVerification(userId).catch(() => null),
                    reviewService.getAverageRating("SELLER", userId),
                    reviewService.getTargetReviews("SELLER", userId)
                ]);

                setVerificationDoc(vData);
                setRatingData(avgData);
                setBusinessReviews(reviewsList);

                const allListings = await listingService.getAllListings();
                setProducts(allListings.filter(l => l.ownerId === userId));

            } catch (err) {
                console.error("Error loading business data", err);
            } finally {
                setLoading(false);
            }
        };
        loadBusinessData();
    }, [userId, businessProfile?.businessType]);

    const handleSellerReviewSubmit = async () => {
        if (!newComment.trim()) {
            alert("Please write a comment.");
            return;
        }
        try {
            await reviewService.createReview({
                targetId: userId,
                targetType: "SELLER",
                rating: newRating,
                comment: newComment,
                isAnonymous: false
            });
            alert("Review submitted successfully!");
            setShowReviewForm(false);
            setNewComment("");
            window.location.reload();
        } catch (err) {
            console.error("Failed to submit review", err);
            alert("Failed to submit review. Have you ordered from them?");
        }
    };

    return (
        <div className="pd-wrapper" style={{ fontFamily: '"Roboto", sans-serif' }}>
            {/* Documents Card (Kept existing structure) */}
            <div className="card businessDocsCard">
                <div className="sectionTitle">Documents</div>
                <div className="businessDocRow">
                    <div className="businessDocTitle">Food Safety Certificate:</div>
                    <div className="businessDocMeta">
                        <div>Status: <b style={{color: verified ? '#2e7d32' : 'inherit'}}>{docStatus}</b></div>
                        {verificationDoc?.documentUrl ? (
                            <a href={verificationDoc.documentUrl} target="_blank" rel="noreferrer" className="linkBtn" style={{display: 'inline-block', marginTop: '8px'}}>
                                View uploaded document
                            </a>
                        ) : (
                            <div className="muted">No document uploaded</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Card (Kept existing structure, improved Average Rating display) */}
            <div className="card statsCard">
                <div className="statsHeader">Statistics</div>
                <div className="statsRow businessStatsRow">
                    <div className="statBox">
                        <div className="statValue">{ratingData.totalReviews}</div>
                        <div className="statLabel">reviews</div>
                    </div>
                    <div className="statBox">
                        <div className="statValue">{businessProfile?.purchases ?? 0}</div>
                        <div className="statLabel">purchases</div>
                    </div>
                    <div className="statBox">
                        <div className="statValue">{businessProfile?.totalSales ?? 0}</div>
                        <div className="statLabel">total sales</div>
                    </div>
                    <div className="statBox" style={{ textAlign: 'center' }}>
                        <div className="statValue">{ratingData.averageRating > 0 ? ratingData.averageRating.toFixed(1) : "0.0"} <span style={{fontSize: '0.8rem', color: '#FFB400'}}>★</span></div>
                        <div className="statLabel">average rating</div>
                    </div>
                    <div className="statBox">
                        <div className="statValue">{businessProfile?.followersCount ?? 0}</div>
                        <div className="statLabel">followers</div>
                    </div>
                </div>
            </div>

            {/* Products Card (Kept existing structure) */}
            <div className="card businessProductsCard">
                <div className="sectionTitle">{isRestaurant ? "Promotions" : "Products"}</div>
                <div className="productGrid">
                    {products.length === 0 ? (
                        <div className="muted">No {isRestaurant ? "promotions" : "products"} yet.</div>
                    ) : (
                        products.map((p) => (
                            <div key={p.id} className="productCard">
                                <img src={p.imageUrls?.[0] || "https://via.placeholder.com/120x90"} className="productImg" alt={p.title} />
                                <div className="productInfo">
                                    <div className="productName">{p.title}</div>
                                    <div className="productMeta">
                                        <span>${p.price}/{p.unit}</span>
                                    </div>
                                    <div className="productDesc">{p.description}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- NEW BEAUTIFUL "RATE THIS SELLER" SECTION --- */}
            {!isOwnProfile && (
                <div className="card" style={{ padding: '25px', marginBottom: '25px', background: '#F9FAFB', border: '1px solid #EEF0F3', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#2D2D2D', fontWeight: 600 }}>Order from this seller? Share your experience!</h3>
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            style={{ background: '#4a7c59', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: 'background 0.2s' }}
                        >
                            {showReviewForm ? "Cancel Review" : "Rate this Seller"}
                        </button>
                    </div>

                    {showReviewForm && (
                        <div style={{ marginTop: '20px', padding: '20px', background: '#fff', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: '#4B5563', display: 'block', marginBottom: '8px' }}>Rate this business (click stars):</label>
                                {/* THE NEW INTERACTIVE STAR INPUT */}
                                <InteractiveStarRating rating={newRating} setRating={setNewRating} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: '#4B5563', display: 'block', marginBottom: '8px' }}>Your Comment:</label>
                                <textarea
                                    placeholder="Write your honest review here. Have you ordered from them? Very friendly?"
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB', marginBottom: '10px', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: 1.5 }}
                                />
                            </div>
                            <button
                                onClick={handleSellerReviewSubmit}
                                style={{ background: '#ff9800', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}
                            >
                                Submit Verified Review
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- NEW BEAUTIFUL "RATINGS & REVIEWS" LIST SECTION --- */}
            <div className="card" style={{ padding: '25px', borderRadius: '12px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#2D2D2D', fontWeight: 600, borderBottom: '2px solid #EEEEEE', paddingBottom: '15px' }}>Ratings & Reviews</h3>

                {businessReviews.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6B7280', padding: '20px 0' }}>No reviews yet for this business.</div>
                ) : (
                    businessReviews.map(r => {
                        const reviewerName = r.isAnonymous ? "Anonymous Buyer" : (r.reviewerName || "Verified Buyer");
                        return (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #F3F4F6', padding: '20px 0', '&:last-child': { borderBottom: 'none' } }}>
                                <AvatarCircle name={reviewerName} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <b style={{ fontSize: '1rem', color: '#1F2937' }}>{reviewerName}</b>
                                            {/* Display integer star count */}
                                            <div style={{ color: '#FFB400', fontSize: '0.9rem' }}>{Array(r.rating).fill('★').join('')}</div>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>
                                            {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#4B5563', lineHeight: 1.6 }}>{r.comment}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}