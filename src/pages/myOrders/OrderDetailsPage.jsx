import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, UserRound } from 'lucide-react';
import { orderService } from '@/services/order.service';
import './OrderDetailsPage.css';

function formatMoney(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatDate(value) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
}

export default function OrderDetailsPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [pickupCode, setPickupCode] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [busyAction, setBusyAction] = useState('');

    const currentUserId = localStorage.getItem('userId');
    const isBuyer = !!order && currentUserId === order.shopperId;
    const isSeller = !!order && currentUserId === order.sellerUserId;

    const statusTone = useMemo(() => {
        if (!order?.status) return 'order-details__chip';
        if (['COMPLETED', 'PICKUP_CODE_VERIFIED'].includes(order.status)) return 'order-details__chip order-details__chip--ok';
        if (order.status === 'CANCELLED') return 'order-details__chip order-details__chip--bad';
        return 'order-details__chip order-details__chip--warn';
    }, [order?.status]);

    const loadOrder = async () => {
        if (!orderId) return;
        try {
            setLoading(true);
            setError('');
            const data = await orderService.getOrderById(orderId);
            setOrder(data);
        } catch (err) {
            setError(err?.message || 'Failed to load order details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const handleFetchPickupCode = async () => {
        if (!isBuyer) return;
        try {
            setBusyAction('pickup');
            const data = await orderService.getPickupCode(order.id, currentUserId);
            setPickupCode(data?.pickupCode || '');
            setNotice('Pickup code loaded.');
        } catch (err) {
            setNotice(err?.message || 'Could not load pickup code.');
        } finally {
            setBusyAction('');
        }
    };

    const handleMarkReady = async () => {
        if (!isSeller) return;
        try {
            setBusyAction('ready');
            await orderService.markReadyForPickup(order.id, currentUserId);
            setNotice('Order marked ready for pickup.');
            await loadOrder();
        } catch (err) {
            setNotice(err?.message || 'Failed to mark ready for pickup.');
        } finally {
            setBusyAction('');
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        if (!isSeller || !verifyCode.trim()) return;
        try {
            setBusyAction('verify');
            await orderService.verifyPickupCode(order.id, currentUserId, verifyCode.trim());
            setVerifyCode('');
            setNotice('Pickup code verified. Order completed and payout released.');
            await loadOrder();
        } catch (err) {
            setNotice(err?.message || 'Pickup code verification failed.');
        } finally {
            setBusyAction('');
        }
    };

    if (loading) {
        return (
            <div className="order-details-wrapper">
                <div className="order-details-container">Loading order details...</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="order-details-wrapper">
                <div className="order-details-container">{error || 'Order not found.'}</div>
            </div>
        );
    }

    const userNotInOrder = !isBuyer && !isSeller;

    return (
        <div className="order-details-wrapper">
            <div className="order-details-container">
                <button onClick={() => navigate('/my-orders')} className="order-details-back">
                    <ArrowLeft size={18} />
                    <span>Back to Order History</span>
                </button>

                <div className="order-details-header">
                    <div>
                        <h1>Order #{order.id}</h1>
                        <div className={statusTone}>{order.status || 'UNKNOWN'}</div>
                    </div>
                    <div className="order-details-summary">
                        <div><b>Total:</b> {formatMoney(order.grossAmountCents)}</div>
                        <div><b>Payment:</b> {order.paymentStatus || 'N/A'}</div>
                        <div><b>Placed:</b> {formatDate(order.orderDate)}</div>
                    </div>
                </div>

                <div className="order-details-grid">
                    <section className="order-details-card">
                        <h2>Participants</h2>
                        <div className="order-details-userline">
                            <UserRound size={16} />
                            <span>Buyer: </span>
                            <button className="order-details-link" onClick={() => navigate(`/profile/${order.shopperId}`)}>
                                {order.shopperId}
                            </button>
                        </div>
                        <div className="order-details-userline">
                            <UserRound size={16} />
                            <span>Seller: </span>
                            <button className="order-details-link" onClick={() => navigate(`/profile/${order.sellerUserId}`)}>
                                {order.sellerUserId}
                            </button>
                        </div>
                        <div className="order-details-meta"><b>Pickup location:</b> {order.pickupLocation || 'N/A'}</div>
                    </section>

                    <section className="order-details-card">
                        <h2>Order Items</h2>
                        <div className="order-details-items">
                            {(order.items || []).map((item) => (
                                <div className="order-details-item" key={`${order.id}-${item.listingId}`}>
                                    <div>
                                        <div className="order-details-item-title">{item.title}</div>
                                        <div className="order-details-item-sub">
                                            {item.quantity} x {formatMoney(item.unitPriceCents)}{item.unit ? ` / ${item.unit}` : ''}
                                        </div>
                                    </div>
                                    <div className="order-details-item-total">{formatMoney(item.lineTotalCents)}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {notice && <div className="order-details-notice">{notice}</div>}

                {userNotInOrder && (
                    <div className="order-details-info">
                        <Clock3 size={16} />
                        You are not the buyer or seller for this order.
                    </div>
                )}

                {isBuyer && (
                    <section className="order-details-card">
                        <h2>Buyer Actions</h2>
                        <p>Use your pickup code when collecting the order.</p>
                        <button
                            className="order-details-primary"
                            disabled={busyAction === 'pickup'}
                            onClick={handleFetchPickupCode}
                        >
                            {busyAction === 'pickup' ? 'Loading code...' : 'Show Pickup Code'}
                        </button>
                        {pickupCode && (
                            <div className="order-details-code">
                                <div className="order-details-code-label">Pickup Code</div>
                                <div className="order-details-code-value">{pickupCode}</div>
                            </div>
                        )}
                    </section>
                )}

                {isSeller && (
                    <section className="order-details-card">
                        <h2>Seller Actions</h2>

                        {order.status === 'PAID' && (
                            <button
                                className="order-details-primary"
                                disabled={busyAction === 'ready'}
                                onClick={handleMarkReady}
                            >
                                {busyAction === 'ready' ? 'Updating...' : 'Mark Ready for Pickup'}
                            </button>
                        )}

                        {order.status === 'READY_FOR_PICKUP' && (
                            <form className="order-details-verify" onSubmit={handleVerifyCode}>
                                <label htmlFor="pickup-code-input">Enter Buyer Pickup Code</label>
                                <input
                                    id="pickup-code-input"
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value)}
                                    placeholder="6-digit code"
                                />
                                <button className="order-details-primary" disabled={busyAction === 'verify'}>
                                    {busyAction === 'verify' ? 'Verifying...' : 'Verify Code & Complete Order'}
                                </button>
                            </form>
                        )}

                        {order.status === 'PAID' && (
                            <div className="order-details-info">
                                <Clock3 size={16} />
                                Mark the order ready first, then verify the buyer pickup code.
                            </div>
                        )}

                        {order.status === 'COMPLETED' && (
                            <div className="order-details-info">
                                <CheckCircle2 size={16} />
                                Order completed and payout released.
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
