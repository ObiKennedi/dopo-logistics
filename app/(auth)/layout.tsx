import React from "react";
import LinkButton from "@/components/essentials/LinkButton";
import { ArrowLeft } from "lucide-react";
import "@/styles/auth/AuthLayout.scss";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="dopo-auth-layout auth-layout">
            <LinkButton href="/" className="dopo-auth-layout__back-btn" >
                <ArrowLeft size={20} />
                Back to Home
            </LinkButton>
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