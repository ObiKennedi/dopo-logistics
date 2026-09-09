import React from "react";
import Link from "next/link";
import { CardHeader } from "./CardHeader";
import { GoogleButton } from "./GoogleButton";
import "@/styles/auth/CardWrapper.scss";

interface CardWrapperProps {
    children: React.ReactNode;
    headerLabel: string;
    headerTitle?: string;
    backButtonLabel: string;
    backButtonHref: string;
    backButtonText?: string;
    showFooter?: boolean;
    showSocial?: boolean;
    socialDividerText?: string;
    onSocialClick?: () => void;
    isSocialLoading?: boolean;
}

export const CardWrapper = ({
    children,
    headerLabel,
    headerTitle,
    backButtonLabel,
    backButtonHref,
    backButtonText = "Click here",
    showSocial,
    showFooter = true,
    socialDividerText = "or continue with",
    onSocialClick,
    isSocialLoading,
}: CardWrapperProps) => {
    return (
        <div className="dopo-card-wrapper card-wrapper">
            <div className="dopo-card-wrapper__inner">
                <CardHeader label={headerLabel} title={headerTitle} />
                
                <div className="dopo-card-wrapper__content">
                    {children}
                </div>

                {showSocial && (
                    <div className="dopo-card-wrapper__social-section">
                        <div className="dopo-card-wrapper__divider">
                            <span className="dopo-card-wrapper__divider-line" />
                            <span className="dopo-card-wrapper__divider-text">{socialDividerText}</span>
                            <span className="dopo-card-wrapper__divider-line" />
                        </div>
                        <GoogleButton onClick={onSocialClick} isLoading={isSocialLoading} />
                    </div>
                )}

                {showFooter && (
                    <footer className="dopo-card-wrapper__footer">
                        <p className="dopo-card-wrapper__footer-text">
                            <span>{backButtonLabel}</span>
                            <Link href={backButtonHref} className="dopo-card-wrapper__footer-link">
                                {backButtonText}
                            </Link>
                        </p>
                    </footer>
                )}
            </div>
        </div>
    );
};