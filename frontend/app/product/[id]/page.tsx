"use client"

import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductDetails } from "@/components/product-details"
import { ProductTabs } from "@/components/product-tabs"
import { RelatedProducts } from "@/components/related-products"

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <ProductDetails productId={productId} />
        <ProductTabs productId={productId} />
        <RelatedProducts productId={productId} />
      </div>

      <Footer />
    </div>
  )
}
