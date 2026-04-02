import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ArrowLeft, CreditCard } from "lucide-react";
import { getStripe } from "@/lib/stripe";
import { orderService } from "@/services/order.service";
import { useCart } from "../cart/CartContext.jsx";
import "./CheckoutPage.css";

function mapCheckoutError(message) {
    const normalized = String(message || "").toLowerCase();

    if (
        normalized.includes("seller is not ready to accept payments") ||
        normalized.includes("seller payment profile not found") ||
        normalized.includes("processing error occurred")
    ) {
        return "Sorry, this farmer hasn't setup payments yet.";
    }

    return message || "Failed to initialize checkout.";
}

function CheckoutForm({ orderId, paymentIntentId, sellerId, shopperId, onPaymentSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setSubmitting(true);
        setError("");

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(mapCheckoutError(submitError.message) || "Failed to submit payment form.");
            setSubmitting(false);
            return;
        }

        const result = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });

        if (result.error) {
            setError(mapCheckoutError(result.error.message) || "Payment failed.");
            setSubmitting(false);
            return;
        }

        const confirmedPaymentIntentId = result.paymentIntent?.id || paymentIntentId;

        try {
            await orderService.confirmPayment(orderId, shopperId, confirmedPaymentIntentId);
            await onPaymentSuccess?.(sellerId);
        } catch (confirmError) {
            setError(mapCheckoutError(confirmError?.message) || "Payment went through, but the order could not be finalized.");
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="checkout-form">
            <PaymentElement />
            {error && <div className="checkout-error">{error}</div>}
            <button type="submit" className="checkout-btn checkout-btn--primary" disabled={!stripe || !elements || submitting}>
                <CreditCard size={18} />
                {submitting ? "Processing..." : "Pay now"}
            </button>
        </form>
    );
}

