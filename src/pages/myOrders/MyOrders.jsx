import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewModal from './ReviewModal.jsx';

const MyOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                // Adjust this endpoint to match your API gateway routing for orders
                const response = await fetch(`http://localhost:9000/api/orders?shopperId=${currentUserId}`);
                const data = await response.json();
                setOrders(data);
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) fetchMyOrders();
    }, [currentUserId]);

    const handleOpenReview = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-8 text-center">Loading your orders...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 mt-8 bg-[#F5F2E8] min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-serif font-bold text-[#3B422D]">My Orders</h1>
                <button onClick={() => navigate(-1)} className="text-[#6D804B] font-medium hover:underline">
                    Back to Profile
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-[#E2DFD3]">
                    <p className="text-gray-500">You haven't placed any orders yet.</p>
                    <button onClick={() => navigate('/browse')} className="mt-4 bg-[#6D804B] text-white px-6 py-2 rounded">
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-[#E2DFD3] flex flex-col md:flex-row justify-between items-center">

                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Order #{order.id.substring(0, 8)}</h3>
                                <p className="text-sm text-gray-500">Total: ${order.totalPrice}</p>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {order.status}
                                </span>
                            </div>

                            {/* Only allow reviewing if the order is marked COMPLETED */}
                            <div className="mt-4 md:mt-0">
                                {order.status === 'COMPLETED' && (
                                    <button
                                        onClick={() => handleOpenReview(order)}
                                        className="bg-[#7B8B5B] hover:bg-[#6A784E] text-white px-5 py-2 rounded-md font-medium transition-colors"
                                    >
                                        Leave a Review
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* The hidden modal that pops up when a user clicks the button */}
            {selectedOrder && (
                <ReviewModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedOrder(null);
                    }}
                    orderId={selectedOrder.id}
                    // For now, assuming you review the first item in the basket.
                    // You can adjust this to loop through order.items if your orders have multiple items.
                    targetId={selectedOrder.items[0]?.listingId}
                    targetType="LISTING"
                    reviewerId={currentUserId}
                    onSuccess={() => alert("Thank you! Your review has been published.")}
                />
            )}
        </div>
    );
};

export default MyOrders;