"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserProfile, updateUserProfile, type UserProfile } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get user ID from localStorage
    const userData = localStorage.getItem('user')
    const session = localStorage.getItem('session')
    
    let foundUserId: string | null = null
    
    if (userData) {
      try {
        const user = JSON.parse(userData)
        foundUserId = user.id || user.user_id || null
        if (foundUserId) {
          setUserId(foundUserId)
        }
      } catch (e) {
        console.error('Failed to parse user data:', e)
      }
    } else if (session) {
      // Try to extract user_id from session if available
      try {
        const sessionData = JSON.parse(session)
        foundUserId = sessionData.user_id || null
        if (foundUserId) {
          setUserId(foundUserId)
        }
      } catch (e) {
        // Ignore
      }
    }

    // Check the parsed value directly, not the state variable
    if (!foundUserId) {
      toast.error("Please login to view your profile")
      window.location.href = '/login'
      return
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchProfile()
    }
  }, [userId])

  const fetchProfile = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await getUserProfile(userId)
      if (response.success && response.data) {
        setProfile(response.data)
      } else {
        toast.error(response.message || "Failed to load profile")
      }
    } catch (error) {
      toast.error("Failed to load profile")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userId || !profile) return

    setSaving(true)
    try {
      const response = await updateUserProfile({
        ...profile,
        user_id: userId
      })
      
      if (response.success) {
        toast.success("Profile updated successfully")
        if (response.data) {
          setProfile(response.data)
        }
      } else {
        toast.error(response.message || "Failed to update profile")
      }
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof UserProfile, value: any) => {
    if (profile) {
      setProfile({ ...profile, [field]: value })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load profile</p>
            <Button asChild className="mt-4">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

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
          <span className="text-foreground">Profile</span>
        </div>

        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Personal Information */}
          <div className="border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profile.first_name || ''}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profile.last_name || ''}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={profile.phone_number || ''}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            {profile.email && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch
                id="email_notifications"
                checked={profile.email_notifications ?? true}
                onCheckedChange={(checked) => handleChange('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="order_updates">Order Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about order status changes
                </p>
              </div>
              <Switch
                id="order_updates"
                checked={profile.order_updates ?? true}
                onCheckedChange={(checked) => handleChange('order_updates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promotional_emails">Promotional Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive special offers and promotions
                </p>
              </div>
              <Switch
                id="promotional_emails"
                checked={profile.promotional_emails ?? false}
                onCheckedChange={(checked) => handleChange('promotional_emails', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms_notifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via SMS
                </p>
              </div>
              <Switch
                id="sms_notifications"
                checked={profile.sms_notifications ?? false}
                onCheckedChange={(checked) => handleChange('sms_notifications', checked)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}

