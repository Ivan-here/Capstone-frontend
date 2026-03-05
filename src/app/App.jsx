import React, { useState, useEffect } from 'react'; // <--- Import useState, useEffect
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Browse from '../pages/Browse/Browse.jsx';
import ProductDetails from '../pages/ProductDetails/ProductDetails';
import Cart from '../pages/cart/Cart.jsx';
import NotFound from '../pages/error/NotFound';
import LoginPage from "../pages/Login/LoginPage.jsx";
import RegistrationPage from "../pages/Registration/RegistrationPage.jsx";
import RegistrationVerification from "../pages/Registration/RegistrationVerification.jsx";
import ProfilePage from "../pages/Profile/ProfilePage.jsx";
import { CartProvider } from '../pages/cart/CartContext';
import Community from '../pages/community/Community.jsx';
import EditPersonalProfilePage from "@/pages/Profile/EditPersonalProfilePage";
import EditBusinessProfilePage from "@/pages/Profile/EditBusinessProfilePage";

// IMPORT THE SPLASH SCREEN
import SplashScreen from '../pages/Splash/Splash.jsx';
import FarmersHub from "@/pages/FarmerHub/FarmersHub.jsx";
import ProductEditor from "@/pages/FarmerHub/ProductEditor.jsx";
import SurplusEditor from "@/pages/RestaurantHub/SurplusEditor.jsx";
import RestaurantHub from "@/pages/RestaurantHub/RestaurantHub.jsx";

function App() {
    // 1. STATE: Is the app loading?
    const [isLoading, setIsLoading] = useState(true);

    // 2. LOGIC: Wait 3 seconds, then stop loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000); // 3000ms = 3 seconds

        return () => clearTimeout(timer); // Cleanup if user leaves
    }, []);

    // 3. RENDER: If loading, show Splash. If not, show App.
    if (isLoading) {
        return <SplashScreen />;
    }

    return (
        <CartProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegistrationPage />} />
                    <Route path="/register/verify/:role" element={<RegistrationVerification />} />
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<Navigate to="/browse" replace />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/profile/edit" element={<EditPersonalProfilePage />} />
                        <Route path="/profile/business/edit" element={<EditBusinessProfilePage />} />
                        <Route path="/browse" element={<Browse />} />
                        <Route path="/product/:id" element={<ProductDetails />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="*" element={<NotFound />} />
                        <Route path="/farmer-hub" element={<FarmersHub />} />
                        <Route path="/add-product" element={<ProductEditor mode="add" />} />
                        <Route path="/edit-product/:id" element={<ProductEditor mode="edit" />} />
                        <Route path="/restaurant-hub" element={<RestaurantHub />} />
                        <Route path="/add-surplus" element={<SurplusEditor mode="add" />} />
                        <Route path="/edit-surplus/:id" element={<SurplusEditor mode="edit" />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </CartProvider>
    );
}

export default App;