import React, { useState, useEffect } from 'react';
import { Search, Users, ShieldCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '@/services/listing.service.js';
import { authService } from '@/services/auth.service.js';
import ListingCard from '../FarmerHub/ListingCard';
import DeletePopup from '../FarmerHub/DeletePopup';
import '../FarmerHub/FarmerHub.css';

const RestaurantHub = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const userPayload = authService.getUserPayload();
    const currentUserId = userPayload?.userId || userPayload?.sub;

    useEffect(() => {
        const fetchSurplusListings = async () => {
            try {
                if (!currentUserId) {
                    setError("You must be logged in to view your hub.");
                    setLoading(false);
                    return;
                }

                setLoading(true);

                // --- UPDATE: Pass currentUserId to backend to bypass NGO_ONLY filters ---
                const data = await listingService.getAllListings("RESTAURANT", currentUserId);

                // Filter to ensure only your donations are displayed
                const myDonations = data.filter(item =>
                    String(item.ownerId) === String(currentUserId)
                );

                const mappedData = myDonations.map(item => {
                    // Check if the item is currently in the exclusive NGO phase
                    const isNgoOnly = item.visibility === "NGO_ONLY";

                    return {
                        id: item.listingId || item.id,
                        title: item.title,
                        price: 0,
                        unit: item.unit,
                        quantity: item.quantity,
                        expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
                        description: item.description,
                        isNgoOnly: isNgoOnly, // State for the UI badge
                        imageUrl: item.imageUrls && item.imageUrls.length > 0
                            ? item.imageUrls[0]
                            : "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80"
                    };
                });

                setListings(mappedData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching restaurant hub listings:", err);
                setError("Could not load your inventory. Please ensure you are a verified business.");
                setLoading(false);
            }
        };

        fetchSurplusListings();
    }, [currentUserId]);

    const handleDeleteTrigger = (item) => {
        setSelectedItem(item);
        setShowDelete(true);
    };

    const handleConfirmDelete = async (id) => {
        try {
            await listingService.closeListing(id);
            setListings(prevListings => prevListings.filter(item => item.id !== id));
            setShowDelete(false);
        } catch (error) {
            console.error("Error closing listing:", error);
            alert("Failed to delete the donation.");
        }
    };

    return (
        <div className="hub-internal-container">
            <div className="hub-toolbar">
                <div className="hub-search-input">
                    <Search size={20} color="#666" />
                    <input type="text" placeholder="Search your donations..." />
                </div>
                <button className="add-product-btn" onClick={() => navigate('/add-surplus')}>
                    Add Donation
                </button>
            </div>

            {loading && <h3>Loading your donations...</h3>}
            {error && <div className="error-banner"><ShieldCheck size={18} /> {error}</div>}

            {!loading && !error && listings.length === 0 && (
                <div className="empty-hub">
                    <h3>You haven't posted any donations yet.</h3>
                    <p>Surplus food shared here will be prioritized for NGOs first.</p>
                </div>
            )}

            <div className="hub-listing-grid">
                {listings.map(item => (
                    <div key={item.id} className="card-wrapper" style={{ position: 'relative' }}>
                        {/* --- NGO ONLY BADGE: Visible only when in the exclusive phase --- */}
                        {item.isNgoOnly && (
                            <div className="ngo-badge">
                                <Users size={12} />
                                <span>NGO ONLY</span>
                                <div className="tooltip">
                                    <Clock size={10} /> Hidden from Public until Half-Life reached.
                                </div>
                            </div>
                        )}

                        <ListingCard
                            item={item}
                            onDelete={() => handleDeleteTrigger(item)}
                            onEdit={() => navigate(`/edit-surplus/${item.id}`)}
                        />
                    </div>
                ))}
            </div>

            {showDelete && (
                <DeletePopup
                    item={selectedItem}
                    onCancel={() => setShowDelete(false)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
};

export default RestaurantHub;