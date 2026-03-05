import React, { useState, useEffect } from 'react';
import { verificationService } from "@/services/verification.service";
import { listingService } from "@/services/listing.service";

export default function BusinessProfileRight({ businessProfile, userId }) {
    const [verificationDoc, setVerificationDoc] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const isRestaurant = businessProfile?.businessType === "RESTAURANT";
    const verified = businessProfile?.verified;
    const docStatus = verified ? "Verified" : "Pending verification";

    useEffect(() => {
        const loadBusinessData = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const vData = await verificationService.getUserVerification(userId);
                setVerificationDoc(vData);

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

    return (
        <>
            <div className="card businessDocsCard">
                <div className="sectionTitle">Documents</div>

                <div className="businessDocRow">
                    <div className="businessDocTitle">Food Safety Certificate:</div>
                    <div className="businessDocMeta">
                        <div>Status: <b style={{color: verified ? '#2e7d32' : 'inherit'}}>{docStatus}</b></div>

                        {/* The document link stays visible if the record exists, regardless of status */}
                        {verificationDoc?.documentUrl ? (
                            <a
                                href={verificationDoc.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="linkBtn"
                                style={{display: 'inline-block', marginTop: '8px'}}
                            >
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
                    <div className="statBox">
                        <div className="statValue">{businessProfile?.reviews ?? 47}</div>
                        <div className="statLabel">reviews</div>
                    </div>
                    <div className="statBox">
                        <div className="statValue">{businessProfile?.purchases ?? 20}</div>
                        <div className="statLabel">purchases</div>
                    </div>
                    <div className="statBox">
                        <div className="statValue">{businessProfile?.totalSales ?? 400}</div>
                        <div className="statLabel">total sales</div>
                    </div>
                    <div className="statBox">
                        <div className="statValue">{(businessProfile?.avgRating ?? 4.0).toFixed(1)} ★</div>
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
                                    <img
                                        src={p.imageUrls?.[0] || "https://via.placeholder.com/120x90"}
                                        className="productImg"
                                        alt={p.title}
                                    />
                                    <div className="productInfo">
                                        <div className="productName">{p.title}</div>
                                        <div className="productMeta">
                                            <span>4.0 ★</span>
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
        </>
    );
}