import React, { useState, useEffect } from 'react';
import { Search, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '@/services/listing.service.js';
import { authService } from '@/services/auth.service.js';
import ListingCard from './ListingCard';
import DeletePopup from './DeletePopup';
import './FarmerHub.css';

const FarmerHub = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Grab the real user data from the JWT token
    const userPayload = authService.getUserPayload();
    const currentUserId = userPayload?.userId || userPayload?.sub;

    useEffect(() => {
        const fetchFarmerListings = async () => {
            try {
                // If there's no logged-in user, stop here
                if (!currentUserId) {
                    setError("You must be logged in to view your hub.");
                    setLoading(false);
                    return;
                }

                setLoading(true);
                // Fetch all listings from your backend
                const data = await listingService.getAllListings();

                // 1. Filter to only show THIS farmer's listings
                const myProducts = data.filter(item => item.ownerId === currentUserId);

                // 2. Map the data to pull the Cloudinary images
                const mappedData = myProducts.map(item => ({
                    id: item.listingId || item.id,
                    title: item.title,
                    price: item.price,
                    unit: item.unit,
                    description: item.description,
                    imageUrl: item.imageUrls && item.imageUrls.length > 0
                        ? item.imageUrls[0]
                        : "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80"
                }));

                setListings(mappedData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching farmer hub listings:", err);
                setError("Could not load your inventory. Is the Listing Service running?");
                setLoading(false);
            }
        };

        fetchFarmerListings();
    }, [currentUserId]);

    const handleDeleteTrigger = (item) => {
        setSelectedItem(item);
        setShowDelete(true);
    };

    const handleConfirmDelete = async (id) => {
        try {
            // Call the existing PATCH /close endpoint (soft delete)
            await listingService.closeListing(id);

            // Remove it from the local React state so it vanishes from the grid
            setListings(prevListings => prevListings.filter(item => item.id !== id));

            // Close the popup
            setShowDelete(false);
        } catch (error) {
            console.error("Error closing listing:", error);
            alert("Failed to delete the listing.");
        }
    };

    return (
        <div className="hub-internal-container">
            <div className="hub-toolbar">
                <div className="hub-search-input">
                    <Search size={20} color="#666" />
                    <input type="text" placeholder="search your products" />
                </div>
                <button className="add-product-btn" onClick={() => navigate('/add-product')}>
                    Add product
                </button>
            </div>

            {loading && <h3>Loading your inventory...</h3>}
            {error && <h3 style={{color: 'red'}}>{error}</h3>}

            {!loading && !error && listings.length === 0 && (
                <h3>You haven't added any products yet.</h3>
            )}

            <div className="hub-listing-grid">
                {listings.map(item => (
                    <ListingCard
                        key={item.id}
                        item={item}
                        onDelete={() => handleDeleteTrigger(item)}
                        onEdit={() => navigate(`/edit-product/${item.id}`)}
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

export default FarmerHub;