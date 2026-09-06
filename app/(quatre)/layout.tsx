import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/quatre/Navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navigation />
            {children}
            <Footer/>
        </>
    );
}