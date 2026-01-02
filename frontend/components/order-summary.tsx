"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag, ArrowRight, Loader2, Shield } from "lucide-react"
import { createOrder, validatePromoCode, sendOTP, verifyOTP } from "@/lib/api"
import { toast } from "sonner"

interface OrderSummaryProps {
  sessionId: string
  cartData?: any
  deliveryData?: any
}

export function OrderSummary({ sessionId, cartData, deliveryData }: OrderSummaryProps) {
  const router = useRouter()
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromoCode, setAppliedPromoCode] = useState<any>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otp, setOtp] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)

  // Calculate totals from cart data
  const subtotal = cartData?.subtotal || 0
  const deliveryFee = 15

  // Calculate discount based on promo code using useMemo to ensure recalculation
  const discount = useMemo(() => {
    if (!appliedPromoCode) {
      console.log('No promo code applied')
      return 0
    }
    
    if (!subtotal || subtotal <= 0) {
      console.log('Invalid subtotal:', subtotal)
      return 0
    }
    
    // Parse discount value - handle both string and number
    const discountValue = typeof appliedPromoCode.discount === 'string' 
      ? parseFloat(appliedPromoCode.discount) 
      : Number(appliedPromoCode.discount) || 0
    
    let calculatedDiscount = 0
    
    if (appliedPromoCode.type === 'percentage') {
      calculatedDiscount = (subtotal * discountValue) / 100
    } else if (appliedPromoCode.type === 'amount' || appliedPromoCode.type === 'fixed') {
      // For fixed amount, don't exceed subtotal
      calculatedDiscount = Math.min(discountValue, subtotal)
    }
    
    console.log('Discount calculation:', {
      appliedPromoCode,
      discountValue,
      type: appliedPromoCode.type,
      subtotal,
      calculatedDiscount,
      finalDiscount: Math.max(0, calculatedDiscount)
    })
    
    return Math.max(0, Math.round(calculatedDiscount * 100) / 100) // Round to 2 decimal places
  }, [appliedPromoCode, subtotal])

  const total = Math.max(0, subtotal - discount + deliveryFee)

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code")
      return
    }

    setApplyingPromo(true)
    try {
      // Trim and uppercase the code for consistency
      const codeToValidate = promoCode.trim().toUpperCase()
      const response = await validatePromoCode(codeToValidate)
      console.log('Promo code validation response:', response)
      if (response.success && response.data) {
        console.log('Setting applied promo code:', response.data)
        setAppliedPromoCode(response.data)
        toast.success("Promo code applied successfully!")
      } else {
        console.log('Promo code validation failed:', response.message)
        toast.error(response.message || "Invalid promo code")
        setAppliedPromoCode(null)
      }
    } catch (error) {
      console.error('Promo code validation error:', error)
      toast.error("Failed to validate promo code")
      setAppliedPromoCode(null)
    } finally {
      setApplyingPromo(false)
    }
  }

  const isFormValid = () => {
    if (!deliveryData) return false
    
    const requiredFields = ['full_name', 'email', 'phone_number', 'district', 'thana', 'full_address']
    const missingFields = requiredFields.filter(field => !deliveryData[field] || deliveryData[field].trim() === '')
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return false
    }

    if (!deliveryData.isEmailValid) {
      toast.error("Please enter a valid email address")
      return false
    }

    if (!deliveryData.isPhoneNumberValid) {
      toast.error("Please enter a valid phone number (format: 01XXX2XXXXXXXX)")
      return false
    }

    return true
  }

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [otpTimer])

  const handleSendOTP = async () => {
    if (!isFormValid()) {
      return
    }

    if (!deliveryData?.phone_number) {
      toast.error("Please enter your phone number")
      return
    }

    setSendingOtp(true)
    try {
      const response = await sendOTP(deliveryData.phone_number)
      if (response.success) {
        setOtpSent(true)
        setOtpTimer(300) // 5 minutes
        toast.success("OTP sent to your phone number")
      } else {
        toast.error(response.message || "Failed to send OTP")
      }
    } catch (error) {
      toast.error("Failed to send OTP")
      console.error(error)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 4) {
      toast.error("Please enter a valid 4-digit OTP")
      return
    }

    if (!deliveryData?.phone_number) {
      toast.error("Phone number is required")
      return
    }

    setVerifyingOtp(true)
    try {
      const response = await verifyOTP(deliveryData.phone_number, otp)
      if (response.success && response.data?.verified) {
        setOtpVerified(true)
        toast.success("Phone number verified successfully!")
      } else {
        toast.error(response.message || "Invalid OTP")
        setOtp("") // Clear OTP on failure
      }
    } catch (error) {
      toast.error("Failed to verify OTP")
      console.error(error)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleProceed = async () => {
    if (!isFormValid()) {
      return
    }

    if (!cartData || !cartData.items || cartData.items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    // Check OTP verification
    if (!otpVerified) {
      toast.error("Please verify your phone number with OTP first")
      return
    }

    setProcessing(true)
    try {
      // Get user_id from localStorage if user is logged in
      let userId: string | null = null
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          userId = user.id || user.user_id || null
        } catch (e) {
          console.error('Failed to parse user data:', e)
        }
      }

      const orderData: any = {
        session_id: sessionId,
        customer: {
          full_name: deliveryData.full_name,
          email: deliveryData.email,
          phone_number: deliveryData.phone_number,
          district: deliveryData.district,
          thana: deliveryData.thana,
          full_address: deliveryData.full_address
        },
        delivery_fee: deliveryFee
      }

      // Add user_id if user is logged in
      if (userId) {
        orderData.user_id = userId
      }

      // Add discount if promo code is applied
      if (appliedPromoCode) {
        if (appliedPromoCode.type === 'percentage') {
          orderData.discount_percentage = appliedPromoCode.discount
        } else if (appliedPromoCode.type === 'amount') {
          orderData.discount_amount = appliedPromoCode.discount
        }
      }

      console.log('Creating order with data:', orderData)
      const response = await createOrder(orderData)

      if (response.success) {
        toast.success("Order placed successfully!")
        // Redirect to orders page and force refresh
        setTimeout(() => {
          window.location.href = '/orders'
        }, 1500)
      } else {
        toast.error(response.message || "Failed to create order")
      }
    } catch (error) {
      toast.error("An error occurred while placing the order")
      console.error(error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-bold mb-6">Order Summary</h2>

      {/* Price Breakdown */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-semibold text-foreground">৳{subtotal.toFixed(2)}</span>
        </div>
        {appliedPromoCode && discount > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Discount {appliedPromoCode?.type === 'percentage' ? `(-${appliedPromoCode.discount}%)` : `(${appliedPromoCode.code})`}</span>
            <span className="font-semibold text-red-500">-৳{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery Fee</span>
          <span className="font-semibold text-foreground">৳{deliveryFee.toFixed(2)}</span>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-bold">৳{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Add promo code"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value)
                if (appliedPromoCode) {
                  setAppliedPromoCode(null)
                }
              }}
              className="pl-10 bg-background"
              disabled={applyingPromo}
            />
          </div>
          <Button 
            variant="default" 
            className="px-6"
            onClick={handleApplyPromoCode}
            disabled={applyingPromo || !promoCode.trim()}
          >
            {applyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </Button>
        </div>
        {appliedPromoCode && (
          <p className="text-sm text-green-600">Promo code "{appliedPromoCode.code}" applied!</p>
        )}
      </div>

      {/* OTP Verification Section */}
      {deliveryData?.phone_number && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Phone Verification</h3>
          </div>
          
          {!otpSent ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSendOTP}
              disabled={sendingOtp || !deliveryData?.isPhoneNumberValid}
            >
              {sendingOtp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP to Verify Phone"
              )}
            </Button>
          ) : !otpVerified ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-2">
                Enter the 4-digit OTP sent to {deliveryData.phone_number}
                {otpTimer > 0 && (
                  <span className="ml-2 text-primary">
                    (Resend in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setOtp(value)
                  }}
                  maxLength={4}
                  className="flex-1 text-center text-lg tracking-widest"
                  disabled={verifyingOtp}
                />
                <Button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={verifyingOtp || otp.length !== 4}
                >
                  {verifyingOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
              {otpTimer === 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleSendOTP}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending..." : "Resend OTP"}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Shield className="h-4 w-4" />
              <span>Phone number verified ✓</span>
            </div>
          )}
        </div>
      )}

      {/* Proceed Button */}
      <Button 
        className="w-full h-12 text-base" 
        size="lg"
        onClick={handleProceed}
        disabled={processing || !cartData || cartData.items?.length === 0 || !otpVerified}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Confirm Order
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  )
}
