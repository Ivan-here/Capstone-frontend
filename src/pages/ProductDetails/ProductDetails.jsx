import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { listingService } from '@/services/listing.service.js';
import { reviewService } from '@/services/reviewService.js';
import { profileService } from '@/services/profile.service.js';
import StarRating from '../myOrders/StarRating.jsx';
import { useCart } from '../cart/CartContext.jsx';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mainImage, setMainImage] = useState("");
    const [showToast, setShowToast] = useState(false);

    const [reviews, setReviews] = useState([]);
    const [ratingData, setRatingData] = useState({ averageRating: 0, totalReviews: 0 });

    const [isVerifiedNgo, setIsVerifiedNgo] = useState(false);
    const rawRole = localStorage.getItem('userRole');
    const isNgo = rawRole && rawRole.toUpperCase() === 'NGO';

    const loadReviewsOnly = useCallback(async () => {
        try {
            const [avgData, reviewList] = await Promise.all([
                reviewService.getAverageRating("LISTING", id),
                reviewService.getTargetReviews("LISTING", id)
            ]);
            setRatingData(avgData);
            setReviews(reviewList);
        } catch (err) {
            console.error("Failed to refresh reviews:", err);
        }
    }, [id]);

    useEffect(() => {
        const loadPageData = async () => {
            try {
                setLoading(true);

                const data = await listingService.getListingById(id);
                await loadReviewsOnly();

                const productImages = data.imageUrls && data.imageUrls.length > 0
                    ? data.imageUrls
                    : ["https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80"];

                setProduct({
                    ...data,
                    // EXTREME DEFENSE: Ensure the cart always has every possible ID key so nothing gets lost!
                    id: data.listingId || data.id || id,
                    listingId: data.listingId || data.id || id,
                    productId: data.listingId || data.id || id,

                    images: productImages,
                    seller: {
                        name: data.businessName || "Local Partner",
                        id: data.ownerId
                    },
                    isNgoOnly: data.visibility === "NGO_ONLY"
                });

                setMainImage(productImages[0]);

                if (isNgo) {
                    try {
                        const profileData = await profileService.getMe();
                        const verified = profileData?.businessProfile?.verified === true;
                        setIsVerifiedNgo(verified);
                        localStorage.setItem('isVerified', String(verified));
                    } catch (profileErr) {
                        setIsVerifiedNgo(localStorage.getItem('isVerified') === 'true');
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error("Fetch error:", err);
                setError("Product not found.");
                setLoading(false);
            }
        };
        loadPageData();
    }, [id, isNgo, loadReviewsOnly]);

    if (loading) return <div className="pd-wrapper center-content"><h2>Loading...</h2></div>;
    if (error) return <div className="pd-wrapper center-content"><h2>{error}</h2></div>;

    const isLocked = product.isNgoOnly && (!isNgo || !isVerifiedNgo);
    const isUnavailable = String(product.status || "").toUpperCase() !== "ACTIVE" || Number(product.quantity || 0) <= 0;

    return (
        <div className="pd-wrapper">
            {showToast && (
                <div className="toast-notification">
                    <CheckCircle className="toast-success-icon" size={20} />
                    <span>Added to your basket!</span>
                </div>
            )}

            <div className="pd-container">
                <button onClick={() => navigate(-1)} className="back-link">
                    <ArrowLeft size={18} />
                    <span>Back to Browse</span>
                </button>

                <div className="pd-content">
                    <div className="pd-left-column">
                        <div className="gallery-wrapper">
                            <div className="thumbnails">
                                {product.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        className={`thumb ${mainImage === img ? 'active' : ''}`}
                                        onClick={() => setMainImage(img)}
                                        alt="thumbnail"
                                    />
                                ))}
                            </div>
                            <div className="main-image-box">
                                <img src={mainImage} alt={product.title} />
                            </div>
                        </div>

                        <div className="pd-buttons">
                            {!isLocked && !isUnavailable ? (
                                <button className="btn-cart" onClick={() => { addToCart(product); setShowToast(true); setTimeout(()=>setShowToast(false), 3000); }}>
                                    {product.price === 0 ? "Claim Donation" : "Add to Basket"}
                                </button>
                            ) : isUnavailable ? (
                                <div className="pd-locked-message" style={{ marginTop: '0' }}>
                                    <Lock size={18}/>
                                    <span>This listing is no longer available.</span>
                                </div>
                            ) : (
                                <div className="pd-locked-message" style={{ marginTop: '0' }}>
                                    <Lock size={18}/>
                                    <span>Claiming reserved for verified NGOs.</span>
                                </div>
                            )}
                        </div>

                        <div className="reviews-section">
                            <h3>Ratings and Reviews</h3>
                            {reviews.length === 0 ? (
                                <p className="review-text-inline">No reviews yet.</p>
                            ) : (
                                reviews.map(r => (
                                    <div key={r.id} className="review-user" style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                        <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <button
                                                className="link-text"
                                                onClick={() => navigate(`/profile/${r.reviewerId}`)}
                                                style={{ fontWeight: 'bold', fontSize: '1rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#4a7c59' }}
                                            >
                                                {r.isAnonymous ? "Anonymous" : (r.reviewerName || "Verified Buyer")}
                                            </button>
                                            <span style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="stars-row" style={{ marginTop: '5px' }}>
                                            <StarRating rating={r.rating} size={16} />
                                            <p className="review-text-inline" style={{ marginTop: '5px' }}>{r.comment}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pd-right-column">
                        <h1 className="pd-title">{product.title}</h1>

                        <div className="rating-row">
                            <StarRating rating={ratingData.averageRating} size={20} />
                            <span className="rating-number">
                                {ratingData.averageRating > 0 ? ratingData.averageRating.toFixed(1) : "New"}
                                ({ratingData.totalReviews} reviews)
                            </span>
                        </div>

                        <div className="pd-price">
                            {product.price > 0 ? `$${product.price}/${product.unit}` : "Free Donation"}
                        </div>

                        <div className="pd-meta-row">
                            <span className="pd-meta-label">Available</span>
                            <span className="pd-meta-value">
                                {product.quantity != null
                                    ? `${product.quantity} ${product.unit || "items"}`
                                    : "Quantity unavailable"}
                            </span>
                        </div>

                        <div className="info-block">
                            <h2>About this product</h2>
                            <p>{product.description}</p>
                        </div>

                        <div className="info-block">
                            <h2>Seller Information</h2>
                            <p><b>{product.seller.name}</b></p>

                            <button
                                className="link-text"
                                onClick={() => navigate(`/profile/${product.seller.id}`)}
                            >
                                View {product.seller.name}'s profile →
                            </button>
                        </div>

                        {isLocked && !isUnavailable && (
                            <div className="pd-locked-message">
                                <Lock size={18}/>
                                <span>This item is currently reserved for verified NGOs.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
