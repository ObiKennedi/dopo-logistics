import Link from "next/link";
import "@/styles/auth/CardHeader.scss";

interface CardHeaderProps {
    label: string;
    title?: string;
}

export const CardHeader = ({
    label,
    title
}: CardHeaderProps) => {
    return (
        <header className="dopo-card-header">
            <Link href="/" className="dopo-card-header__logo-link" aria-label="DOPO Logistics">
                <img src="/dopo.png" alt="DOPO Logistics Logo" className="dopo-card-header__logo" />
            </Link>
            {title && <h2 className="dopo-card-header__title">{title}</h2>}
            <p className="dopo-card-header__label">{label}</p>
        </header>
    );
};