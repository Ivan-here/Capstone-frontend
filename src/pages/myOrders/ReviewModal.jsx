// src/components/ReviewModal.jsx
import React, { useState } from 'react';
import StarRating from './StarRating.jsx';
import { reviewService } from '@/services/reviewService.js';

const ReviewModal = ({
                         isOpen,
                         onClose,
                         orderId,
                         targetId,
                         targetType, // "SELLER" or "LISTING"
                         reviewerId, // The ID of the currently logged-in user
                         onSuccess
                     }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (rating === 0) {
            setError("Please select a star rating.");
            return;
        }

        setIsSubmitting(true);

        try {
            const reviewData = {
                orderId,
                reviewerId,
                targetId,
                targetType,
                rating,
                comment,
                isAnonymous
            };

            await reviewService.createReview(reviewData);

            // Reset state and close
            setRating(0);
            setComment('');
            setIsAnonymous(false);
            onSuccess(); // Trigger a refresh in the parent component
            onClose();
        } catch (err) {
            setError("Failed to submit review. Make sure this order is completed!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div className="bg-[#F5F2E8] rounded-xl shadow-lg w-full max-w-md p-6 relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">
                    How was your experience?
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Star Rating Input */}
                    <div className="flex flex-col items-center space-y-2 py-4 bg-white rounded-lg border border-[#E2DFD3]">
                        <span className="text-sm font-medium text-gray-600">Tap to rate</span>
                        <StarRating
                            rating={rating}
                            maxStars={5}
                            isInteractive={true}
                            onRatingChange={setRating}
                            size="w-10 h-10" // Bigger stars for the modal
                        />
                    </div>

                    {/* Comment Textarea */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Add a written review (optional)
                        </label>
                        <textarea
                            rows="4"
                            className="w-full rounded-md border border-[#E2DFD3] p-3 text-sm focus:ring-2 focus:ring-[#7B8B5B] focus:border-[#7B8B5B] outline-none"
                            placeholder="What did you like? What could be better?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    {/* Anonymous Toggle */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="anonymous"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="h-4 w-4 text-[#7B8B5B] focus:ring-[#7B8B5B] border-gray-300 rounded"
                        />
                        <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
                            Post this review anonymously
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-lg text-white font-bold transition-colors ${
                            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#6D804B] hover:bg-[#5C6E3D]'
                        }`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;