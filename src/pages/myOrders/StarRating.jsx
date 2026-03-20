import React, { useState } from 'react';

const StarRating = ({ rating = 0, maxStars = 5, isInteractive = false, onRatingChange, size = 20 }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            {[...Array(maxStars)].map((_, i) => {
                const val = i + 1;
                const active = isInteractive ? val <= (hoverRating || rating) : val <= Math.round(rating);
                return (
                    <svg
                        key={i}
                        onClick={() => isInteractive && onRatingChange(val)}
                        onMouseEnter={() => isInteractive && setHoverRating(val)}
                        onMouseLeave={() => isInteractive && setHoverRating(0)}
                        style={{ width: `${size}px`, height: `${size}px`, cursor: isInteractive ? 'pointer' : 'default', color: active ? '#FBBF24' : '#D1D5DB' }}
                        fill="currentColor" viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                );
            })}
        </div>
    );
};
export default StarRating;