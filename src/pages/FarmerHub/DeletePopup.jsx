import React from 'react';
import './DeletePopup.css';

// Added onConfirm prop
const DeletePopup = ({ item, onCancel, onConfirm }) => (
    <div className="modal-overlay">
        <div className="delete-modal-box">
            <img src={item.imageUrl} alt="thumbnail" className="modal-thumb" />
            <div className="modal-content">
                <h3>{item.title}</h3>
                <p className="modal-price">${item.price}/{item.unit}</p>
                <p>Are you sure you want to delete this product?</p>
            </div>
            <div className="modal-buttons">
                {/* Wired up the Yes button */}
                <button className="btn-confirm-yes" onClick={() => onConfirm(item.id)}>Yes</button>
                <button className="btn-confirm-no" onClick={onCancel}>No</button>
            </div>
        </div>
    </div>
);

export default DeletePopup;