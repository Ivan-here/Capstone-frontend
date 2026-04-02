import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext();

const getSellerDisplayName = (businessName, ownerId) => {
    if (!businessName) return "Unknown Seller";

    const trimmedName = businessName.trim();
    if (!ownerId) return trimmedName;

    const escapedOwnerId = ownerId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const trailingOwnerIdPattern = new RegExp(`\\s*[(-]?\\s*${escapedOwnerId}\\s*[)]?\\s*$`);

    return trimmedName.replace(trailingOwnerIdPattern, '').trim() || "Unknown Seller";
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('shopping-cart');
        if (!savedCart) return [];

        return JSON.parse(savedCart).map((item) => ({
            ...item,
            availableQuantity: item.availableQuantity ?? item.quantity ?? 1,
        }));
    });

    useEffect(() => {
        localStorage.setItem('shopping-cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find(item => item.id === product.id);
            const availableQuantity = Math.max(
                1,
                Number(product.availableQuantity ?? product.quantity ?? existingItem?.availableQuantity ?? 1)
            );

            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id
                        ? {
                            ...item,
                            availableQuantity,
                            quantity: Math.min(item.quantity + 1, availableQuantity),
                        }
                        : item
                );
            }

            return [
                ...prevItems,
                {
                    ...product,
                    availableQuantity,
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
                        const maxQty = Math.max(1, Number(item.availableQuantity ?? item.quantity ?? 1));
                        const newQty = Math.min(item.quantity + change, maxQty);
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
                    sellerName: getSellerDisplayName(item.businessName, item.ownerId),
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
