import React from 'react';
import { Clock3, Users } from 'lucide-react';
import './ListingCard.css';

// Added hideActions to the props
const ListingCard = ({ item, onEdit, onDelete, hideActions = false }) => {
    const isDonation = item.price === 0;

    return (
        <div className="grid-card">
            {item.isNgoOnly && (
                <div className="grid-card-status grid-card-status-ngo">
                    <div className="grid-card-status-head">
                        <span className="grid-card-status-chip">
                            <Users size={14} />
                            NGO Only
                        </span>
                    </div>
                    <div className="grid-card-status-copy">
                        <Clock3 size={14} />
                        <span>Hidden from public browse until the donation reaches half-life.</span>
                    </div>
                </div>
            )}

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
