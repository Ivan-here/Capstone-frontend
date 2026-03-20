import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { listingService } from '@/services/listing.service.js';
import { reviewService } from '@/services/reviewService.js';
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

    const userRole = localStorage.getItem('userRole') || 'CITIZEN';

    useEffect(() => {
        const loadPageData = async () => {
            try {
                setLoading(true);
                const [data, avgData, reviewList] = await Promise.all([
                    listingService.getListingById(id),
                    reviewService.getAverageRating("LISTING", id),
                    reviewService.getTargetReviews("LISTING", id)
                ]);

                const productImages = data.imageUrls?.length > 0
                    ? data.imageUrls
                    : ["https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80"];

                setProduct({
                    ...data,
                    images: productImages,
                    seller: {
                        name: data.businessName || "Local Partner",
                        id: data.ownerId
                    },
                    isNgoOnly: data.visibility === "NGO_ONLY"
                });

                setMainImage(productImages[0]);
                setRatingData(avgData);
                setReviews(reviewList);
                setLoading(false);
            } catch (err) {
                setError("Product not found.");
                setLoading(false);
            }
        };
        loadPageData();
    }, [id]);

    if (loading) return <div className="pd-wrapper center-content"><h2>Loading...</h2></div>;
    if (error) return <div className="pd-wrapper center-content"><h2>{error}</h2></div>;

    const isLocked = product.isNgoOnly && userRole !== 'NGO';

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
                    {/* Left Column: Gallery */}
                    <div className="pd-left-column">
                        <div className="gallery-wrapper">
                            <div className="thumbnails">
                                {product.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        className={`thumb ${mainImage === img ? 'active' : ''}`}
                                        onClick={() => setMainImage(img)}
                                        alt="thumb"
                                    />
                                ))}
                            </div>
                            <div className="main-image-box">
                                <img src={mainImage} alt={product.title} />
                                {product.isNgoOnly && <div className="pd-ngo-badge">NGO Exclusive</div>}
                            </div>
                        </div>

                        <div className="pd-buttons">
                            {!isLocked && (
                                <button className="btn-cart" onClick={() => { addToCart(product); setShowToast(true); setTimeout(()=>setShowToast(false), 3000); }}>
                                    {product.price === 0 ? "Claim Donation" : "Add to Basket"}
                                </button>
                            )}
                        </div>

                        {/* Reviews Section at bottom of left column or full width below */}
                        <div className="reviews-section">
                            <h3>Ratings and Reviews</h3>
                            {reviews.length === 0 ? (
                                <p className="review-text-inline">No reviews yet.</p>
                            ) : (
                                reviews.map(r => (
                                    <div key={r.id} className="review-user">
                                        <div className="review-text-inline"><b>{r.isAnonymous ? "Anonymous" : r.reviewerName}</b></div>
                                        <div className="stars-row">
                                            <StarRating rating={r.rating} size={16} />
                                            <span className="review-text-inline">{r.comment}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Info */}
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

                        {isLocked && (
                            <div className="pd-locked-message">
                                <Lock size={18}/>
                                <span>Reserved for verified NGOs.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;