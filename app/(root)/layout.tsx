import Header from "@/components/landing/Header"
import { FloatingWhatsApp } from "@/components/essentials/FloatingWhatsApp"
import { Footer } from "@/components/landing/Footer"

const LandingLayout = ({ children }: LayoutProps<"/">) => {
    return (
        <>
            <Header />
            {children}
            <FloatingWhatsApp />
            <Footer />
        </>
    )
}

export default LandingLayout