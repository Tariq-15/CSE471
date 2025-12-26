import { Search, Heart, ShoppingCart, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
                TAAGA WOMEN
              </h1>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/products" className="text-sm font-medium hover:opacity-70 transition-opacity">
                Products
              </Link>
              <button className="text-sm font-medium hover:opacity-70 transition-opacity">New Arrivals</button>
              <button className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1">
                Categories
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="text-sm font-medium hover:opacity-70 transition-opacity">About Us</button>
            </nav>
          </div>

          {/* Search and Icons */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-muted rounded-full px-4 py-2 max-w-md w-full">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for products..."
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="w-5 h-5" />
            </Button>
            <Link href="/checkout">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
