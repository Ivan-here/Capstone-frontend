import React from 'react';
import { Trash2, Plus, ArrowRight, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
    const { groupedCart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();

    const handleSellerCheckout = (sellerGroup) => {
        const shopperId = localStorage.getItem("userId");
        const token = localStorage.getItem("accessToken");

        if (!shopperId || !token) {
            navigate("/login", {
                state: {
                    redirectTo: "/checkout",
                    checkoutData: {
                        sellerId: sellerGroup.sellerId,
                        sellerName: sellerGroup.sellerName,
                        items: sellerGroup.items,
                        subtotal: sellerGroup.subtotal,
                    },
                },
            });
            return;
        }

        navigate("/checkout", {
            state: {
                sellerId: sellerGroup.sellerId,
                sellerName: sellerGroup.sellerName,
                items: sellerGroup.items,
                subtotal: sellerGroup.subtotal,
            },
        });
    };

    if (!groupedCart || groupedCart.length === 0) {
        return (
            <div className="cart-wrapper full-height-center">
                <div className="cart-empty-box">
                    <ShoppingBag size={64} color="#ccc" style={{ marginBottom: '20px' }} />
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added anything yet.</p>
                    <button onClick={() => navigate('/browse')} className="btn-browse-empty">
                        Browse Fresh Products
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-wrapper">
            <div className="cart-container">

                {groupedCart.map((sellerGroup) => (
                    <div
                        key={sellerGroup.sellerId}
                        className="cart-seller-section"
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px',
                                borderBottom: '1px solid #eee',
                                paddingBottom: '12px'
                            }}
                        >
                            <div>
                                <h2 style={{ margin: 0 }}>{sellerGroup.sellerName}</h2>
                                <div style={{ color: '#777', fontSize: '0.95rem', marginTop: '4px' }}>
                                    {sellerGroup.totalQuantity} item{sellerGroup.totalQuantity !== 1 ? 's' : ''}
                                </div>
                            </div>

                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                Seller total: ${sellerGroup.subtotal.toFixed(2)}
                            </div>
                        </div>

                        <div className="cart-list">
                            {sellerGroup.items.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-image">
                                        <img
                                            src={
                                                item.images
                                                    ? item.images[0]
                                                    : (item.imageUrls?.[0] || item.imageUrl || "https://via.placeholder.com/150")
                                            }
                                            alt={item.title}
                                        />
                                    </div>

                                    <div className="cart-details">
                                        <h3>{item.title}</h3>
                                        <div style={{ color: '#777', fontSize: '0.9rem', marginBottom: '10px' }}>
                                            {item.unit ? `Unit: ${item.unit}` : null}
                                        </div>
                                        <div style={{ color: '#777', fontSize: '0.85rem', marginBottom: '10px' }}>
                                            Available: {item.availableQuantity ?? item.quantity} {item.unit || 'items'}
                                        </div>

                                        <div className="qty-controls">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="icon-btn"
                                            >
                                                {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                                            </button>

                                            <span className="qty-number">{item.quantity}</span>

                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="icon-btn"
                                                disabled={item.quantity >= Number(item.availableQuantity ?? item.quantity ?? 1)}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="cart-price">
                                        ${(Number(item.price) * item.quantity).toFixed(2)}
                                        {item.quantity > 1 && (
                                            <div style={{ fontSize: '0.7em', color: '#888' }}>
                                                ${Number(item.price).toFixed(2)}/{item.unit}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="btn-remove"
                                        onClick={() => removeFromCart(item.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div
                            className="cart-footer"
                            style={{
                                width: '100%',
                                borderTop: '1px solid #ddd',
                                paddingTop: '20px',
                                marginTop: '20px'
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '20px',
                                    fontSize: '1.15rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                <span>{sellerGroup.sellerName} subtotal:</span>
                                <span>${sellerGroup.subtotal.toFixed(2)}</span>
                            </div>

                            <button
                                className="btn-proceed"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => handleSellerCheckout(sellerGroup)}
                            >
                                CHECK OUT THIS SELLER <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                <div
                    style={{
                        width: '100%',
                        maxWidth: '900px',
                        textAlign: 'right',
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        marginTop: '10px'
                    }}
                >
                    Cart total: ${cartTotal.toFixed(2)}
                </div>
            </div>
        </div>
    );
};

export default Cart;
