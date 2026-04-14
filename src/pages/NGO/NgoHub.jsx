import React, { useState, useEffect } from 'react';
import { Search, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '@/services/listing.service.js';
import '../Browse/Browse.css'; // Uses existing Browse CSS

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

const NgoHub = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                setLoading(true);
                const data = await listingService.getAllListings("NGO");
                const mappedData = data
                    .filter(item =>
                        item.type &&
                        item.type.toUpperCase() === "SURPLUS_FOOD" &&
                        String(item.status || "").toUpperCase() === "ACTIVE" &&
                        Number(item.quantity || 0) > 0
                    )
                    .map(item => ({
                        ...item,
                        id: item.listingId || item.id,
                        imageUrl: item.imageUrls && item.imageUrls.length > 0
                            ? item.imageUrls[0]
                            : "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80",
                        expiryDate: formatDate(item.expiryDate)
                    }));
                setListings(mappedData);
            } catch (err) {
                console.error("NGO Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDonations();
    }, []);

    const filtered = listings.filter(l =>
        (l.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="browse-wrapper">
            <div className="browse-container">
                <div className="browse-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <h1 style={{ color: '#2D2D2D', margin: 0 }}>NGO Donation Hub</h1>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Exclusive early access to surplus food donations.</p>
                </div>

                <div className="browse-header">
                    <div className="search-capsule">
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search donations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="product-grid">
                    {loading ? (
                        <h3>Loading available donations...</h3>
                    ) : filtered.length === 0 ? (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#666" }}>
                            <h3>No active donations available at this time.</h3>
                        </div>
                    ) : (
                        filtered.map((item) => (
                            <div
                                key={item.id}
                                className="product-tile"
                                onClick={() => navigate(`/product/${item.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="tile-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#A03C3C' }}>
                                    <Heart size={14} fill="#A03C3C" /> NGO Priority
                                </div>

                                <div className="tile-content">
                                    <div className="tile-image">
                                        <img src={item.imageUrl} alt={item.title} />
                                    </div>
                                    <div className="tile-info">
                                        <h3>{item.title}</h3>

                                        {/* APPLIED TRUNCATION HERE */}
                                        <p className="tile-desc">
                                            {item.quantity} {item.unit}
                                            {item.description ? `, ${truncateText(item.description, 80)}` : ''}
                                        </p>

                                        {item.expiryDate && (
                                            <p style={{ color: '#A03C3C', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                                Expires: {item.expiryDate}
                                            </p>
                                        )}

                                        <div className="tile-price">Free</div>
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

export default NgoHub;