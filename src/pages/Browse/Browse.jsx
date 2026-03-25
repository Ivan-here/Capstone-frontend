import React, { useState, useEffect } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '@/services/listing.service.js';
import './Browse.css';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const Browse = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilter, setShowFilter] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const navigate = useNavigate();

    // COMBINED CATEGORIES: Includes both Farm and Restaurant categories
    const CATEGORY_GROUPS = {
        "Produce & Fresh": ["vegetables", "veggies", "fruits", "fruit", "fresh ingredients"],
        "Dairy & Eggs": ["dairy", "milk", "cheese", "eggs"],
        "Bakery & Meals": ["bakery", "bread", "baked goods", "prepared meals"],
        "Pantry": ["canned/packaged", "pantry"]
    };

    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true);

                // --- THE FIX ---
                // We ALWAYS pass "SHOPPER" to force the backend to return the universal public feed.
                // This guarantees we only get Farm items + half-life crossed Restaurant items.
                const data = await listingService.getAllListings("SHOPPER");

                console.log("RAW BACKEND DATA:", data);

                const mappedData = data.map(item => {
                    const firstImage = item.imageUrls && item.imageUrls.length > 0
                        ? item.imageUrls[0]
                        : "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80";

                    return {
                        ...item,
                        id: item.listingId || item.id,
                        imageUrl: firstImage,
                        expiryDate: formatDate(item.expiryDate),
                        // If it's on this page and price is 0, it's a donation that crossed the half-life
                        tag: item.price === 0 ? "Donation !" : ""
                    };
                });

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
        const matchesSearch = safeTitle.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesCategory = true;
        if (selectedCategories.length > 0) {
            matchesCategory = selectedCategories.some(filterName => {
                const allowedValues = CATEGORY_GROUPS[filterName] || [];
                const itemCat = item.category || "";
                return allowedValues.includes(itemCat.toLowerCase());
            });
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
                        {Object.keys(CATEGORY_GROUPS).map(cat => (
                            <label key={cat}>
                                <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} /> {cat}
                            </label>
                        ))}
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
                                        <p>{formatQuantityText(item.quantity, item.unit)}{item.description ? `, ${item.description}` : ''}</p>

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