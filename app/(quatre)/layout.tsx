import { Navigation } from "@/components/quatre/Navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navigation />
            {children}
        </>
    );
}