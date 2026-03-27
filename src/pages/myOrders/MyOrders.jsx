import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronLeft, Star, Clock, CheckCircle, RefreshCcw } from 'lucide-react';
import { useCart } from '../cart/CartContext.jsx';
import { orderService } from '@/services/order.service';
import ReviewModal from './ReviewModal.jsx';

const PAGE_BG = '#F5F2E8';
const TITLE_COLOR = '#3B422D';

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

const MyOrders = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [history, setHistory] = useState({ bought: [], sold: [] });
    const [activeTab, setActiveTab] = useState('bought');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

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
        <div style={{ minHeight: '100vh', backgroundColor: PAGE_BG, padding: '40px 20px', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ backgroundColor: TITLE_COLOR, padding: '10px', borderRadius: '12px' }}>
                            <Package color="white" size={24} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: TITLE_COLOR, fontFamily: 'serif' }}>
                            Order History
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'none', border: 'none', color: '#6D804B', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <ChevronLeft size={20} /> Back
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                    <button
                        onClick={() => setActiveTab('bought')}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '999px',
                            border: activeTab === 'bought' ? '1px solid #7B8B5B' : '1px solid #ddd',
                            background: activeTab === 'bought' ? '#7B8B5B' : '#fff',
                            color: activeTab === 'bought' ? '#fff' : '#333',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        Bought ({history.bought.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('sold')}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '999px',
                            border: activeTab === 'sold' ? '1px solid #7B8B5B' : '1px solid #ddd',
                            background: activeTab === 'sold' ? '#7B8B5B' : '#fff',
                            color: activeTab === 'sold' ? '#fff' : '#333',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        Sold ({history.sold.length})
                    </button>
                </div>

                {loading && <div>Loading order history...</div>}
                {!loading && error && <div style={{ color: '#9b1c1c' }}>{error}</div>}

                {!loading && !error && orders.length === 0 && (
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2DFD3', padding: '24px' }}>
                        No {activeTab} orders yet.
                    </div>
                )}

                {!loading && !error && orders.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map((order) => {
                            const style = getStatusStyle(order.status);
                            const itemSummary = (order.items || []).map((i) => `${i.title} x${i.quantity}`).join(', ');
                            const canRate = activeTab === 'bought' && order.status === 'COMPLETED' && order.items?.length > 0;

                            return (
                                <div
                                    key={order.id}
                                    style={{
                                        backgroundColor: 'white',
                                        padding: '24px',
                                        borderRadius: '16px',
                                        border: '1px solid #E2DFD3',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '16px',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                            <span
                                                style={{
                                                    backgroundColor: style.bg,
                                                    color: style.color,
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                }}
                                            >
                                                {style.icon} {order.status || 'UNKNOWN'}
                                            </span>
                                            <span style={{ color: '#999', fontSize: '0.85rem' }}>
                                                {formatDate(order)} | #{order.id}
                                            </span>
                                            <span style={{ color: '#999', fontSize: '0.85rem' }}>
                                                Payment: {order.paymentStatus || 'N/A'}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#333' }}>
                                            {itemSummary || 'No items'}
                                        </div>

                                        <div style={{ color: '#555', marginTop: '4px' }}>
                                            {activeTab === 'sold' ? `Buyer: ${order.shopperId}` : `Seller: ${order.sellerUserId}`}
                                        </div>

                                        <div style={{ fontWeight: 'bold', color: TITLE_COLOR, marginTop: '6px' }}>
                                            {formatAmount(order)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                            style={{
                                                backgroundColor: '#fff',
                                                color: '#374151',
                                                padding: '10px 18px',
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            View Details
                                        </button>

                                        {activeTab === 'bought' && order.items?.length > 0 && (
                                            <button
                                                onClick={() => handleReorder(order)}
                                                style={{
                                                    backgroundColor: '#F3F4F6',
                                                    color: '#374151',
                                                    padding: '10px 18px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                }}
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
                                                style={{
                                                    backgroundColor: '#7B8B5B',
                                                    color: 'white',
                                                    padding: '10px 18px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                }}
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
