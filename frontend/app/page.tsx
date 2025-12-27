import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { NewArrivals } from "@/components/new-arrivals"
import { TopSelling } from "@/components/top-selling"
import { BestSeller } from "@/components/best-seller"
import { BrowseByDress } from "@/components/browse-by-dress"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <NewArrivals />
      <BestSeller />
      <TopSelling />
      <BrowseByDress />
      <Testimonials />
      <Footer />
    </div>
  )
}
