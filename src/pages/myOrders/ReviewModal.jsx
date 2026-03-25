import React, { useState } from 'react';
import StarRating from './StarRating.jsx';
import { reviewService } from '@/services/reviewService.js';
import { X } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, orderId, targetId, targetType, reviewerId, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        backdropFilter: 'blur(4px)', padding: '20px'
    };

    const modalContentStyle = {
        backgroundColor: '#F5F2E8', padding: '32px', borderRadius: '24px',
        width: '100%', maxWidth: '450px', position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #E2DFD3'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return setError("Please select a star rating.");
        setIsSubmitting(true);
        try {
            await reviewService.createReview({
                orderId, reviewerId, targetId, targetType, rating, comment, isAnonymous
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError("Failed to submit. Ensure the order is completed!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                    <X size={24} />
                </button>

                <h2 style={{ fontFamily: 'serif', fontSize: '1.75rem', color: '#3B422D', marginBottom: '8px', marginTop: 0 }}>How was your experience?</h2>
                <p style={{ color: '#666', marginBottom: '24px', fontSize: '0.95rem' }}>Your feedback helps our local community grow.</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E2DFD3', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 'bold', color: '#7B8B5B', textTransform: 'uppercase' }}>Tap to Rate</p>
                        <StarRating rating={rating} isInteractive={true} onRatingChange={setRating} size={40} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#3B422D', fontSize: '0.9rem' }}>Written Review (Optional)</label>
                        <textarea
                            rows="4"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2DFD3', fontSize: '0.95rem', outlineColor: '#7B8B5B', resize: 'none' }}
                            placeholder="What did you like? What could be better?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#444' }}>
                        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#7B8B5B' }} />
                        Post this review anonymously
                    </label>

                    {error && <div style={{ color: '#d32f2f', fontSize: '0.85rem', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px' }}>{error}</div>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ backgroundColor: '#6D804B', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;