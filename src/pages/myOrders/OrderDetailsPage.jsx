import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, UserRound } from 'lucide-react';
import { getStripe } from '@/lib/stripe';
import { orderService } from '@/services/order.service';
import { profileService } from '@/services/profile.service';
import { supportService } from '@/services/support.service';
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

function resolveProfileRole(profile, fallbackRole) {
    const businessType = profile?.businessProfile?.businessType?.trim();
    if (businessType) return businessType;

    const role = profile?.personalProfile?.role?.trim();
    if (role) return role;

    return fallbackRole;
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
    const [disputeMessage, setDisputeMessage] = useState('');
    const [busyAction, setBusyAction] = useState('');
    const [participants, setParticipants] = useState({
        shopper: { label: '', role: 'SHOPPER' },
        seller: { label: '', role: 'SELLER' },
    });

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

    useEffect(() => {
        if (!order?.shopperId && !order?.sellerUserId) return;

        let cancelled = false;
        (async () => {
            const next = {
                shopper: { label: order?.shopperId || '', role: 'SHOPPER' },
                seller: { label: order?.sellerUserId || '', role: 'SELLER' },
            };

            try {
                const [shopperProfile, sellerProfile] = await Promise.all([
                    order?.shopperId ? profileService.getProfileById(order.shopperId).catch(() => null) : Promise.resolve(null),
                    order?.sellerUserId ? profileService.getProfileById(order.sellerUserId).catch(() => null) : Promise.resolve(null),
                ]);

                next.shopper = {
                    label: resolveProfileLabel(shopperProfile, order?.shopperId || 'Shopper'),
                    role: resolveProfileRole(shopperProfile, 'SHOPPER'),
                };
                next.seller = {
                    label: resolveProfileLabel(sellerProfile, order?.sellerUserId || 'Seller'),
                    role: resolveProfileRole(sellerProfile, 'SELLER'),
                };
            } finally {
                if (!cancelled) {
                    setParticipants(next);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [order?.shopperId, order?.sellerUserId]);

    const canCancelPending = isBuyer && order?.status === 'PENDING_PAYMENT' && ['REQUIRES_PAYMENT', 'PAYMENT_PROCESSING'].includes(order?.paymentStatus);
    const canDisputeHeld = isBuyer && order?.paymentStatus === 'HELD' && !['CANCELLED', 'COMPLETED'].includes(order?.status);
    const canShowPickupCode = isBuyer && order?.paymentStatus === 'HELD';
    const canRepairPayment = isBuyer && order?.status === 'PENDING_PAYMENT' && !!order?.stripeClientSecret && !!order?.stripePaymentIntentId;

    const handleFetchPickupCode = async () => {
        if (!canShowPickupCode) {
            setNotice('Pickup code is only available after payment is confirmed and funds are held.');
            return;
        }

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

    const handleRepairPayment = async () => {
        if (!canRepairPayment) return;

        try {
            setBusyAction('repair-payment');
            const stripe = await getStripe();
            const { paymentIntent, error: stripeError } = await stripe.retrievePaymentIntent(order.stripeClientSecret);

            if (stripeError) {
                throw new Error(stripeError.message || 'Could not verify payment status with Stripe.');
            }

            if (!paymentIntent?.id) {
                throw new Error('Stripe did not return a payment intent for this order.');
            }

            if (paymentIntent.status !== 'succeeded') {
                throw new Error(`Payment is currently ${paymentIntent.status}. Complete payment before requesting the pickup code.`);
            }

            await orderService.confirmPayment(order.id, currentUserId, paymentIntent.id);
            setNotice('Payment confirmed. Your order is now marked as paid.');
            await loadOrder();
        } catch (err) {
            setNotice(err?.message || 'Could not confirm payment for this order.');
        } finally {
            setBusyAction('');
        }
    };

    const handleCancelOrder = async () => {
        if (!canCancelPending) return;

        try {
            setBusyAction('cancel');
            await orderService.cancelOrder(order.id, currentUserId, 'Shopper cancelled before payment was completed.');
            setNotice('Order cancelled.');
            await loadOrder();
        } catch (err) {
            setNotice(err?.message || 'Failed to cancel this order.');
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

    const handleDisputeOrder = async (e) => {
        e.preventDefault();
        if (!canDisputeHeld || !disputeMessage.trim()) return;

        try {
            setBusyAction('dispute');
            await supportService.createStaffRequest({
                category: 'ORDER_DISPUTE',
                subject: `Order dispute for #${order.id}`,
                message: disputeMessage.trim(),
                referenceType: 'ORDER',
                referenceId: order.id,
                contextPath: `/orders/${order.id}`,
            });
            setDisputeMessage('');
            setNotice('Dispute sent to staff. Admin can review the order while payment is still held.');
        } catch (err) {
            setNotice(err?.message || 'Failed to submit dispute.');
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
                            <span>Buyer:</span>
                            <button className="order-details-link" onClick={() => navigate(`/profile/${order.shopperId}`)}>
                                {participants.shopper.label}
                            </button>
                            <span className="order-details-userbadge">{participants.shopper.role}</span>
                        </div>
                        <div className="order-details-userline">
                            <UserRound size={16} />
                            <span>Seller:</span>
                            <button className="order-details-link" onClick={() => navigate(`/profile/${order.sellerUserId}`)}>
                                {participants.seller.label}
                            </button>
                            <span className="order-details-userbadge">{participants.seller.role}</span>
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
                        <div className="order-details-stack">
                            <p className="order-details-copy">
                                {canShowPickupCode
                                    ? 'Use this pickup code when collecting the order from the seller.'
                                    : 'Payment must be confirmed before a pickup code becomes available.'}
                            </p>

                            <div className="order-details-actions">
                                {canShowPickupCode && (
                                    <button
                                        className="order-details-primary"
                                        disabled={busyAction === 'pickup'}
                                        onClick={handleFetchPickupCode}
                                    >
                                        {busyAction === 'pickup' ? 'Loading code...' : 'Show Pickup Code'}
                                    </button>
                                )}

                                {canRepairPayment && (
                                    <button
                                        className="order-details-secondary"
                                        disabled={busyAction === 'repair-payment'}
                                        onClick={handleRepairPayment}
                                    >
                                        {busyAction === 'repair-payment' ? 'Checking...' : 'Check Payment Status'}
                                    </button>
                                )}

                                {canCancelPending && (
                                    <button
                                        className="order-details-danger"
                                        disabled={busyAction === 'cancel'}
                                        onClick={handleCancelOrder}
                                    >
                                        {busyAction === 'cancel' ? 'Cancelling...' : 'Cancel Order'}
                                    </button>
                                )}
                            </div>

                            {pickupCode && (
                                <div className="order-details-code">
                                    <div className="order-details-code-label">Pickup Code</div>
                                    <div className="order-details-code-value">{pickupCode}</div>
                                </div>
                            )}

                            {canDisputeHeld && (
                                <form className="order-details-verify" onSubmit={handleDisputeOrder}>
                                    <label htmlFor="order-dispute-input">Dispute this order with staff</label>
                                    <textarea
                                        id="order-dispute-input"
                                        value={disputeMessage}
                                        onChange={(e) => setDisputeMessage(e.target.value)}
                                        placeholder="Describe what went wrong with this order."
                                        rows={4}
                                    />
                                    <button className="order-details-primary" disabled={busyAction === 'dispute'}>
                                        {busyAction === 'dispute' ? 'Sending...' : 'Submit Dispute'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </section>
                )}

                {isSeller && (
                    <section className="order-details-card">
                        <h2>Seller Actions</h2>

                        <div className="order-details-stack">
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
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
