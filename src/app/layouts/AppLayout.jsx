import React, {useEffect, useState} from 'react';
import { Outlet } from 'react-router-dom';
import RoleNavbar from "@/components/layout/RoleNavbar";
import {profileService} from "@/services/profile.service.js";

const AppLayout = () => {
    const [businessType, setBusinessType] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const me = await profileService.getMe();
                setBusinessType(me?.businessProfile?.businessType ?? null);
            } catch {
                setBusinessType(null);
            }
        })();
    }, []);

    return (
        <div className="app-container">
            <RoleNavbar businessType={businessType} />


            <main className="w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;