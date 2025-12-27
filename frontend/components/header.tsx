"use client"

import { useState, useEffect } from "react"
import { Search, Heart, ShoppingCart, User, LogIn, LogOut, UserCircle, Package, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in (check localStorage or session)
    const checkAuth = () => {
      // Check for Supabase session or auth token
      const authToken = localStorage.getItem('supabase.auth.token')
      const session = localStorage.getItem('session')
      
      if (authToken || session) {
        setIsLoggedIn(true)
        // Try to get user info from localStorage
        const userData = localStorage.getItem('user')
        if (userData) {
          try {
            const user = JSON.parse(userData)
            setUserEmail(user.email || null)
            setUserName(user.name || user.email?.split('@')[0] || null)
          } catch (e) {
            // Ignore parse errors
          }
        }
      } else {
        setIsLoggedIn(false)
      }
    }

    checkAuth()
    // Check periodically for auth changes
    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('supabase.auth.token')
    localStorage.removeItem('session')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUserEmail(null)
    setUserName(null)
    // Redirect to home or login
    window.location.href = '/'
  }

  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (userEmail) {
      return userEmail[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
                VELORA
              </h1>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/products" className="text-sm font-medium hover:opacity-70 transition-opacity">
                Products
              </Link>
              <Link href="/products?tag=New Arrival" className="text-sm font-medium hover:opacity-70 transition-opacity">
                New Arrivals
              </Link>
              <Link href="/products" className="text-sm font-medium hover:opacity-70 transition-opacity">
                Categories
              </Link>
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
            
            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {isLoggedIn ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={userName || "User"} />
                      <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isLoggedIn ? (
                  <>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName || "User"}</p>
                        {userEmail && (
                          <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/settings" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="flex items-center cursor-pointer">
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Login</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup" className="flex items-center cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Sign Up</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
