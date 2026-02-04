import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';

const AppLayout = () => {
    return (
        <div className="app-container">
            <Navbar />


            <main className="w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;