import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
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
                const data = await listingService.getAllListings();

                // EXACT STRING MATCH TO BACKEND
                const myDonations = data.filter(item =>
                    item.ownerId === currentUserId && item.type === "SURPLUS_FOOD"
                );

                const mappedData = myDonations.map(item => ({
                    id: item.listingId || item.id,
                    title: item.title,
                    price: 0,
                    unit: item.unit,
                    quantity: item.quantity,
                    // Slice off the time so it just shows 'YYYY-MM-DD'
                    expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
                    description: item.description,
                    imageUrl: item.imageUrls && item.imageUrls.length > 0
                        ? item.imageUrls[0]
                        : "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80"
                }));

                setListings(mappedData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching restaurant hub listings:", err);
                setError("Could not load your inventory.");
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
                    <input type="text" placeholder="search your donations" />
                </div>
                <button className="add-product-btn" onClick={() => navigate('/add-surplus')}>
                    Add Donation
                </button>
            </div>

            {loading && <h3>Loading your donations...</h3>}
            {error && <h3 style={{color: 'red'}}>{error}</h3>}

            {!loading && !error && listings.length === 0 && (
                <h3>You haven't posted any donations yet.</h3>
            )}

            <div className="hub-listing-grid">
                {listings.map(item => (
                    <ListingCard
                        key={item.id}
                        item={item}
                        onDelete={() => handleDeleteTrigger(item)}
                        onEdit={() => navigate(`/edit-surplus/${item.id}`)}
                    />
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