function DonationCheckoutForm({ orderId, sellerId, shopperId, items, onClaimSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            if (orderId.startsWith("res-")) {
                const guaranteedId = items[0].listingId || items[0].id || items[0].productId;

                // Strict Donation: Bypass Orders and hit the Reservation Endpoint directly!
                await orderService.createReservation({
                    ngoId: shopperId,
                    listingId: guaranteedId,
                    productId: guaranteedId, // Send both keys to prevent the backend throwing a null error
                    quantity: items[0].quantity || 1
                });
            } else {
                // Surplus Food (Fake Donation): Standard confirmation
                await orderService.confirmDonationOrder(orderId, shopperId);
            }
            await onClaimSuccess?.(sellerId);
        } catch (claimError) {
            setError(mapCheckoutError(claimError?.message) || "Could not confirm this donation claim.");
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="checkout-form">
            {error && <div className="checkout-error">{error}</div>}
            <button type="submit" className="checkout-btn checkout-btn--primary" disabled={submitting}>
                <CreditCard size={18} />
                {submitting ? "Confirming..." : "Confirm donation claim"}
            </button>
        </form>
    );
}

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { removeSellerItems } = useCart();

    const sellerId = location.state?.sellerId;
    const sellerName = location.state?.sellerName;
    const items = location.state?.items || [];
    const subtotal = location.state?.subtotal || 0;

    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState("");
    const [paymentIntentId, setPaymentIntentId] = useState("");
    const [orderId, setOrderId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingDraft, setCancellingDraft] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);

    const shopperId = localStorage.getItem("userId");

    const isDonationCheckout = useMemo(
        () => items.length > 0 && items.every((item) => Number(item.price) === 0),
        [items]
    );

    // FIXED: Now checks isNgoOnly to guarantee the bypass activates immediately
    const isStrictDonation = useMemo(
        () => items.some(item =>
            item.listingType === 'DONATION' ||
            item.type === 'DONATION' ||
            item.visibility === 'NGO_ONLY' ||
            item.isNgoOnly === true
        ),
        [items]
    );

    const orderPayload = useMemo(() => ({
        shopperId,
        items: items.map((item) => {
            const guaranteedId = item.listingId || item.id || item.productId;
            return {
                listingId: guaranteedId,
                productId: guaranteedId, // Pass multiple keys so backend parsing never fails
                quantity: item.quantity || 1,
            };
        }),
    }), [items, shopperId]);

    useEffect(() => {
        const initCheckout = async () => {
            if (!shopperId) {
                navigate("/login", {
                    state: {
                        redirectTo: "/checkout",
                        checkoutData: { sellerId, sellerName, items, subtotal },
                    },
                    replace: true,
                });
                return;
            }

            if (!items.length) {
                setError("Missing checkout data.");
                setLoading(false);
                return;
            }

            try {
                // BYPASS orders endpoint completely if it's a strict donation!
                if (isStrictDonation) {
                    setOrderId("res-" + Date.now());
                    setLoading(false);
                    return;
                }

                // Normal paid/surplus flow
                const stripe = await getStripe();
                setStripePromise(Promise.resolve(stripe));

                const createdOrder = await orderService.createOrder(orderPayload);
                setOrderId(createdOrder.orderId);

                const requiresPayment = createdOrder.requiresPayment ?? Number(createdOrder.grossAmountCents || 0) > 0;
                if (requiresPayment) {
                    const paymentIntent = await orderService.createPaymentIntent(createdOrder.orderId, shopperId);
                    setPaymentIntentId(paymentIntent.paymentIntentId);
                    setClientSecret(paymentIntent.clientSecret);
                } else {
                    setPaymentIntentId("");
                    setClientSecret("");
                }
            } catch (err) {
                setError(mapCheckoutError(err.message));
            } finally {
                setLoading(false);
            }
        };

        initCheckout();
    }, [shopperId, items, orderPayload, navigate, sellerId, sellerName, subtotal, isStrictDonation]);

    const handlePaymentSuccess = async (resolvedSellerId) => {
        setPaymentCompleted(true);
        removeSellerItems(resolvedSellerId);
        const target = orderId && !orderId.startsWith("res-")
            ? `/my-orders?payment=success&orderId=${encodeURIComponent(orderId)}`
            : "/my-orders?payment=success";
        navigate(target);
    };

    const handleBack = async () => {
        if (orderId && !orderId.startsWith("res-") && shopperId && !paymentCompleted) {
            try {
                setCancellingDraft(true);
                await orderService.cancelOrder(orderId, shopperId, "Checkout closed before payment.");
            } catch (err) {
                console.error("Failed to cancel draft order:", err);
            } finally {
                setCancellingDraft(false);
            }
        }
        navigate(-1);
    };

    if (loading) return <div className="checkout-shell"><div className="checkout-card">Preparing checkout...</div></div>;
    if (error) return <div className="checkout-shell"><div className="checkout-card checkout-error">{error}</div></div>;
    if (!isDonationCheckout && (!clientSecret || !stripePromise || !paymentIntentId)) {
        return <div className="checkout-shell"><div className="checkout-card">Unable to start payment.</div></div>;
    }

    return (
        <div className="checkout-shell">
            <div className="checkout-card">
                <div className="checkout-header">
                    <div>
                        <h1>Checkout</h1>
                        <p>{isDonationCheckout ? "Review this donation claim and confirm pickup details." : "Review this order and complete payment securely."}</p>
                    </div>
                    <button onClick={handleBack} className="checkout-btn checkout-btn--secondary" disabled={cancellingDraft}>
                        <ArrowLeft size={18} />
                        {cancellingDraft ? "Closing..." : "Back"}
                    </button>
                </div>

                <div className="checkout-summary-card">
                    <div className="checkout-summary-row">
                        <span>Seller</span>
                        <strong>{sellerName}</strong>
                    </div>
                    <div className="checkout-summary-row">
                        <span>Total</span>
                        <strong>${Number(subtotal).toFixed(2)}</strong>
                    </div>
                </div>

                <div className="checkout-items">
                    {items.map((item, idx) => (
                        <div key={item.id || idx} className="checkout-item">
                            <div>
                                <div className="checkout-item-title">{item.title}</div>
                                <div className="checkout-item-subtitle">Quantity: {item.quantity}</div>
                            </div>
                            <div className="checkout-item-price">${(Number(item.price) * item.quantity).toFixed(2)}</div>
                        </div>
                    ))}
                </div>

                {isDonationCheckout ? (
                    <DonationCheckoutForm
                        orderId={orderId}
                        sellerId={sellerId}
                        shopperId={shopperId}
                        items={items}
                        onClaimSuccess={handlePaymentSuccess}
                    />
                ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm
                            orderId={orderId}
                            paymentIntentId={paymentIntentId}
                            sellerId={sellerId}
                            shopperId={shopperId}
                            onPaymentSuccess={handlePaymentSuccess}
                        />
                    </Elements>
                )}
            </div>
        </div>
    );
}