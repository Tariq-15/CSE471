import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { BrandLogos } from "@/components/brand-logos"
import { NewArrivals } from "@/components/new-arrivals"
import { TopSelling } from "@/components/top-selling"
import { BrowseByDress } from "@/components/browse-by-dress"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <BrandLogos />
      <NewArrivals />
      <TopSelling />
      <BrowseByDress />
      <Testimonials />
      <Footer />
    </div>
  )
}
