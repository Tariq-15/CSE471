import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative bg-accent overflow-hidden">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="max-w-2xl">
            <h2 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 text-balance">
              FIND CLOTHES THAT MATCHES YOUR STYLE
            </h2>
            <p className="text-muted-foreground text-base mb-8 max-w-lg">
              Browse through our diverse range of meticulously crafted garments, designed to bring out your
              individuality and cater to your sense of style.
            </p>
            <Button size="lg" className="rounded-full px-12 text-base h-12">
              Shop Now
            </Button>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12">
              <div>
                <div className="text-3xl font-bold">200+</div>
                <div className="text-sm text-muted-foreground">International Brands</div>
              </div>
              <div className="border-l border-border pl-8">
                <div className="text-3xl font-bold">2,000+</div>
                <div className="text-sm text-muted-foreground">High-Quality Products</div>
              </div>
              <div className="border-l border-border pl-8">
                <div className="text-3xl font-bold">30,000+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <img
              src="/placeholder.svg?height=600&width=500"
              alt="Fashionable couple"
              className="w-full h-[600px] object-cover rounded-lg"
            />
            {/* Decorative Stars */}
            <Sparkles className="absolute top-12 right-8 w-12 h-12 text-foreground" />
            <Sparkles className="absolute bottom-24 left-8 w-8 h-8 text-foreground" />
          </div>
        </div>
      </div>
    </section>
  )
}
