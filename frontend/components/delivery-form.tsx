"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface DeliveryFormProps {
  onDataChange?: (data: any) => void
}

export function DeliveryForm({ onDataChange }: DeliveryFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    district: "",
    thana: "",
    full_address: ""
  })

  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")

  // Use ref to avoid dependency issues
  const onDataChangeRef = useRef(onDataChange)
  useEffect(() => {
    onDataChangeRef.current = onDataChange
  }, [onDataChange])

  // Notify parent of data changes
  useEffect(() => {
    if (onDataChangeRef.current) {
      onDataChangeRef.current({
        ...formData,
        isEmailValid: !emailError && formData.email.length > 0,
        isPhoneNumberValid: !phoneError && formData.phone_number.length > 0
      })
    }
  }, [formData, emailError, phoneError])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Phone number format: 01XXX2XXXXXXXX (01 + any digit but 2 + 8 digits)
    const phoneRegex = /^01[013456789][0-9]{8}$/
    return phoneRegex.test(phone)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Validate email
    if (field === "email") {
      if (value && !validateEmail(value)) {
        setEmailError("Please enter a valid email address")
      } else {
        setEmailError("")
      }
    }

    // Validate phone number
    if (field === "phone_number") {
      if (value && !validatePhoneNumber(value)) {
        setPhoneError("Phone number must be in format: 01XXX2XXXXXXXX (01 + any digit but 2 + 8 digits)")
      } else {
        setPhoneError("")
      }
    }
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-bold mb-6">Delivery Information</h2>

      <form className="space-y-5">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">
            Full name <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="fullName" 
            placeholder="Enter full name" 
            required 
            className="bg-background"
            value={formData.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
          />
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email address <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="Enter email address" 
            required 
            className={`bg-background ${emailError ? 'border-red-500' : ''}`}
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
          {emailError && (
            <p className="text-sm text-red-500">{emailError}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone number <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 border border-input rounded-md bg-background">
              <span className="text-2xl">🇧🇩</span>
              <span className="text-sm">▼</span>
            </div>
            <div className="flex-1">
              <Input 
                id="phone" 
                type="tel" 
                placeholder="01XXXXXXXXX" 
                required 
                className={`bg-background ${phoneError ? 'border-red-500' : ''}`}
                value={formData.phone_number}
                onChange={(e) => handleChange("phone_number", e.target.value)}
              />
              {phoneError && (
                <p className="text-sm text-red-500 mt-1">{phoneError}</p>
              )}
            </div>
          </div>
        </div>

        {/* District and Thana */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="district">
              District <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="district" 
              placeholder="Enter district" 
              required 
              className="bg-background"
              value={formData.district}
              onChange={(e) => handleChange("district", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thana">
              Thana <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="thana" 
              placeholder="Enter thana" 
              required 
              className="bg-background"
              value={formData.thana}
              onChange={(e) => handleChange("thana", e.target.value)}
            />
          </div>
        </div>

        {/* Full Address */}
        <div className="space-y-2">
          <Label htmlFor="address">
            Full Address<span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="address"
            placeholder="Enter full Address"
            required
            className="min-h-[120px] bg-background resize-none"
            value={formData.full_address}
            onChange={(e) => handleChange("full_address", e.target.value)}
          />
        </div>
      </form>
    </div>
  )
}
