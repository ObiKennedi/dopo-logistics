import React from "react";
import "@/styles/auth/AuthLayout.scss";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="dopo-auth-layout auth-layout">
            <div className="dopo-auth-layout__bg-wrapper">
                <img
                    src="/background.jfif"
                    alt="DOPO Logistics Background"
                    className="dopo-auth-layout__bg-image background-image"
                />
                <div className="dopo-auth-layout__overlay" />
            </div>
            <main className="dopo-auth-layout__content auth-layout__content">
                {children}
            </main>
        </div>
    );
};

export default AuthLayout;