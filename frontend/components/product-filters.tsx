"use client"

import { useState } from "react"
import { SlidersHorizontal, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function ProductFilters() {
  const [priceRange, setPriceRange] = useState([50, 200])
  const [selectedCategories, setSelectedCategories] = useState(["all"])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [showPrice, setShowPrice] = useState(true)
  const [showColors, setShowColors] = useState(true)

  const categories = [
    { id: "all", label: "All" },
    { id: "t-shirts", label: "T-shirts" },
    { id: "shorts", label: "Shorts" },
    { id: "shirts", label: "Shirts" },
    { id: "hoodie", label: "Hoodie" },
    { id: "jeans", label: "Jeans" },
  ]

  const colors = [
    { name: "Green", value: "bg-green-500" },
    { name: "Red", value: "bg-red-500" },
    { name: "Yellow", value: "bg-yellow-400" },
    { name: "Orange", value: "bg-orange-500" },
    { name: "Cyan", value: "bg-cyan-400" },
    { name: "Blue", value: "bg-blue-600" },
    { name: "Purple", value: "bg-purple-600" },
    { name: "Pink", value: "bg-pink-500" },
    { name: "White", value: "bg-white border border-gray-300" },
    { name: "Black", value: "bg-black" },
  ]

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">Filters</h2>
          <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories([...selectedCategories, category.id])
                    } else {
                      setSelectedCategories(selectedCategories.filter((c) => c !== category.id))
                    }
                  }}
                />
                <Label htmlFor={category.id} className="ml-2 text-sm cursor-pointer">
                  {category.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <button onClick={() => setShowPrice(!showPrice)} className="flex items-center justify-between w-full mb-4">
            <h3 className="font-semibold">Price</h3>
            <ChevronUp className={`w-4 h-4 transition-transform ${showPrice ? "" : "rotate-180"}`} />
          </button>
          {showPrice && (
            <div className="space-y-4">
              <div className="relative pt-2">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">${priceRange[0]}</span>
                <span className="font-medium">${priceRange[1]}</span>
              </div>
            </div>
          )}
        </div>

        {/* Colors */}
        <div className="mb-6">
          <button onClick={() => setShowColors(!showColors)} className="flex items-center justify-between w-full mb-4">
            <h3 className="font-semibold">Colors</h3>
            <ChevronUp className={`w-4 h-4 transition-transform ${showColors ? "" : "rotate-180"}`} />
          </button>
          {showColors && (
            <div className="grid grid-cols-5 gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    if (selectedColors.includes(color.name)) {
                      setSelectedColors(selectedColors.filter((c) => c !== color.name))
                    } else {
                      setSelectedColors([...selectedColors, color.name])
                    }
                  }}
                  className={`w-9 h-9 rounded-full ${color.value} ${
                    selectedColors.includes(color.name) ? "ring-2 ring-black ring-offset-2" : ""
                  } hover:scale-110 transition-transform`}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Apply Filter Button */}
        <Button className="w-full bg-black text-white hover:bg-black/90">Apply Filter</Button>
      </div>
    </aside>
  )
}
