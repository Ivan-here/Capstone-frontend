import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronLeft, Star, Clock, CheckCircle, RefreshCcw } from 'lucide-react';
import { useCart } from '../cart/CartContext.jsx';
import { orderService } from '@/services/order.service';
import { profileService } from '@/services/profile.service';
import ReviewModal from './ReviewModal.jsx';
import { formatPublicOrderId } from '@/utils/formatters.js';
import './MyOrders.css';

const statusStyles = {
    COMPLETED: { color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircle size={14} /> },
    PICKUP_CODE_VERIFIED: { color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircle size={14} /> },
    CANCELLED: { color: '#9b1c1c', bg: '#fde8e8', icon: <Clock size={14} /> },
};

function getStatusStyle(status) {
    return statusStyles[status] || { color: '#b45309', bg: '#fef3c7', icon: <Clock size={14} /> };
}

function formatAmount(order) {
    const amount = Number(order?.grossAmountCents || 0) / 100;
    return `$${amount.toFixed(2)}`;
}

function formatDate(order) {
    const raw = order?.orderDate || order?.createdAt || null;
    if (!raw) return 'N/A';
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString();
}

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
    const { addToCart } = useCart();
    const [history, setHistory] = useState({ bought: [], sold: [] });
    const [activeTab, setActiveTab] = useState('bought');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [profileLabels, setProfileLabels] = useState({});

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setError('You need to log in to view order history.');
            setLoading(false);
            return;
        }

        const loadHistory = async () => {
            try {
                setLoading(true);
                const data = await orderService.getOrderHistory(userId);
                setHistory({
                    bought: Array.isArray(data?.bought) ? data.bought : [],
                    sold: Array.isArray(data?.sold) ? data.sold : [],
                });
            } catch (err) {
                setError(err?.message || 'Failed to load order history.');
            } finally {
                setLoading(false);
            }
        };

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
    };

    return (
        <div className="my-orders-page">
            <div className="my-orders-shell">
                <div className="my-orders-hero">
                    <div className="my-orders-hero-main">
                        <div className="my-orders-hero-icon">
                            <Package color="white" size={24} />
                        </div>
                        <h1>Order History</h1>
                    </div>
                    <button onClick={() => navigate(-1)} className="my-orders-back">
                        <ChevronLeft size={20} /> Back
                    </button>
                </div>

                <div className="my-orders-card">
                    <div className="my-orders-tabs">
                        <button
                            onClick={() => setActiveTab('bought')}
                            className={`my-orders-tab ${activeTab === 'bought' ? 'is-active' : ''}`}
                        >
                            Bought ({history.bought.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('sold')}
                            className={`my-orders-tab ${activeTab === 'sold' ? 'is-active' : ''}`}
                        >
                            Sold ({history.sold.length})
                        </button>
                    </div>

                    {loading && <div className="my-orders-state">Loading order history...</div>}
                    {!loading && error && <div className="my-orders-state is-error">{error}</div>}

                    {!loading && !error && orders.length === 0 && (
                        <div className="my-orders-state is-empty">
                            No {activeTab} orders yet.
                        </div>
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
                                                    {formatDate(order)} | #{formatPublicOrderId(order.id)}
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
                </div>
            </div>

            {selectedOrder && (
                <ReviewModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    orderId={selectedOrder.id}
                    targetId={selectedOrder.items?.[0]?.listingId}
                    targetType="LISTING"
                    reviewerId={localStorage.getItem('userId')}
                    onSuccess={() => {}}
                />
            )}
        </div>
    );
};

export default MyOrders;
