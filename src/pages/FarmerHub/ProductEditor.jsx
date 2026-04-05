import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, PencilLine, X } from 'lucide-react';
import { listingService } from '@/services/listing.service.js';
import { authService } from '@/services/auth.service.js';
import { paymentService } from '@/services/payment.service.js';
import { FARM_PRODUCT_CATEGORIES } from '@/constants/listingCategories.js';
import './ProductEditor.css';
import './editorOptions.css';

const ProductEditor = ({ mode = 'add' }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState('lb');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState(FARM_PRODUCT_CATEGORIES[0]);
    const [description, setDescription] = useState('');

    const [imageSlots, setImageSlots] = useState([null, null, null, null]);
    const [isSaving, setIsSaving] = useState(false);

    // NEW: State to hold our professional error message
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && id) {
            const loadListing = async () => {
                try {
                    const data = await listingService.getListingById(id);
                    setTitle(data.title || '');
                    setPrice(data.price || '');
                    setUnit(data.unit || 'lb');
                    setQuantity(data.quantity || '');
                    setCategory(data.category || FARM_PRODUCT_CATEGORIES[0]);
                    setDescription(data.description || '');

                    if (data.imageUrls && data.imageUrls.length > 0) {
                        const loadedSlots = [null, null, null, null];
                        data.imageUrls.forEach((url, i) => {
                            if (i < 4) loadedSlots[i] = url;
                        });
                        setImageSlots(loadedSlots);
                    }
                } catch (error) {
                    console.error("Failed to load product details", error);
                }
            };
            loadListing();
        }
    }, [id, mode]);

    const handleSlotChange = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const newSlots = [...imageSlots];
        newSlots[index] = file;
        setImageSlots(newSlots);
    };

    const handleRemoveImage = (index, e) => {
        e.preventDefault();
        const newSlots = [...imageSlots];
        newSlots[index] = null;
        setImageSlots(newSlots);
    };

    const handleSubmit = async () => {
        try {
            setIsSaving(true);
            setSubmitError(''); // Clear any previous errors

            // --- THE FIX: Frontend Validation ---
            if (!title.trim()) {
                setSubmitError("Title is required.");
                setIsSaving(false);
                return;
            }
            if (price === '' || parseFloat(price) < 0) {
                setSubmitError("Please enter a valid price (0 or greater).");
                setIsSaving(false);
                return;
            }
            if (!quantity || parseInt(quantity, 10) <= 0) {
                setSubmitError("Please enter a valid quantity.");
                setIsSaving(false);
                return;
            }
            if (!unit.trim()) {
                setSubmitError("Unit is required.");
                setIsSaving(false);
                return;
            }

            // Decode the token to get the real user
            const userPayload = authService.getUserPayload();
            const currentUserId = userPayload?.userId || userPayload?.sub;

            if (!currentUserId) {
                setSubmitError("You must be logged in to save a product.");
                setIsSaving(false);
                return;
            }

            if (mode === 'add') {
                const paymentProfile = await paymentService.refreshSellerStatus(currentUserId).catch(() => null);
                const isReadyForPayments = Boolean(
                    paymentProfile?.onboardingComplete &&
                    paymentProfile?.chargesEnabled &&
                    paymentProfile?.payoutsEnabled
                );

                if (!isReadyForPayments) {
                    setSubmitError("Complete payment onboarding before posting farm listings.");
                    setIsSaving(false);
                    return;
                }
            }

            const retainedImages = [];
            const newFiles = [];

            imageSlots.forEach(slot => {
                if (typeof slot === 'string') {
                    retainedImages.push(slot);
                } else if (slot instanceof File) {
                    newFiles.push(slot);
                }
            });

            const listingData = {
                title,
                price: parseFloat(price),
                unit,
                quantity: parseInt(quantity, 10),
                category: category,
                description,
                type: "FARM_PRODUCT",
                ownerId: currentUserId,
                businessName: userPayload?.displayName || userPayload?.username || "My Farm",
                retainedImages: retainedImages
            };

            const formData = new FormData();
            formData.append("listing", new Blob([JSON.stringify(listingData)], {
                type: "application/json"
            }));

            newFiles.forEach(file => {
                formData.append("images", file);
            });

            if (mode === 'edit') {
                await listingService.updateListing(id, formData);
            } else {
                await listingService.createFarmListing(formData);
            }

            navigate('/farmer-hub');
        } catch (error) {
            console.error("Error saving product:", error);

            let errorMessage = error.message;

            // --- THE FIX: Clean up raw Spring Boot JSON errors ---
            if (errorMessage.startsWith('{') && errorMessage.includes('"status":400')) {
                errorMessage = "Please ensure all required fields are filled out correctly.";
            } else if (errorMessage.includes("VERIFIED business")) {
                errorMessage = "Your business profile is pending verification. You can post products once an admin approves your account.";
            } else if (errorMessage.includes("complete payment onboarding")) {
                errorMessage = "Complete payment onboarding before posting farm listings.";
            }

            setSubmitError(errorMessage || "An unexpected error occurred. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderPreview = (slotData) => {
        if (typeof slotData === 'string') return slotData;
        if (slotData instanceof File) return URL.createObjectURL(slotData);
        return null;
    };

    return (
        <div className="editor-page">

            <div className="editor-main-container">
                <div className="editor-card">
                    <div className="editor-grid">

                        <div className="image-section">
                            {/* MAIN IMAGE SLOT (Index 0) */}
                            <label className="main-upload-label" style={{ position: 'relative' }}>
                                {imageSlots[0] ? (
                                    <>
                                        <img src={renderPreview(imageSlots[0])} alt="Main" className="main-preview" />
                                        <button className="remove-img-btn" onClick={(e) => handleRemoveImage(0, e)}>
                                            <X size={20} color="white" />
                                        </button>
                                    </>
                                ) : (
                                    <ImagePlus size={60} color="#666" />
                                )}
                                <input type="file" hidden onChange={(e) => handleSlotChange(0, e)} accept="image/*" />
                            </label>

                            {/* THUMBNAIL SLOTS (Indexes 1, 2, 3) */}
                            <div className="thumbnail-slots">
                                {[1, 2, 3].map((slotIndex) => (
                                    <label key={slotIndex} className="small-upload-slot" style={{ position: 'relative', cursor: 'pointer' }}>
                                        {imageSlots[slotIndex] ? (
                                            <>
                                                <img src={renderPreview(imageSlots[slotIndex])} alt={`Thumb ${slotIndex}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                <button className="remove-img-btn-small" onClick={(e) => handleRemoveImage(slotIndex, e)}>
                                                    <X size={14} color="white" />
                                                </button>
                                            </>
                                        ) : (
                                            <ImagePlus size={24} color="#666" />
                                        )}
                                        <input type="file" hidden onChange={(e) => handleSlotChange(slotIndex, e)} accept="image/*" />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* FORM SECTION */}
                        <div className="form-section">
                            <div className="input-row">
                                <label>Title:</label>
                                <div className="input-with-icon">
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cherries" />
                                    <PencilLine size={18} />
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Price ($):</label>
                                <div className="input-with-icon">
                                    <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1.99" />
                                    <PencilLine size={18} />
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Unit:</label>
                                <div className="input-with-icon">
                                    <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="lb, kg, pack" />
                                    <PencilLine size={18} />
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Quantity:</label>
                                <div className="input-with-icon">
                                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 50" />
                                    <PencilLine size={18} />
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Category:</label>
                                <div className="editor-select-wrap">
                                    <select className="editor-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                        {FARM_PRODUCT_CATEGORIES.map((item) => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="textarea-group">
                                <label>Product Description:</label>
                                <div className="textarea-with-icon">
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product..." />
                                    <PencilLine size={18} className="text-icon" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="editor-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>

                        {/* THE FIX: Professional Error Banner */}
                        {submitError && (
                            <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '10px 15px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', border: '1px solid #ef5350', width: '100%', textAlign: 'center' }}>
                                {submitError}
                            </div>
                        )}

                        <button className="btn-submit-product" onClick={handleSubmit} disabled={isSaving}>
                            {isSaving ? 'Saving...' : (mode === 'add' ? 'Add product' : 'Save Changes')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductEditor;
