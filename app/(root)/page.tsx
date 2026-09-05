import { AboutSection } from "@/components/landing/AboutSection"
import { HeroSection } from "@/components/landing/HeroSection"
import { ServicesSection } from "@/components/landing/ServicesSection"
import { ContactSection } from "@/components/landing/ContactSection"

const LandingPage = () => {
    return (
       <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <ContactSection />
       </main>
    )
}

export default LandingPage