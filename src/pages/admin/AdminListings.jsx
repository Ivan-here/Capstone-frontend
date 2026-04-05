import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Package } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminListings.css";

const LISTING_STATUSES = ["ACTIVE", "OUT_OF_STOCK", "EXPIRED", "CLOSED"];

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
}

function formatPrice(price, unit) {
    if (price == null) return "-";
    const num = Number(price);
    if (Number.isNaN(num)) return `${price}`;
    return unit ? `$${num.toFixed(2)}/${unit}` : `$${num.toFixed(2)}`;
}

export default function AdminListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");

    const [selectedListing, setSelectedListing] = useState(null);

    useEffect(() => {
        loadListings();
    }, []);

    async function loadListings() {
        try {
            setLoading(true);
            setError("");
            const data = await adminService.getAllListings();
            setListings(data || []);
        } catch (err) {
            setError(err.message || "Failed to load listings.");
        } finally {
            setLoading(false);
        }
    }

    const filteredListings = useMemo(() => {
        return listings.filter((item) => {
            const q = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !q ||
                item.title?.toLowerCase().includes(q) ||
                item.businessName?.toLowerCase().includes(q) ||
                item.category?.toLowerCase().includes(q) ||
                item.ownerId?.toLowerCase().includes(q) ||
                item.id?.toLowerCase().includes(q);

            const matchesStatus = !statusFilter || item.status === statusFilter;
            const matchesType = !typeFilter || item.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [listings, searchTerm, statusFilter, typeFilter]);

    async function updateListingStatus(id, status) {
        try {
            const updated = await adminService.updateListingStatus(id, status);
            setListings((prev) => prev.map((item) => (item.id === id ? updated : item)));
            if (selectedListing?.id === id) {
                setSelectedListing(updated);
            }
        } catch (err) {
            alert(err.message || "Failed to update listing status.");
        }
    }

    async function closeListing(id) {
        return updateListingStatus(id, "CLOSED");
    }

    async function deleteListing(id) {
        const confirmed = window.confirm("Delete this listing?");
        if (!confirmed) return;

        try {
            await adminService.deleteListing(id);
            setListings((prev) => prev.filter((item) => item.id !== id));
            if (selectedListing?.id === id) setSelectedListing(null);
        } catch (err) {
            alert(err.message || "Failed to delete listing.");
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>Loading listings...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>{error}</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-shell">
                <div className="admin-section-header">
                    <div>
                        <h1>Listings</h1>
                        <p>Monitor all marketplace listings, inspect details, change status, or remove them.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={loadListings}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by title, business, category, owner or id"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {LISTING_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        <option value="">All Types</option>
                        <option value="FARM_PRODUCT">FARM_PRODUCT</option>
                        <option value="SURPLUS_FOOD">SURPLUS_FOOD</option>
                    </select>
                </div>

                <div className="admin-listings-grid">
                    <div className="admin-listings-table-panel">
                        <div className="admin-users-table-wrap">
                            <table className="admin-users-table">
                                <thead>
                                <tr>
                                    <th>Listing</th>
                                    <th>Type</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredListings.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="admin-empty-row">
                                            No listings found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredListings.map((item) => {
                                        const imageUrl =
                                            item.imageUrls?.[0] ||
                                            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80";

                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="admin-listing-cell">
                                                        <img src={imageUrl} alt={item.title} />
                                                        <div>
                                                            <strong>{item.title}</strong>
                                                            <p>{item.businessName || "No business name"}</p>
                                                            <span>{item.id}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>{item.type || "-"}</td>
                                                <td>{formatPrice(item.price, item.unit)}</td>
                                                <td>{item.quantity ?? "-"}</td>

                                                <td>
                                                    <select
                                                        className="admin-status-select"
                                                        value={item.status || "ACTIVE"}
                                                        onChange={(e) => updateListingStatus(item.id, e.target.value)}
                                                    >
                                                        {LISTING_STATUSES.map((status) => (
                                                            <option key={status} value={status}>
                                                                {status}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                <td>
                                                    <div className="admin-actions">
                                                        <button
                                                            className="admin-btn"
                                                            onClick={() => setSelectedListing(item)}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="admin-btn"
                                                            onClick={() => closeListing(item.id)}
                                                        >
                                                            Close
                                                        </button>
                                                        <button
                                                            className="admin-btn admin-btn-danger"
                                                            onClick={() => deleteListing(item.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="admin-listing-detail-panel">
                        {selectedListing ? (
                            <>
                                <div className="admin-detail-header">
                                    <h2>{selectedListing.title}</h2>
                                    <button className="admin-btn" onClick={() => setSelectedListing(null)}>
                                        Close
                                    </button>
                                </div>

                                <div className="admin-detail-image-wrap">
                                    <img
                                        src={
                                            selectedListing.imageUrls?.[0] ||
                                            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
                                        }
                                        alt={selectedListing.title}
                                    />
                                </div>

                                <div className="admin-detail-group">
                                    <label>Business</label>
                                    <p>{selectedListing.businessName || "-"}</p>
                                </div>

                                <div className="admin-detail-group">
                                    <label>Owner ID</label>
                                    <p>{selectedListing.ownerId || "-"}</p>
                                </div>

                                <div className="admin-detail-group">
                                    <label>Description</label>
                                    <p>{selectedListing.description || "-"}</p>
                                </div>

                                <div className="admin-detail-grid">
                                    <div className="admin-detail-group">
                                        <label>Category</label>
                                        <p>{selectedListing.category || "-"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Type</label>
                                        <p>{selectedListing.type || "-"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Status</label>
                                        <select
                                            className="admin-status-select"
                                            value={selectedListing.status || "ACTIVE"}
                                            onChange={(e) => updateListingStatus(selectedListing.id, e.target.value)}
                                        >
                                            {LISTING_STATUSES.map((status) => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Pickup Location</label>
                                        <p>{selectedListing.pickupLocation || "-"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Price</label>
                                        <p>{formatPrice(selectedListing.price, selectedListing.unit)}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Quantity</label>
                                        <p>{selectedListing.quantity ?? "-"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Expiry</label>
                                        <p>{formatDate(selectedListing.expiryDate)}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Created</label>
                                        <p>{formatDate(selectedListing.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="admin-detail-group">
                                    <label>Tags</label>
                                    <div className="admin-roles-wrap">
                                        {(selectedListing.tags || []).length > 0 ? (
                                            selectedListing.tags.map((tag) => (
                                                <span key={tag} className="admin-role-pill">{tag}</span>
                                            ))
                                        ) : (
                                            <p>-</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="admin-empty-detail">
                                <Package size={28} />
                                <h3>Select a listing</h3>
                                <p>Choose a listing from the table to inspect its full details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
