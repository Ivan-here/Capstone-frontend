import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronLeft, Star, Clock, CheckCircle, XCircle, RefreshCcw } from 'lucide-react';
import { useCart } from '../cart/CartContext.jsx'; //
import ReviewModal from './ReviewModal.jsx';

const MyOrders = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart(); //
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            const fakeOrders = [
                {
                    id: "ORD-7721A4", status: 'COMPLETED', totalPrice: 24.50, createdAt: "2026-03-20T14:30:00Z",
                    items: [{ title: "Organic Sourdough Bread", listingId: "1", price: 12.00 }, { title: "Farm Butter", listingId: "2", price: 12.50 }]
                },
                {
                    id: "ORD-8832B9", status: 'PENDING', totalPrice: 12.00, createdAt: "2026-03-24T10:15:00Z",
                    items: [{ title: "Fresh Grade A Eggs", listingId: "3", price: 12.00 }]
                }
            ];
            setOrders(fakeOrders);
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const handleReorder = (items) => {
        items.forEach(item => addToCart({ id: item.listingId, title: item.title, price: item.price }));
        alert("Items added back to your basket!");
        navigate('/cart'); //
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'COMPLETED': return { color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircle size={14}/> };
            default: return { color: '#b45309', bg: '#fef3c7', icon: <Clock size={14}/> };
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E8', padding: '40px 20px', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ backgroundColor: '#3B422D', padding: '10px', borderRadius: '12px' }}>
                            <Package color="white" size={24} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#3B422D', fontFamily: 'serif' }}>Order History</h1>
                    </div>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#6D804B', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ChevronLeft size={20} /> Back
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.map(order => {
                        const style = getStatusStyle(order.status);
                        return (
                            <div key={order.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2DFD3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                        <span style={{ backgroundColor: style.bg, color: style.color, padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {style.icon} {order.status}
                                        </span>
                                        <span style={{ color: '#999', fontSize: '0.85rem' }}>{new Date(order.createdAt).toLocaleDateString()} • #{order.id}</span>
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>{order.items.map(i => i.title).join(', ')}</div>
                                    <div style={{ fontWeight: 'bold', color: '#3B422D', marginTop: '4px' }}>${order.totalPrice.toFixed(2)}</div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleReorder(order.items)}
                                        style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <RefreshCcw size={16} /> Re-order
                                    </button>
                                    {order.status === 'COMPLETED' && (
                                        <button onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }} style={{ backgroundColor: '#7B8B5B', color: 'white', padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Star size={16} fill="white" /> Rate
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedOrder && (
                <ReviewModal
                    isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                    orderId={selectedOrder.id} targetId={selectedOrder.items[0].listingId}
                    targetType="LISTING" reviewerId={localStorage.getItem('userId')}
                    onSuccess={() => alert("Review published!")}
                />
            )}
        </div>
    );
};

export default MyOrders;