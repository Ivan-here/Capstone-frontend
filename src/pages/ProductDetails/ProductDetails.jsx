import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, CheckCircle } from 'lucide-react';
import { listingService } from '../../services/listing.service';
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

    // 1. Toast State (Keep this!)
    const [showToast, setShowToast] = useState(false);

    // --- FETCH DATA (Listing Only) ---
    useEffect(() => {
        const loadPageData = async () => {
            try {
                setLoading(true);

                // Fetch Listing
                const data = await listingService.getListingById(id);

                // Map Data (Simple Seller Name based on ID)
                const mappedProduct = {
                    id: data.listingId || data.id,
                    title: data.title,
                    price: data.price,
                    unit: data.unit,
                    description: data.description,
                    rating: 4.5,
                    seller: {
                        // Just show the ID for now
                        name: `Seller #${data.ownerId ? data.ownerId.substring(0,6) : "Unknown"}`,
                        bio: "This seller is verified and uses sustainable farming practices."
                    },
                    images: [
                        data.imageUrl || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80",
                        "https://images.unsplash.com/photo-1605252814868-6c07156d9539?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&w=150&q=80"
                    ]
                };

                setProduct(mappedProduct);
                setMainImage(mappedProduct.images[0]);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Product not found or service is down.");
                setLoading(false);
            }
        };

        if (id) loadPageData();
    }, [id]);

    // 2. Handle Add to Cart with Toast
    const handleAddToCart = () => {
        addToCart(product);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000); // Hide after 3 seconds
    };

    if (loading) return <div className="pd-wrapper center-content"><h2>Loading details...</h2></div>;
    if (error) return <div className="pd-wrapper center-content"><h2>{error}</h2></div>;
    if (!product) return null;

    return (
        <div className="pd-wrapper">

            {/* 3. TOAST NOTIFICATION POPUP */}
            {showToast && (
                <div className="toast-notification">
                    <CheckCircle size={20} className="toast-success-icon" />
                    <span>Successfully added to cart!</span>
                </div>
            )}

            <div className="pd-container">
                <button onClick={() => navigate(-1)} className="back-link">
                    <ArrowLeft size={20} /> Back to Browse
                </button>

                <div className="pd-content">
                    {/* LEFT COLUMN */}
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
                                <img src={mainImage} alt="Main Product" />
                            </div>
                        </div>

                        <div className="pd-buttons">
                            <button
                                className="btn-buy"
                                onClick={() => {
                                    addToCart(product);
                                    navigate('/cart');
                                }}
                            >
                                Buy Now
                            </button>

                            <button
                                className="btn-cart"
                                onClick={handleAddToCart} // <--- Uses the Toast function
                            >
                                Add to cart
                            </button>
                        </div>

                        <div className="reviews-section">
                            <h3>Ratings and Reviews</h3>
                            <div className="review-user">
                                <span className="font-bold">Happy Customer</span>
                                <div className="stars-row">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="#FFD700" stroke="none"/>)}
                                    <span className="review-text-inline">Great quality!</span>
                                </div>
                            </div>
                            <button className="see-more">See more</button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="pd-right-column">
                        <h1 className="pd-title">{product.title}</h1>

                        <div className="rating-row">
                            <div className="stars">
                                {[1,2,3,4].map(i => <Star key={i} size={18} fill="#FFD700" stroke="none"/>)}
                                <Star size={18} stroke="#FFD700" fill="#FFD700" style={{clipPath: 'inset(0 50% 0 0)'}} />
                            </div>
                            <span className="rating-number">{product.rating} &rarr;</span>
                        </div>

                        <div className="pd-price">
                            {product.price > 0 ? `$${product.price}/${product.unit}` : "Free"}
                        </div>

                        <div className="info-block">
                            <h2>About this product</h2>
                            <p>{product.description}</p>
                        </div>

                        <div className="info-block">
                            <h2>Seller Information</h2>
                            <p>{product.seller.bio}</p>
                            <button className="link-text">
                                View {product.seller.name}'s profile &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;