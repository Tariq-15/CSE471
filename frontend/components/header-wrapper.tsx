"use client"

import { Suspense } from "react"
import { Header } from "./header"

export function HeaderWrapper() {
  return (
    <Suspense fallback={
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
      </header>
    }>
      <Header />
    </Suspense>
  )
}

