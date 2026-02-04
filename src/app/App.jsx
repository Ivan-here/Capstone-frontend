import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Browse from '../pages/Browse/Browse.jsx';
import ProductDetails from '../pages/ProductDetails/ProductDetails';
import Cart from "../pages/cart/Cart.jsx";

// CHECK THIS PATH: Ensure your file is actually at src/pages/cart/CartContext.jsx
// If you saved it in the 'context' folder, change this to: '../context/CartContext'
import { CartProvider } from '../pages/cart/CartContext';

function App() {
    return (
        /* 1. WRAP THE ENTIRE APP WITH PROVIDER */
        <CartProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<Navigate to="/browse" replace />} />
                        <Route path="/browse" element={<Browse />} />
                        <Route path="/product/:id" element={<ProductDetails />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/community" element={<div className="p-10 text-center">Community Page Coming Soon</div>} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </CartProvider>
    );
}

export default App;