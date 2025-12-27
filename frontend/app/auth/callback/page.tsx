"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lcwwwlfzpiwovrhhmwib.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjd3d3bGZ6cGl3b3ZyaGhtd2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTk5MTAsImV4cCI6MjA4MDU5NTkxMH0.ickBC8Rglp6fBM7OULayfywgTxa0e8pUHGwuy9fdfIU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Processing authentication...")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          const errorMsg = errorDescription ? decodeURIComponent(errorDescription) : error
          setStatus("Authentication failed. Redirecting...")
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent(errorMsg)}`)
          }, 1500)
          return
        }

        // Get code from URL params
        const code = searchParams.get('code')
        
        if (code) {
          setStatus("Exchanging authorization code...")
          
          // Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Exchange error:', exchangeError)
            setStatus("Authentication failed. Redirecting...")
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent(exchangeError.message)}`)
            }, 1500)
            return
          }

          if (data.session && data.user) {
            setStatus("Storing session...")
            
            // Store user data in localStorage
            localStorage.setItem('supabase.auth.token', data.session.access_token)
            localStorage.setItem('session', JSON.stringify(data.session))
            localStorage.setItem('user', JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0]
            }))

            setStatus("Success! Redirecting...")
            
            // Redirect to home page
            setTimeout(() => {
              router.push('/')
              router.refresh()
            }, 1000)
            return
          }
        }

        // If no code, check if we already have a session (might have been set automatically)
        setStatus("Checking session...")
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session && !sessionError) {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            setStatus("Storing session...")
            
            localStorage.setItem('supabase.auth.token', session.access_token)
            localStorage.setItem('session', JSON.stringify(session))
            localStorage.setItem('user', JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
            }))

            setStatus("Success! Redirecting...")
            setTimeout(() => {
              router.push('/')
              router.refresh()
            }, 1000)
            return
          }
        }

        // If we get here, no code and no session
        setStatus("No authorization code found. Redirecting...")
        setTimeout(() => {
          router.push('/login?error=No authorization code received. Please try again.')
        }, 1500)
      } catch (err) {
        console.error('Callback error:', err)
        setStatus("An error occurred. Redirecting...")
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'unknown_error')}`)
        }, 1500)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}

