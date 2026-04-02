import React from 'react';
import './ListingCard.css';

// Added hideActions to the props
const ListingCard = ({ item, onEdit, onDelete, hideActions = false }) => {
    const isDonation = item.price === 0;

    return (
        <div className="grid-card">
            <div className="grid-card-content">
                <img src={item.imageUrl} alt={item.title} className="grid-img" />
                <div className="grid-text">
                    <h3>{item.title || "Unnamed Product"}</h3>

                    {isDonation ? (
                        <>
                            <p className="grid-desc">
                                {item.quantity} {item.unit}{item.description ? `, ${item.description}` : ''}
                            </p>

                            {item.expiryDate && (
                                <p className="grid-available" style={{ fontWeight: '500', marginTop: '4px', color: '#3e3b32' }}>
                                    Available Until:<br/>
                                    {item.expiryDate}
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="grid-desc">
                                {item.quantity != null
                                    ? `${item.quantity} ${item.unit || "items"} available`
                                    : "Quantity unavailable"}
                            </p>
                            <p className="grid-desc">{item.description}</p>
                            <p className="grid-price">
                                ${item.price ? Number(item.price).toFixed(2) : "0.00"}
                                {item.unit ? `/${item.unit}` : ''}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* --- THE FIX: Only show actions if hideActions is false --- */}
            {!hideActions && (
                <div className="grid-card-actions">
                    <button className="btn-grid-edit" onClick={onEdit}>Edit</button>
                    <button className="btn-grid-delete" onClick={onDelete}>Delete</button>
                </div>
            )}
        </div>
    );
};

export default ListingCard;
