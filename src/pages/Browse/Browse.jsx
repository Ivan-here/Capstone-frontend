import React, { useState, useEffect } from 'react';
import { Filter, Search, Star, Store, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '@/services/listing.service.js';
import { reviewService } from '@/services/reviewService.js';
import { BROWSE_CATEGORY_OPTIONS } from '@/constants/listingCategories.js';
import './Browse.css';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// NEW: Helper function to truncate long descriptions
const truncateText = (text, maxLength = 80) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength).trim() + "..." : text;
};

const formatRating = (rating) => {
    const value = Number(rating || 0);
    return value > 0 ? value.toFixed(1) : "New";
};

const Browse = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilter, setShowFilter] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true);

                // --- THE FIX ---
                // We ALWAYS pass "SHOPPER" to force the backend to return the universal public feed.
                // This guarantees we only get Farm items + half-life crossed Restaurant items.
                const data = await listingService.getAllListings("SHOPPER");

                console.log("RAW BACKEND DATA:", data);

                const mappedData = await Promise.all(data.map(async (item) => {
                    const firstImage = item.imageUrls && item.imageUrls.length > 0
                        ? item.imageUrls[0]
                        : "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80";

                    const listingId = item.listingId || item.id;
                    const ratingData = listingId
                        ? await reviewService.getAverageRating("LISTING", listingId)
                        : { averageRating: 0, totalReviews: 0 };

                    return {
                        ...item,
                        id: listingId,
                        imageUrl: firstImage,
                        expiryDate: formatDate(item.expiryDate),
                        sellerName: item.businessName || "Local seller",
                        averageRating: Number(ratingData?.averageRating || 0),
                        totalReviews: Number(ratingData?.totalReviews || 0),
                        // If it's on this page and price is 0, it's a donation that crossed the half-life
                        tag: item.price === 0 ? "Donation !" : ""
                    };
                }));

                setListings(mappedData);
                setLoading(false);
            } catch (err) {
                console.error("Error loading listings:", err);
                setError("Could not load products.");
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    const toggleCategory = (category) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(prev => prev.filter(c => c !== category));
        } else {
            setSelectedCategories(prev => [...prev, category]);
        }
    };

    const filteredListings = listings.filter(item => {
        const safeTitle = item.title || "";
        const normalizedSearch = searchTerm.toLowerCase();
        const matchesSearch =
            safeTitle.toLowerCase().includes(normalizedSearch) ||
            String(item.category || "").toLowerCase().includes(normalizedSearch);

        let matchesCategory = true;
        if (selectedCategories.length > 0) {
            const itemCat = String(item.category || "").toLowerCase();
            matchesCategory = selectedCategories.some((category) => category.toLowerCase() === itemCat);
        }
        return matchesSearch && matchesCategory;
    });

    const formatQuantityText = (qty, unit) => {
        if (!unit) return qty;
        return (unit.toLowerCase() === 'each' || unit.toLowerCase() === 'item')
            ? `${qty} available`
            : `${qty} ${unit}`;
    };

    if (loading) return <div className="browse-wrapper center-content"><h2>Loading Fresh Products...</h2></div>;
    if (error) return <div className="browse-wrapper center-content"><h2>{error}</h2></div>;

    return (
        <div className="browse-wrapper">
            <div className={`filter-sidebar ${showFilter ? 'visible' : 'hidden'}`}>
                <div className="filter-header">
                    <div className="flex items-center gap-2">
                        <Filter size={20}/>
                        <h2>FILTERS</h2>
                    </div>
                    <button onClick={() => setShowFilter(false)} className="close-btn"><X size={20}/></button>
                </div>
                <div className="filter-scroll-area">
                    <div className="filter-group">
                        <h3>Category</h3>
                        <div className="filter-checkbox-grid">
                            {BROWSE_CATEGORY_OPTIONS.map((cat) => (
                                <label key={cat} className={`filter-checkbox-card ${selectedCategories.includes(cat) ? 'is-selected' : ''}`}>
                                    <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} />
                                    <span>{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button className="btn-secondary full-width" onClick={() => { setSearchTerm(""); setSelectedCategories([]); }}>Reset All</button>
                    </div>
                </div>
            </div>

            <div className="browse-container">
                <div className="browse-header">
                    {!showFilter && (
                        <button className="filter-circle-btn" onClick={() => setShowFilter(true)}>
                            <Filter size={20} color="#2D2D2D"/>
                        </button>
                    )}
                    <div className="search-capsule">
                        <Search size={20} className="search-icon"/>
                        <input type="text" placeholder="search (e.g. cucumbers)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="product-grid">
                    {filteredListings.length === 0 ? (
                        <div style={{gridColumn: "1/-1", textAlign: "center", marginTop: "40px", color: "#666"}}>
                            <h3>No public products available right now.</h3>
                        </div>
                    ) : (
                        filteredListings.map((item) => (
                            <div key={item.id} className="product-tile" onClick={() => navigate(`/product/${item.id}`)} style={{ cursor: 'pointer' }}>

                                {item.tag && <div className="tile-tag">{item.tag}</div>}

                                <div className="tile-content">
                                    <div className="tile-image">
                                        <img src={item.imageUrl} alt={item.title || "Product Image"} style={{ objectFit: 'cover' }} />
                                    </div>
                                    <div className="tile-info">
                                        <h3>{item.title || "Unnamed Product"}</h3>
                                        <div className="tile-meta-row">
                                            {item.category ? <div className="tile-category">{item.category}</div> : null}
                                            <div className="tile-rating" aria-label={`${formatRating(item.averageRating)} star rating`}>
                                                <Star size={13} fill="currentColor" />
                                                <span>{formatRating(item.averageRating)}</span>
                                                {item.totalReviews > 0 ? <span className="tile-review-count">({item.totalReviews})</span> : null}
                                            </div>
                                        </div>

                                        <div className="tile-seller">
                                            <Store size={13} />
                                            <span>{item.sellerName}</span>
                                        </div>

                                        {/* APPLIED TRUNCATION HERE */}
                                        <p className="tile-desc">
                                            {formatQuantityText(item.quantity, item.unit)}
                                            {item.description ? `, ${truncateText(item.description, 80)}` : ''}
                                        </p>

                                        {item.price === 0 && item.expiryDate && (
                                            <p style={{ fontWeight: '600', color: '#A03C3C', marginTop: '2px', fontSize: '0.8rem' }}>
                                                Available Until: {item.expiryDate}
                                            </p>
                                        )}
                                        <div className="tile-price">
                                            {item.price > 0 ? `$${Number(item.price).toFixed(2)}/${item.unit}` : "Free"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Browse;
