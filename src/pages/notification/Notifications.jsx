import React from 'react';
import './Notifications.css';

// DUMMY DATA
const NOTIFICATIONS = [
    {
        id: 1,
        title: "Order Update",
        time: "2 h ago",
        message: "The apples in your cart are no longer available",
        type: "alert" // could style differently if needed
    },
    {
        id: 2,
        title: "Reservation Update",
        time: "3 h ago",
        message: "The baked goods you reserved are available",
        type: "success"
    },
    {
        id: 3,
        title: "2 New posts",
        time: "6 h ago",
        message: "There are new posts in the community",
        type: "info"
    },
    {
        id: 4,
        title: "1 new like",
        time: "10 h ago",
        message: "There is one new like on your post",
        type: "info"
    }
];

const Notifications = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Invisible backdrop to close when clicking outside */}
            <div className="notification-backdrop" onClick={onClose}></div>

            <div className="notification-dropdown">
                <h2 className="notification-header">NOTIFICATIONS</h2>

                <div className="notification-list">
                    {NOTIFICATIONS.map((note) => (
                        <div key={note.id} className="notification-item">
                            <div className="note-top-row">
                                <span className="note-title">{note.title}</span>
                                <span className="note-time">{note.time}</span>
                            </div>
                            <p className="note-message">{note.message}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Notifications;