"use client"

import { useRouter } from "next/navigation";

interface LinkButtonProps {
    children: React.ReactNode;
    href?: string;
    className?: string;
    onClick?: () => void;
}

const LinkButton = ({ children, href, className, onClick }: LinkButtonProps) => {
    const router = useRouter();

    const handleClick = () => {
        if (href) {
            router.push(href);
        }
        if (onClick) {
            onClick();
        }
    }

    return (
        <button
            className={className}
            onClick={handleClick}
        >
            {children}
        </button>
    )
}

export default LinkButton