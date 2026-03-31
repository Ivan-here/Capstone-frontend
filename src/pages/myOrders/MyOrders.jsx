import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { Package, ChevronLeft, Star, Clock, CheckCircle } from 'lucide-react';
import { orderService } from '@/services/order.service.js';
=======
import { Package, ChevronLeft, Star, Clock, CheckCircle, RefreshCcw } from 'lucide-react';
import { useCart } from '../cart/CartContext.jsx';
import { orderService } from '@/services/order.service';
import { profileService } from '@/services/profile.service';
>>>>>>> 18d3b54845f34f6df099b81f8ef72788643c5864
import ReviewModal from './ReviewModal.jsx';

function resolveProfileLabel(profile, fallbackId) {
    const businessName = profile?.businessProfile?.businessName?.trim();
    if (businessName) return businessName;

    const displayName = profile?.personalProfile?.displayName?.trim();
    if (displayName) return displayName;

    const fullName = `${profile?.personalProfile?.firstName ?? ''} ${profile?.personalProfile?.lastName ?? ''}`.trim();
    if (fullName) return fullName;

    const username = profile?.personalProfile?.username?.trim();
    if (username) return username;

    return fallbackId;
}

const MyOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
<<<<<<< HEAD
    const [modalConfig, setModalConfig] = useState({ isOpen: false, targetId: null, targetType: null, orderId: null });

    const currentUserId = localStorage.getItem('userId');
=======
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [profileLabels, setProfileLabels] = useState({});
>>>>>>> 18d3b54845f34f6df099b81f8ef72788643c5864

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

<<<<<<< HEAD
    const openReview = (orderId, targetId, type) => {
        setModalConfig({ isOpen: true, targetId, targetType: type, orderId });
=======
        loadHistory();
    }, []);

    useEffect(() => {
        const ids = new Set();
        history.bought.forEach((order) => {
            if (order?.sellerUserId) ids.add(order.sellerUserId);
        });
        history.sold.forEach((order) => {
            if (order?.shopperId) ids.add(order.shopperId);
        });

        if (ids.size === 0) {
            setProfileLabels({});
            return;
        }

        let cancelled = false;
        (async () => {
            const entries = await Promise.all(
                [...ids].map(async (id) => {
                    const profile = await profileService.getProfileById(id).catch(() => null);
                    return [id, resolveProfileLabel(profile, id)];
                })
            );

            if (!cancelled) {
                setProfileLabels(Object.fromEntries(entries));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [history]);

    const orders = useMemo(() => {
        const list = activeTab === 'sold' ? history.sold : history.bought;
        return [...list].sort((a, b) => {
            const aTime = new Date(a?.orderDate || a?.createdAt || 0).getTime();
            const bTime = new Date(b?.orderDate || b?.createdAt || 0).getTime();
            return bTime - aTime;
        });
    }, [activeTab, history]);

    const handleReorder = (order) => {
        if (!order?.items?.length) return;
        order.items.forEach((item) => {
            addToCart({
                id: item.listingId,
                title: item.title,
                unit: item.unit,
                ownerId: order.sellerUserId,
                businessName: 'Seller',
                price: Number(item.unitPriceCents || 0) / 100,
                quantity: item.quantity || 1,
            });
        });
        navigate('/cart');
>>>>>>> 18d3b54845f34f6df099b81f8ef72788643c5864
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
<<<<<<< HEAD
                    ))}
=======
                    )}

                    {!loading && !error && orders.length > 0 && (
                        <div className="my-orders-list">
                            {orders.map((order) => {
                                const style = getStatusStyle(order.status);
                                const itemSummary = (order.items || []).map((i) => `${i.title} x${i.quantity}`).join(', ');
                                const canRate = activeTab === 'bought' && order.status === 'COMPLETED' && order.items?.length > 0;

                                return (
                                    <div key={order.id} className="my-orders-item">
                                        <div className="my-orders-item-main">
                                            <div className="my-orders-item-top">
                                                <span
                                                    className="my-orders-status"
                                                    style={{ backgroundColor: style.bg, color: style.color }}
                                                >
                                                    {style.icon} {order.status || 'UNKNOWN'}
                                                </span>
                                                <span className="my-orders-meta">
                                                    {formatDate(order)} | #{order.id}
                                                </span>
                                                <span className="my-orders-meta">
                                                    Payment: {order.paymentStatus || 'N/A'}
                                                </span>
                                            </div>

                                            <div className="my-orders-summary">
                                                {itemSummary || 'No items'}
                                            </div>

                                            <div className="my-orders-party">
                                                {activeTab === 'sold'
                                                    ? `Buyer: ${profileLabels[order.shopperId] || order.shopperId}`
                                                    : `Seller: ${profileLabels[order.sellerUserId] || order.sellerUserId}`}
                                            </div>

                                            <div className="my-orders-amount">
                                                {formatAmount(order)}
                                            </div>
                                        </div>

                                        <div className="my-orders-actions">
                                            <button
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                                className="my-orders-btn is-secondary"
                                            >
                                                View Details
                                            </button>

                                            {activeTab === 'bought' && order.items?.length > 0 && (
                                                <button
                                                    onClick={() => handleReorder(order)}
                                                    className="my-orders-btn is-muted"
                                                >
                                                    <RefreshCcw size={16} /> Re-order
                                                </button>
                                            )}

                                            {canRate && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="my-orders-btn is-primary"
                                                >
                                                    <Star size={16} fill="white" /> Rate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
>>>>>>> 18d3b54845f34f6df099b81f8ef72788643c5864
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