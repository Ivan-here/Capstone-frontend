import React, { useState, useEffect } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../services/listing.service';
import './Browse.css';

const Browse = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilter, setShowFilter] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);

    const navigate = useNavigate();

    // --- 1. DEFINE CATEGORY GROUPS ---
    // This connects your Filter Buttons (Keys) to your Backend Data (Values)
    const CATEGORY_GROUPS = {
        "Vegetables": ["vegetables", "veggies", "food", "farm_product"],
        "Fruits": ["fruits", "fruit", "food", "farm_product"],
        "Dairy": ["dairy", "milk", "cheese", "eggs"],
        "Baked Goods": ["bakery", "bread", "sourdough", "baked goods"]
    };

    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true);
                const data = await listingService.getAllListings();

                const mappedData = data.map(item => ({
                    ...item,
                    id: item.listingId || item.id,
                    // Fallback image logic
                    imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80",
                    tag: item.type === "SURPLUS_FOOD" ? "Donation !" : ""
                }));

                setListings(mappedData);
                setLoading(false);
            } catch (err) {
                console.error("Error loading listings:", err);
                setError("Could not load products. Is the Listing Service running?");
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

    // --- SMART FILTER LOGIC ---
    const filteredListings = listings.filter(item => {
        // 1. Search Filter
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Category Filter (The Smart Part)
        let matchesCategory = true;

        if (selectedCategories.length > 0) {
            // Check if the item's backend category exists in ANY of the selected filter groups
            matchesCategory = selectedCategories.some(filterName => {
                const allowedValues = CATEGORY_GROUPS[filterName] || [filterName.toLowerCase()];
                // We check if the item's category (e.g., "food") is in the allowed list for this filter
                return item.category && allowedValues.includes(item.category.toLowerCase());
            });
        }

        return matchesSearch && matchesCategory;
    });

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
                        {/* Render buttons for our defined Groups */}
                        {Object.keys(CATEGORY_GROUPS).map(cat => (
                            <label key={cat}>
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(cat)}
                                    onChange={() => toggleCategory(cat)}
                                /> {cat}
                            </label>
                        ))}
                    </div>

                    <div className="filter-actions">
                        <button className="btn-secondary full-width" onClick={() => {
                            setSearchTerm("");
                            setSelectedCategories([]);
                        }}>Reset All</button>
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
                        <input
                            type="text"
                            placeholder="search (e.g. cucumbers)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="product-grid">
                    {filteredListings.length === 0 ? (
                        <div style={{gridColumn: "1/-1", textAlign: "center", marginTop: "40px", color: "#666"}}>
                            <h3>No products match your search.</h3>
                        </div>
                    ) : (
                        filteredListings.map((item) => (
                            <div
                                key={item.id}
                                className="product-tile"
                                onClick={() => navigate(`/product/${item.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                {item.tag && <div className="tile-tag">{item.tag}</div>}
                                <div className="tile-content">
                                    <div className="tile-image">
                                        <img src={item.imageUrl} alt={item.title} />
                                    </div>
                                    <div className="tile-info">
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
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