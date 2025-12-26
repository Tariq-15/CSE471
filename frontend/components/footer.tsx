import { Facebook, Twitter, Instagram, Github } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-accent py-16">
      <div className="container mx-auto px-4">
        {/* Newsletter */}
        <div className="bg-black text-white rounded-2xl p-8 lg:p-12 mb-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <h3 className="text-3xl lg:text-4xl font-bold max-w-lg">STAY UPTO DATE ABOUT OUR LATEST OFFERS</h3>
          <div className="w-full lg:w-auto space-y-4">
            <Input
              placeholder="Enter your email address"
              className="bg-white text-black rounded-full px-6 py-6 min-w-[300px]"
            />
            <Button className="w-full rounded-full px-6 py-6 bg-white text-black hover:bg-white/90">
              Subscribe to Newsletter
            </Button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-4">TAAGA WOMEN</h2>
            <p className="text-sm text-muted-foreground mb-6">
              We have clothes that suits your style and which you're proud to wear. From women to men.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-black text-white border-black hover:bg-black/90 hover:text-white"
              >
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                <Github className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm tracking-wider">COMPANY</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Career
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm tracking-wider">HELP</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Customer Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Delivery Details
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm tracking-wider">FAQ</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Account
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Manage Deliveries
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Orders
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Payments
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-sm tracking-wider">RESOURCES</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Free eBooks
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Development Tutorial
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  How to - Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Youtube Playlist
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Shop.co © 2000-2023, All Rights Reserved</p>
          <div className="flex gap-3">
            <div className="bg-white rounded-lg px-3 py-2">
              <img src="/placeholder.svg?height=24&width=40" alt="Visa" className="h-6" />
            </div>
            <div className="bg-white rounded-lg px-3 py-2">
              <img src="/placeholder.svg?height=24&width=40" alt="Mastercard" className="h-6" />
            </div>
            <div className="bg-white rounded-lg px-3 py-2">
              <img src="/placeholder.svg?height=24&width=40" alt="PayPal" className="h-6" />
            </div>
            <div className="bg-white rounded-lg px-3 py-2">
              <img src="/placeholder.svg?height=24&width=40" alt="Apple Pay" className="h-6" />
            </div>
            <div className="bg-white rounded-lg px-3 py-2">
              <img src="/placeholder.svg?height=24&width=40" alt="Google Pay" className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
