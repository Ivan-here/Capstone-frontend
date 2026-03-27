import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { orderService } from "@/services/order.service";
import { useCart } from "../cart/CartContext.jsx";

function CheckoutForm({ orderId, sellerId }) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const { removeSellerItems } = useCart();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setSubmitting(true);
        setError("");

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || "Failed to submit payment form.");
            setSubmitting(false);
            return;
        }

        const { error } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });

        if (error) {
            setError(error.message || "Payment failed.");
            setSubmitting(false);
            return;
        }

        removeSellerItems(sellerId);
        const target = orderId
            ? `/my-orders?payment=success&orderId=${encodeURIComponent(orderId)}`
            : "/my-orders?payment=success";
        navigate(target);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            <PaymentElement />
            {error && <div style={{ color: "crimson" }}>{error}</div>}
            <button type="submit" disabled={!stripe || !elements || submitting}>
                {submitting ? "Processing..." : "Pay now"}
            </button>
        </form>
    );
}

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const sellerId = location.state?.sellerId;
    const sellerName = location.state?.sellerName;
    const items = location.state?.items || [];
    const subtotal = location.state?.subtotal || 0;

    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState("");
    const [orderId, setOrderId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const shopperId = localStorage.getItem("userId");

    const orderPayload = useMemo(() => ({
        shopperId,
        items: items.map((item) => ({
            listingId: item.id,
            quantity: item.quantity,
        })),
    }), [items, shopperId]);

    useEffect(() => {
        const initCheckout = async () => {
            if (!shopperId || !items.length) {
                setError("Missing checkout data.");
                setLoading(false);
                return;
            }

            try {
                const stripe = await getStripe();
                setStripePromise(Promise.resolve(stripe));

                const createdOrder = await orderService.createOrder(orderPayload);
                setOrderId(createdOrder.orderId);

                const paymentIntent = await orderService.createPaymentIntent(createdOrder.orderId, shopperId);
                setClientSecret(paymentIntent.clientSecret);
            } catch (err) {
                setError(err.message || "Failed to initialize checkout.");
            } finally {
                setLoading(false);
            }
        };

        initCheckout();
    }, [shopperId, items, orderPayload]);

    if (loading) return <div style={{ padding: 24 }}>Preparing checkout...</div>;
    if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
    if (!clientSecret || !stripePromise) return <div style={{ padding: 24 }}>Unable to start payment.</div>;

    return (
        <div style={{ maxWidth: 700, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 16 }}>
            <h1>Checkout</h1>
            <p><b>Seller:</b> {sellerName}</p>
            <p><b>Total:</b> ${Number(subtotal).toFixed(2)}</p>

            <div style={{ marginBottom: 20 }}>
                {items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span>{item.title} × {item.quantity}</span>
                        <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm orderId={orderId} sellerId={sellerId} />
            </Elements>

            <button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
                Back
            </button>
        </div>
    );
}
