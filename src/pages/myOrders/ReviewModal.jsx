import React, { useState } from 'react';
import StarRating from './StarRating.jsx';
import { reviewService } from '@/services/reviewService.js';
import { X, CheckCircle } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, orderId, targetId, targetType, reviewerId }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (rating === 0) {
            setError("Please tap a star to rate.");
            return;
        }
        if (!comment.trim()) {
            setError("Please share a few words about your experience.");
            return;
        }

        setIsSubmitting(true);
        try {
            await reviewService.createReview({
                orderId, reviewerId, targetId, targetType, rating, comment, isAnonymous: false
            });
            setSubmitted(true); // Show the success card
            setTimeout(() => {
                setSubmitted(false);
                setRating(0);
                setComment('');
                onClose();
            }, 2500);
        } catch (err) {
            setError("Review failed. You might have already reviewed this item.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#F5F2E8', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '400px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>

                {submitted ? (
                    /* SUCCESS CARD - REPLACES THE ALERT */
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <CheckCircle size={60} color="#7B8B5B" style={{ marginBottom: '15px' }} />
                        <h2 style={{ color: '#3B422D', fontFamily: 'serif' }}>Review Published!</h2>
                        <p style={{ color: '#666' }}>Thank you for supporting local business.</p>
                    </div>
                ) : (
                    <>
                        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                        <h2 style={{ fontFamily: 'serif', color: '#3B422D', marginBottom: '20px' }}>
                            Rate your {targetType === 'LISTING' ? 'Product' : 'Seller'}
                        </h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                                <StarRating rating={rating} isInteractive={true} onRatingChange={setRating} size={35} />
                            </div>

                            <textarea
                                placeholder="What did you think of this order?"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                style={{ width: '100%', height: '100px', borderRadius: '10px', padding: '12px', border: '1px solid #E2DFD3', outlineColor: '#7B8B5B' }}
                            />

                            {error && <div style={{ color: '#D32F2F', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{ backgroundColor: '#6D804B', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                {isSubmitting ? 'Posting...' : 'Submit Verified Review'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReviewModal;