import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('shopping-cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('shopping-cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find(item => item.id === product.id);

            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [
                ...prevItems,
                {
                    ...product,
                    quantity: 1,
                }
            ];
        });
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, change) => {
        setCartItems(prev =>
            prev
                .map(item => {
                    if (item.id === id) {
                        const newQty = item.quantity + change;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean)
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const removeSellerItems = (sellerId) => {
        setCartItems(prev => prev.filter(item => item.ownerId !== sellerId));
    };

    const getItemsForSeller = (sellerId) => {
        return cartItems.filter(item => item.ownerId === sellerId);
    };

    const cartTotal = cartItems.reduce(
        (total, item) => total + (Number(item.price) * item.quantity),
        0
    );

    const groupedCart = useMemo(() => {
        const groups = {};

        for (const item of cartItems) {
            const sellerId = item.ownerId || "unknown-seller";

            if (!groups[sellerId]) {
                groups[sellerId] = {
                    sellerId,
                    sellerName: item.businessName || "Unknown Seller",
                    items: [],
                    subtotal: 0,
                    totalQuantity: 0,
                };
            }

            const lineTotal = Number(item.price) * item.quantity;

            groups[sellerId].items.push(item);
            groups[sellerId].subtotal += lineTotal;
            groups[sellerId].totalQuantity += item.quantity;
        }

        return Object.values(groups);
    }, [cartItems]);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                groupedCart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                removeSellerItems,
                getItemsForSeller,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);