import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronLeft, Star, Clock, CheckCircle } from 'lucide-react';
import { orderService } from '@/services/order.service.js';
import ReviewModal from './ReviewModal.jsx';

const MyOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, targetId: null, targetType: null, orderId: null });

    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchRealOrders = async () => {
            if (!currentUserId) return;
            setLoading(true);
            const data = await orderService.getOrdersByShopper(currentUserId);
            setOrders(data);
            setLoading(false);
        };
        fetchRealOrders();
    }, [currentUserId]);

    const openReview = (orderId, targetId, type) => {
        setModalConfig({ isOpen: true, targetId, targetType: type, orderId });
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#F5F2E8' }}>Loading verified orders...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E8', padding: '40px 20px' }}>
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <h1 style={{ fontFamily: 'serif', color: '#3B422D' }}>Order History</h1>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#6D804B', cursor: 'pointer' }}>
                        <ChevronLeft size={20} /> Back to Profile
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {orders.map(order => (
                        <div key={order.id} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #E2DFD3' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold' }}>Order #{order.id.substring(0, 8)}</span>
                                    <p style={{ margin: '5px 0', color: '#666' }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>${order.totalPrice.toFixed(2)}</span>
                                    <div style={{ fontSize: '0.8rem', color: '#4CAF50' }}>Verified Payment ✓</div>
                                </div>
                            </div>

                            {order.status === 'COMPLETED' && (
                                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                    {/* Review the specific product */}
                                    <button
                                        onClick={() => openReview(order.id, order.items[0]?.listingId, "LISTING")}
                                        style={{ backgroundColor: '#7B8B5B', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <Star size={14} fill="white" /> Review Product
                                    </button>

                                    {/* Review the seller */}
                                    <button
                                        onClick={() => openReview(order.id, order.sellerId, "SELLER")}
                                        style={{ backgroundColor: 'white', color: '#7B8B5B', border: '1px solid #7B8B5B', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        Review Seller
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <ReviewModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                orderId={modalConfig.orderId}
                targetId={modalConfig.targetId}
                targetType={modalConfig.targetType}
                reviewerId={currentUserId}
            />
        </div>
    );
};

export default MyOrders;