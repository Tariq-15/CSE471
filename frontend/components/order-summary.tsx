"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag, ArrowRight } from "lucide-react"

export function OrderSummary() {
  const [promoCode, setPromoCode] = useState("")

  const subtotal = 565
  const discount = 113
  const deliveryFee = 15
  const total = subtotal - discount + deliveryFee

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-bold mb-6">Order Summary</h2>

      {/* Price Breakdown */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-semibold text-foreground">${subtotal}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Discount (-20%)</span>
          <span className="font-semibold text-red-500">-${discount}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery Fee</span>
          <span className="font-semibold text-foreground">${deliveryFee}</span>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-bold">${total}</span>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Add promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <Button variant="default" className="px-6">
          Apply
        </Button>
      </div>

      {/* Proceed Button */}
      <Button className="w-full h-12 text-base" size="lg">
        Proceed
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  )
}
