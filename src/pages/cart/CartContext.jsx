import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Initialize cart from LocalStorage if available
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('shopping-cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Save to LocalStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('shopping-cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // --- ACTIONS ---

    // 1. Add Item
    const addToCart = (product) => {
        setCartItems((prevItems) => {
            // Check if item already exists
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                // If yes, just +1 quantity
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            // If no, add new item with quantity 1
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    // 2. Remove Item
    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    // 3. Update Quantity (Increase/Decrease)
    const updateQuantity = (id, change) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + change;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    // 4. Calculate Total Price
    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
};

// Custom Hook to use the cart easily
export const useCart = () => useContext(CartContext);