import React from 'react';
import { Outlet } from 'react-router-dom';
import RoleNavbar from "@/components/layout/RoleNavbar";

const AppLayout = () => {
    return (
        <div className="app-container">
            <RoleNavbar />


            <main className="w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;