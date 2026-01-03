"use client"

import { useState, useEffect } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { CartItems } from "@/components/cart-items"
import { OrderSummary } from "@/components/order-summary"
import { DeliveryForm } from "@/components/delivery-form"
import Link from "next/link"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [cartData, setCartData] = useState<any>(null)
  const [deliveryData, setDeliveryData] = useState<any>(null)

  useEffect(() => {
    // Get or create session_id from localStorage
    let session_id = localStorage.getItem('session_id')
    if (!session_id) {
      // Generate a new session ID
      session_id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('session_id', session_id)
    }
    setSessionId(session_id)
  }, [])

  const handleCartUpdate = () => {
    // Trigger cart refresh if needed
    if (sessionId) {
      // CartItems component will handle fetching
    }
  }

  const handleDeliveryDataChange = (data: any) => {
    setDeliveryData(data)
  }

  return (
    <div className="min-h-screen">
      <HeaderWrapper />

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
            {sessionId && (
              <CartItems 
                sessionId={sessionId} 
                onCartUpdate={handleCartUpdate}
                onCartDataChange={setCartData}
              />
            )}
            <DeliveryForm onDataChange={handleDeliveryDataChange} />
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            {sessionId && (
              <OrderSummary 
                sessionId={sessionId}
                cartData={cartData}
                deliveryData={deliveryData}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
