import React from 'react';
import { Trash2, Plus, ArrowRight, Minus, ShoppingBag } from 'lucide-react'; // <--- Added ShoppingBag
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();

    // --- EMPTY STATE ---
    if (!cartItems || cartItems.length === 0) {
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

    // --- FILLED STATE ---
    return (
        <div className="cart-wrapper">
            <div className="cart-container">

                {/* Cart Items List */}
                <div className="cart-list">
                    {cartItems.map((item) => (
                        <div key={item.id} className="cart-item">

                            {/* Product Image */}
                            <div className="cart-image">
                                <img src={item.images ? item.images[0] : (item.imageUrl || "https://via.placeholder.com/150")} alt={item.title} />
                            </div>

                            {/* Title & Controls */}
                            <div className="cart-details">
                                <h3>{item.title}</h3>

                                {/* Quantity Controls */}
                                <div className="qty-controls">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="icon-btn">
                                        {item.quantity === 1 ? <Trash2 size={16}/> : <Minus size={16}/>}
                                    </button>

                                    <span className="qty-number">{item.quantity}</span>

                                    <button onClick={() => updateQuantity(item.id, 1)} className="icon-btn">
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="cart-price">
                                ${(item.price * item.quantity).toFixed(2)}
                                {item.quantity > 1 && <div style={{fontSize: '0.7em', color: '#888'}}>${item.price}/{item.unit}</div>}
                            </div>

                            {/* Remove Button */}
                            <button
                                className="btn-remove"
                                onClick={() => removeFromCart(item.id)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer & Total */}
                <div className="cart-footer" style={{width: '100%', maxWidth: '700px', borderTop: '1px solid #ddd', paddingTop: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold'}}>
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>

                    <button className="btn-proceed" style={{width: '100%', justifyContent: 'center'}}>
                        PROCEED TO CHECKOUT <ArrowRight size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Cart;