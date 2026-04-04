import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { orderService } from "@/services/order.service";
import { profileService } from "@/services/profile.service";
import { formatPublicOrderId } from "@/utils/formatters.js";
import "./PickupPlannerPage.css";

function formatDateLabel(date) {
    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    }).format(date);
}

function resolveBuyerName(profile, fallback) {
    return profile?.personalProfile?.displayName
        || profile?.personalProfile?.username
        || `${profile?.personalProfile?.firstName ?? ""} ${profile?.personalProfile?.lastName ?? ""}`.trim()
        || fallback;
}

function buildUpcomingDays() {
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        return {
            key: date.toISOString().slice(0, 10),
            label: formatDateLabel(date),
        };
    });
}

export default function PickupPlannerPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [order, setOrder] = useState(null);
    const [sellerProfile, setSellerProfile] = useState(null);
    const [buyerProfile, setBuyerProfile] = useState(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError("");
                const orderData = await orderService.getOrderById(orderId);
                if (cancelled) return;
                setOrder(orderData);

                const [seller, buyer] = await Promise.all([
                    orderData?.sellerUserId ? profileService.getProfileById(orderData.sellerUserId).catch(() => null) : Promise.resolve(null),
                    orderData?.shopperId ? profileService.getProfileById(orderData.shopperId).catch(() => null) : Promise.resolve(null),
                ]);

                if (!cancelled) {
                    setSellerProfile(seller);
                    setBuyerProfile(buyer);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || "Failed to load pickup planner.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [orderId]);

    const days = useMemo(() => buildUpcomingDays(), []);
    const sellerBusiness = sellerProfile?.businessProfile;
    const buyerPersonal = buyerProfile?.personalProfile;

    if (loading) {
        return <div className="pickup-planner-page"><div className="pickup-planner-shell">Loading pickup planner...</div></div>;
    }

    if (error || !order) {
        return <div className="pickup-planner-page"><div className="pickup-planner-shell">{error || "Order not found."}</div></div>;
    }

    return (
        <div className="profilePage edit-page-bg pickup-planner-page">
            <main className="profileMain">
                <div className="edit-header pickup-planner-header">
                    <div className="edit-header-copy">
                        <h1>Pickup Planner</h1>
                        <p className="muted">Use this as a coordination guide after payment. Confirm the exact pickup time directly with the business.</p>
                    </div>
                    <div className="pickup-planner-header-actions">
                        <div className="pickup-planner-chip">Order #{formatPublicOrderId(order.id)}</div>
                        <button onClick={() => navigate(`/orders/${order.id}`)} className="back-link">
                            <ArrowLeft size={18} />
                            Back to Order Details
                        </button>
                    </div>
                </div>

                <div className="profileContainer pickup-planner-shell">
                    <section className="pickup-planner-card pickup-planner-card--wide">
                        <h2><CalendarDays size={18} /> Suggested Pickup Window</h2>
                        <p className="pickup-planner-copy">
                            Seller availability: {sellerBusiness?.pickupAvailability || sellerBusiness?.hours || "Not provided yet. Contact the seller directly."}
                        </p>
                        <div className="pickup-planner-days">
                            {days.map((day) => (
                                <div key={day.key} className="pickup-planner-day">
                                    <strong>{day.label}</strong>
                                    <span>{sellerBusiness?.pickupAvailability || sellerBusiness?.hours || "Contact seller to agree on a time"}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="pickup-planner-card">
                        <h2><MapPin size={18} /> Pickup Details</h2>
                        <div className="pickup-planner-detail"><strong>Location:</strong> {order.pickupLocation || sellerBusiness?.address || "Not provided"}</div>
                        <div className="pickup-planner-detail"><strong>Business:</strong> {sellerBusiness?.businessName || order.sellerUserId}</div>
                        <div className="pickup-planner-detail"><strong>Buyer:</strong> {resolveBuyerName(buyerProfile, order.shopperId)}</div>
                        <div className="pickup-planner-detail"><strong>Status:</strong> {order.status || "UNKNOWN"} / {order.paymentStatus || "N/A"}</div>
                        {sellerBusiness?.eligibilityNotes ? (
                            <div className="pickup-planner-note">{sellerBusiness.eligibilityNotes}</div>
                        ) : null}
                    </section>

                    <section className="pickup-planner-card">
                        <h2><Mail size={18} /> Contact Details</h2>
                        <div className="pickup-planner-contact-row">
                            <strong>Seller</strong>
                        </div>
                        <div className="pickup-planner-contact-row">
                            <Mail size={16} />
                            {sellerBusiness?.email ? <a href={`mailto:${sellerBusiness.email}`}>{sellerBusiness.email}</a> : <span>No seller email provided</span>}
                        </div>
                        <div className="pickup-planner-contact-row">
                            <Phone size={16} />
                            {sellerBusiness?.phone ? <a href={`tel:${sellerBusiness.phone}`}>{sellerBusiness.phone}</a> : <span>No seller phone provided</span>}
                        </div>
                        <div className="pickup-planner-contact-row" style={{ marginTop: "16px" }}>
                            <strong>Buyer</strong>
                        </div>
                        <div className="pickup-planner-contact-row">
                            <Mail size={16} />
                            {buyerPersonal?.email ? <a href={`mailto:${buyerPersonal.email}`}>{buyerPersonal.email}</a> : <span>No buyer email provided</span>}
                        </div>
                        <div className="pickup-planner-contact-row">
                            <Phone size={16} />
                            {buyerPersonal?.phone ? <a href={`tel:${buyerPersonal.phone}`}>{buyerPersonal.phone}</a> : <span>No buyer phone provided</span>}
                        </div>
                        <div className="pickup-planner-reminder-box">
                            There is no in-app chat here. Reach out directly using the contact details above to lock in pickup timing.
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
