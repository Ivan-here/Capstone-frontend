import React from 'react';
import './ListingCard.css';

const ListingCard = ({ item, onEdit, onDelete }) => {
    // If the price is 0, we treat it as a Surplus Donation card layout
    const isDonation = item.price === 0;

    return (
        <div className="grid-card">
            <div className="grid-card-content">
                <img src={item.imageUrl} alt={item.title} className="grid-img" />
                <div className="grid-text">
                    <h3>{item.title}</h3>

                    {isDonation ? (
                        <>
                            {/* Formats exactly like the mockup: "5 kg, 100% durum wheat" */}
                            <p className="grid-desc">
                                {item.quantity} {item.unit}{item.description ? `, ${item.description}` : ''}
                            </p>

                            {/* Shows the availability date */}
                            {item.expiryDate && (
                                <p className="grid-available" style={{ fontWeight: '500', marginTop: '4px', color: '#3e3b32' }}>
                                    Available Until:<br/>
                                    {item.expiryDate}
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Original Farmer Hub layout */}
                            <p className="grid-desc">{item.description}</p>
                            <p className="grid-price">${item.price}{item.unit ? `/${item.unit}` : ''}</p>
                        </>
                    )}
                </div>
            </div>
            <div className="grid-card-actions">
                <button className="btn-grid-edit" onClick={onEdit}>Edit</button>
                <button className="btn-grid-delete" onClick={onDelete}>Delete</button>
            </div>
        </div>
    );
};

export default ListingCard;