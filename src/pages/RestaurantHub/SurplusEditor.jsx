import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, PencilLine, X } from 'lucide-react';
import { listingService } from '@/services/listing.service.js';
import { authService } from '@/services/auth.service.js';
import { SURPLUS_FOOD_CATEGORIES } from '@/constants/listingCategories.js';
import { prepareListingImages } from '@/utils/listingImages.js';
import '../FarmerHub/ProductEditor.css';
import '../FarmerHub/editorOptions.css';

function toDateTimeLocalValue(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const SurplusEditor = ({ mode = 'add' }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('kg');
    const [category, setCategory] = useState(SURPLUS_FOOD_CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    const [imageSlots, setImageSlots] = useState([null, null, null, null]);
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && id) {
            const loadListing = async () => {
                try {
                    const data = await listingService.getListingById(id);
                    setTitle(data.title || '');
                    setQuantity(data.quantity || '');
                    setUnit(data.unit || 'kg');
                    setCategory(data.category || SURPLUS_FOOD_CATEGORIES[0]);
                    setDescription(data.description || '');

                    if (data.expiryDate) {
                        setExpiryDate(toDateTimeLocalValue(data.expiryDate));
                    }

                    if (data.imageUrls && data.imageUrls.length > 0) {
                        const loadedSlots = [null, null, null, null];
                        data.imageUrls.forEach((url, i) => {
                            if (i < 4) loadedSlots[i] = url;
                        });
                        setImageSlots(loadedSlots);
                    }
                } catch (error) {
                    console.error("Failed to load surplus details", error);
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
            setSubmitError('');

            // --- THE FIX: Frontend Validation ---
            if (!title.trim()) {
                setSubmitError("Title is required.");
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

            const formData = new FormData();
            const userPayload = authService.getUserPayload();
            const currentUserId = userPayload?.userId || userPayload?.sub;

            if (!currentUserId) {
                setSubmitError("You must be logged in to post a donation.");
                setIsSaving(false);
                return;
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
                price: 0.00,
                unit,
                quantity: parseInt(quantity, 10),
                category: category,
                description,
                type: "SURPLUS_FOOD",
                ownerId: currentUserId,
                businessName: userPayload?.displayName || userPayload?.username || "Restaurant",
                expiryDate: expiryDate ? `${expiryDate}:00` : null,
                retainedImages: retainedImages
            };

            formData.append("listing", new Blob([JSON.stringify(listingData)], {
                type: "application/json"
            }));

            const uploadFiles = await prepareListingImages(newFiles);

            uploadFiles.forEach(file => {
                formData.append("images", file);
            });

            if (mode === 'edit') {
                await listingService.updateListing(id, formData);
            } else {
                await listingService.createSurplusListing(formData);
            }

            navigate('/restaurant-hub');
        } catch (error) {
            console.error("Error saving donation:", error);

            let errorMessage = error.message;

            // --- THE FIX: Clean up raw Spring Boot JSON errors ---
            if (errorMessage.startsWith('{') && errorMessage.includes('"status":400')) {
                errorMessage = "Please ensure all required fields are filled out correctly.";
            } else if (errorMessage.includes("VERIFIED business")) {
                errorMessage = "Your business profile is pending verification. You can post donations once an admin approves your account.";
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

                        <div className="form-section">
                            <div className="input-row">
                                <label>Title:</label>
                                <div className="input-with-icon">
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leftover Rice" />
                                    <PencilLine size={18} />
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Quantity:</label>
                                <div className="input-with-icon">
                                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="5" />
                                    <PencilLine size={18} />
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Unit:</label>
                                <div className="input-with-icon">
                                    <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, boxes" />
                                    <PencilLine size={18} />
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Category:</label>
                                <div className="editor-select-wrap">
                                    <select className="editor-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                        {SURPLUS_FOOD_CATEGORIES.map((item) => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Available Until:</label>
                                <div className="input-with-icon">
                                    <input type="datetime-local" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                                </div>
                            </div>

                            <div className="textarea-group">
                                <label>Donation Description:</label>
                                <div className="textarea-with-icon">
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="leftover rice, expires in 10 days" />
                                    <PencilLine size={18} className="text-icon" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="editor-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>

                        {submitError && (
                            <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '10px 15px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', border: '1px solid #ef5350', width: '100%', textAlign: 'center' }}>
                                {submitError}
                            </div>
                        )}

                        <button className="btn-submit-product" onClick={handleSubmit} disabled={isSaving}>
                            {isSaving ? 'Saving...' : (mode === 'add' ? 'Post Donation' : 'Save Changes')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SurplusEditor;
