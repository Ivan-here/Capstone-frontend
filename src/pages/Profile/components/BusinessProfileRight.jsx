import React, { useState, useEffect } from 'react';
import { verificationService } from "@/services/verification.service";
import { listingService } from "@/services/listing.service";
// NEW IMPORTS
import { reviewService } from "@/services/reviewService";
import RatingsReviews from "./RatingsReviews";

export default function BusinessProfileRight({ businessProfile, userId }) {
    const [verificationDoc, setVerificationDoc] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // NEW STATE FOR REVIEWS
    const [businessReviews, setBusinessReviews] = useState([]);
    const [ratingData, setRatingData] = useState({ averageRating: 0, totalReviews: 0 });

    const isRestaurant = businessProfile?.businessType === "RESTAURANT";
    const verified = businessProfile?.verified;
    const docStatus = verified ? "Verified" : "Pending verification";

    useEffect(() => {
        const loadBusinessData = async () => {
            if (!userId) return;
            try {
                setLoading(true);

                // Fetch verification, products, and reviews concurrently
                const [vData, avgData, reviewsList] = await Promise.all([
                    verificationService.getUserVerification(userId).catch(() => null),
                    reviewService.getAverageRating("SELLER", userId), // TargetType = SELLER
                    reviewService.getTargetReviews("SELLER", userId)
                ]);

                setVerificationDoc(vData);
                setRatingData(avgData);
                setBusinessReviews(reviewsList);

                if (businessProfile?.businessType === "FARMER") {
                    const allListings = await listingService.getAllListings();
                    setProducts(allListings.filter(l => l.ownerId === userId));
                }
            } catch (err) {
                console.error("Error loading business data", err);
            } finally {
                setLoading(false);
            }
        };
        loadBusinessData();
    }, [userId, businessProfile?.businessType]);

    // Format the backend review data to match your RatingsReviews.jsx props expectations
    const formattedRatings = businessReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        text: r.comment,
        reviewedAt: new Date(r.createdAt).toLocaleDateString(),
        itemName: r.targetType === "LISTING" ? "Product Review" : "Business Review",
        // Pass the reviewer name if available, otherwise Anonymous
        reviewerName: r.isAnonymous ? "Anonymous" : (r.reviewerName || "Verified Buyer")
    }));

    return (
        <>
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

            <div className="card statsCard">
                <div className="statsHeader">Statistics</div>
                <div className="statsRow businessStatsRow">
                    {/* DYNAMIC REVIEWS STATS */}
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
                    {/* DYNAMIC AVERAGE RATING */}
                    <div className="statBox">
                        <div className="statValue">{ratingData.averageRating > 0 ? ratingData.averageRating.toFixed(1) : "0.0"} ★</div>
                        <div className="statLabel">average rating</div>
                    </div>
                    <div className="statBox">
                        <div className="statValue">230</div>
                        <div className="statLabel">followers</div>
                    </div>
                </div>
            </div>

            <div className="card businessProductsCard">
                <div className="sectionTitle">{isRestaurant ? "Promotions" : "Products"}</div>
                {/* ... Your existing Product Grid mapping remains exactly the same ... */}
                {isRestaurant ? (
                    <div className="productGrid">
                        <div className="productCard">
                            <img src="https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=400" className="productImg" alt="Promo" />
                            <div className="productInfo">
                                <div className="productName">JAPANESE NIGHT IS HERE !!!</div>
                                <div className="productDesc">We are hosting a Japanese night from 2nd Feb, 2026 - 10th Feb, 2026...</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="productGrid">
                        {products.length === 0 ? (
                            <div className="muted">No products yet.</div>
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
                )}
            </div>

            {/* NEW: RENDER THE REVIEWS FEED */}
            <RatingsReviews
                fullName={businessProfile?.businessName || "Business"}
                ratings={formattedRatings}
            />
        </>
    );
}