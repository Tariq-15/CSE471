import { Star } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ProductCardProps {
  product: {
    id: string | number
    name: string
    price: number
    image: string
    rating: number
  }
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-none bg-transparent group cursor-pointer">
      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted mb-4">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="space-y-2">
        <h3 className="font-medium text-sm leading-tight line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-1">{product.rating}/5</span>
        </div>
        <p className="font-bold text-lg">${product.price.toFixed(2)}</p>
      </div>
    </Card>
  )
}
