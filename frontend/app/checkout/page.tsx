import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartItems } from "@/components/cart-items"
import { OrderSummary } from "@/components/order-summary"
import { DeliveryForm } from "@/components/delivery-form"
import Link from "next/link"

export default function CheckoutPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Cart</span>
        </div>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column - Cart Items and Delivery Form */}
          <div className="space-y-8">
            <CartItems />
            <DeliveryForm />
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <OrderSummary />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
