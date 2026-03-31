import React, { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import { useLocation, useNavigate } from "react-router-dom";
import { verificationService } from "@/services/verification.service";
import { listingService } from "@/services/listing.service";
import { reviewService } from "@/services/reviewService";
import { paymentService } from "@/services/payment.service";
import { settingsService } from "@/services/settings.service";
import RatingsReviews from "./RatingsReviews";

export default function BusinessProfileRight({ businessProfile, userId, isOwnProfile }) {
    const location = useLocation();
    const navigate = useNavigate();
    const effectiveUserId = userId || localStorage.getItem("userId");
    const [verificationDoc, setVerificationDoc] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [businessReviews, setBusinessReviews] = useState([]);
    const [ratingData, setRatingData] = useState({ averageRating: 0, totalReviews: 0 });
    const [paymentProfile, setPaymentProfile] = useState(null);
    const [resubmitFile, setResubmitFile] = useState(null);
    const [resubmittingDocument, setResubmittingDocument] = useState(false);
    const [documentError, setDocumentError] = useState("");
    const [documentNotice, setDocumentNotice] = useState("");
    const [stripeNotice, setStripeNotice] = useState("");

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");

    const isRestaurant = businessProfile?.businessType === "RESTAURANT";
    const isStripeEligibleBusiness =
        businessProfile?.businessType === "FARMER" || businessProfile?.businessType === "RESTAURANT";
    const verified = businessProfile?.verified;
    const verificationStatus = verificationDoc?.status || (verified ? "APPROVED" : "PENDING");
    const docStatus = verificationStatus === "APPROVED"
        ? "Verified"
        : verificationStatus === "REJECTED"
            ? "Rejected"
            : "Pending verification";

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const stripeStatus = searchParams.get("stripe");
        const returnedSellerId = searchParams.get("sellerId");

        if (!stripeStatus && !returnedSellerId) {
            setStripeNotice("");
            return;
        }

        if (!isOwnProfile || !returnedSellerId || returnedSellerId !== effectiveUserId) {
            setStripeNotice("");
            return;
        }

        if (paymentProfile?.onboardingComplete) {
            setStripeNotice("Stripe onboarding completed. Your payment status has been refreshed.");
            navigate(location.pathname, { replace: true });
            return;
        }

        if (stripeStatus === "connected") {
            setStripeNotice("Stripe onboarding completed. Your payment status has been refreshed.");
            navigate(location.pathname, { replace: true });
            return;
        }

        if (stripeStatus === "pending") {
            setStripeNotice("Stripe onboarding is still incomplete. You can continue setup from this page.");
            navigate(location.pathname, { replace: true });
            return;
        }

        setStripeNotice("");
    }, [effectiveUserId, isOwnProfile, location.pathname, location.search, navigate, paymentProfile?.onboardingComplete]);


    const refreshData = useCallback(async () => {
        if (!effectiveUserId) return;
        try {
            const [avgData, reviewsList] = await Promise.all([
                reviewService.getAverageRating("SELLER", effectiveUserId),
                reviewService.getTargetReviews("SELLER", effectiveUserId)
            ]);
            setRatingData(avgData);
            setBusinessReviews(reviewsList);
        } catch (err) {
            console.error("Error refreshing data:", err);
        }
    }, [effectiveUserId]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!effectiveUserId) return;
            try {
                setLoading(true);

                const vData = await verificationService.getUserVerification(effectiveUserId).catch(() => null);
                setVerificationDoc(vData);

                const paymentData = await (isOwnProfile && isStripeEligibleBusiness
                    ? paymentService.refreshSellerStatus(effectiveUserId).catch(() => paymentService.getSellerPaymentProfile(effectiveUserId).catch(() => null))
                    : paymentService.getSellerPaymentProfile(effectiveUserId).catch(() => null));
                setPaymentProfile(paymentData);

                await refreshData();

                const allListings = await listingService.getAllListings();
                setProducts(allListings.filter(l => l.ownerId === effectiveUserId));

            } catch (err) {
                console.error("Error loading business data", err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [effectiveUserId, isOwnProfile, isStripeEligibleBusiness, refreshData]);

    const handleOnboarding = async () => {
        try {
            if (!effectiveUserId) {
                throw new Error("Could not determine the seller user id for Stripe onboarding.");
            }
            await paymentService.createConnectedAccount(effectiveUserId);
            const res = await paymentService.createOnboardingLink(effectiveUserId);
            if (res?.url) {
                window.location.href = res.url; // redirect to Stripe
                return;
            }
            alert("Could not create Stripe onboarding link.");
        } catch (err) {
            console.error("Failed to start onboarding", err);
            alert(err?.message || "Failed to start Stripe onboarding.");
        }
    };

    const handleSellerReviewSubmit = async () => {
        const currentUserId = localStorage.getItem('userId');
        if (!newComment.trim()) return alert("Please write a comment.");
        try {
            await reviewService.createReview({
                targetId: effectiveUserId,
                targetType: "SELLER",
                rating: newRating,
                comment: newComment,
                isAnonymous: false,
                reviewerId: currentUserId
            });
            await refreshData();
            setShowReviewForm(false);
            setNewComment("");
        } catch (err) {
            console.error("Failed to submit review", err);
        }
    };

    const formattedRatings = businessReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        text: r.comment,
        reviewedAt: new Date(r.createdAt).toLocaleDateString(),
        itemName: r.targetType === "LISTING" ? "Product Review" : "Business Review",
        reviewerName: r.isAnonymous ? "Anonymous" : (r.reviewerName || "Verified Buyer"),
        reviewerId: r.reviewerId
    }));

    const handleDocumentResubmit = async () => {
        if (!resubmitFile) {
            setDocumentError("Please choose a document to resubmit.");
            return;
        }

        try {
            setResubmittingDocument(true);
            setDocumentError("");
            setDocumentNotice("");

            const updatedVerification = await settingsService.resubmitVerification({
                type: businessProfile?.businessType,
                document: resubmitFile,
            });

            setVerificationDoc(updatedVerification);
            setResubmitFile(null);
            setDocumentNotice("Document resubmitted. Staff review has been requested again.");
        } catch (err) {
            setDocumentError(err?.message || "Failed to resubmit document.");
        } finally {
            setResubmittingDocument(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* RESTORED: Documents Card */}
            <div className="card businessDocsCard">
                <div className="sectionTitle">Documents</div>
                <div className="businessDocRow">
                    <div className="businessDocTitle">Food Safety Certificate:</div>
                        <div className="businessDocMeta">
                        <div>
                            Status: <b style={{color: verificationStatus === "APPROVED" ? '#2e7d32' : verificationStatus === "REJECTED" ? '#b43a3a' : 'inherit'}}>{docStatus}</b>
                        </div>
                        {verificationDoc?.adminNotes && (
                            <div className="businessDocNotes">
                                Reason: {verificationDoc.adminNotes}
                            </div>
                        )}
                        {verificationDoc?.documentUrl && (
                            <a href={verificationDoc.documentUrl} target="_blank" rel="noreferrer" className="linkBtn">
                                View uploaded document
                            </a>
                        )}
                        {isOwnProfile && verificationStatus === "REJECTED" && (
                            <div className="businessDocResubmit">
                                <label className="businessDocUploadLabel">
                                    Upload replacement document
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={(event) => {
                                            setResubmitFile(event.target.files?.[0] || null);
                                            setDocumentError("");
                                            setDocumentNotice("");
                                        }}
                                    />
                                </label>
                                {resubmitFile ? <div className="businessDocFileName">{resubmitFile.name}</div> : null}
                                {documentError ? <div className="inputError">{documentError}</div> : null}
                                {documentNotice ? <div className="businessDocNotice">{documentNotice}</div> : null}
                                <button
                                    type="button"
                                    onClick={handleDocumentResubmit}
                                    className="linkBtn"
                                    disabled={resubmittingDocument}
                                >
                                    {resubmittingDocument ? "Submitting..." : "Resubmit document"}
                                </button>
                            </div>
                        )}
                        {isOwnProfile && isStripeEligibleBusiness && (
                            <div style={{ marginTop: "8px", fontSize: "12px" }}>
                                Stripe:{" "}
                                <b style={{ color: paymentProfile?.onboardingComplete ? "#2e7d32" : "#999" }}>
                                    {paymentProfile?.onboardingComplete
                                        ? "Ready to receive payments"
                                        : "Not connected"}
                                </b>
                            </div>
                        )}
                        {stripeNotice && (
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "#2e7d32" }}>
                                {stripeNotice}
                            </div>
                        )}
                        {isOwnProfile && !isStripeEligibleBusiness && (
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                                Stripe onboarding is available for FARMER and RESTAURANT profiles.
                            </div>
                        )}
                        {isOwnProfile && isStripeEligibleBusiness && !paymentProfile?.onboardingComplete && (
                            <button
                                onClick={handleOnboarding}
                                className="linkBtn"
                                style={{ marginTop: "8px", display: "inline-block" }}
                            >
                                Complete Stripe Onboarding
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* RESTORED: Full Statistics */}
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
                    <div className="statBox">
                        <div className="statValue">{ratingData.averageRating > 0 ? ratingData.averageRating.toFixed(1) : "0.0"} ★</div>
                        <div className="statLabel">average rating</div>
                    </div>
                </div>
            </div>

            {/* PRODUCT GRID SECTION */}
            <div className="card businessProductsCard">
                <div className="sectionTitle">{isRestaurant ? "Promotions" : "Products"}</div>
                <div className="productGrid">
                    {products.map((p) => (
                        <div key={p.listingId || p.id} className="productCard">
                            <img src={p.imageUrls?.[0] || "https://via.placeholder.com/120x90"} className="productImg" alt={p.title} />
                            <div className="productInfo">
                                <div className="productName">{p.title}</div>
                                <div className="productDesc">{p.description}</div>
                                <button
                                    type="button"
                                    className="linkBtn productCardLink"
                                    onClick={() => navigate(`/product/${p.listingId || p.id}`)}
                                >
                                    View listing
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* REVIEW FORM */}
            {!isOwnProfile && (
                <div className="card" style={{ padding: '20px', background: '#F9FAFB', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>Rate this Seller</h3>
                        <button onClick={() => setShowReviewForm(!showReviewForm)} className="linkBtn">{showReviewForm ? "Cancel" : "Write a Review"}</button>
                    </div>
                    {showReviewForm && (
                        <div style={{ padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '15px' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button key={s} onClick={() => setNewRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Star size={30} fill={s <= newRating ? "#FFB400" : "none"} stroke={s <= newRating ? "#FFB400" : "#999"} />
                                    </button>
                                ))}
                            </div>
                            <textarea placeholder="Your experience..." value={newComment} onChange={e => setNewComment(e.target.value)} style={{ width: '100%', height: '80px', padding: '10px', marginBottom: '10px' }} />
                            <button onClick={handleSellerReviewSubmit} style={{ width: '100%', padding: '10px', background: '#ff9800', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>Submit Review</button>
                        </div>
                    )}
                </div>
            )}

            <RatingsReviews fullName={businessProfile?.businessName || "Business"} ratings={formattedRatings} />
        </div>
    );
}
