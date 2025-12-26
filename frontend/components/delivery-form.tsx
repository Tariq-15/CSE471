"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function DeliveryForm() {
  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-bold mb-6">Delivery Information</h2>

      <form className="space-y-5">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">
            Full name <span className="text-red-500">*</span>
          </Label>
          <Input id="fullName" placeholder="Enter full name" required className="bg-background" />
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email address <span className="text-red-500">*</span>
          </Label>
          <Input id="email" type="email" placeholder="Enter email address" required className="bg-background" />
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
            <Input id="phone" type="tel" placeholder="Enter phone number" required className="flex-1 bg-background" />
          </div>
        </div>

        {/* District and Thana */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="district">
              District <span className="text-red-500">*</span>
            </Label>
            <Input id="district" placeholder="Enter email address" required className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thana">
              Thana <span className="text-red-500">*</span>
            </Label>
            <Input id="thana" placeholder="Enter email address" required className="bg-background" />
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
          />
        </div>
      </form>
    </div>
  )
}
