"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { getProductCategories } from "@/lib/api"

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize from URL params or defaults
  const minPriceFromUrl = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : 0
  const maxPriceFromUrl = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : 200
  const colorFromUrl = searchParams.get('color') || ''
  const categoryFromUrl = searchParams.get('category') || 'all'
  
  const [priceRange, setPriceRange] = useState<number[]>([minPriceFromUrl, maxPriceFromUrl])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([categoryFromUrl])
  const [selectedColors, setSelectedColors] = useState<string[]>(colorFromUrl ? [colorFromUrl] : [])
  const [showPrice, setShowPrice] = useState(true)
  const [showColors, setShowColors] = useState(true)
  const [categories, setCategories] = useState<Array<{ id: string; label: string; value: string }>>([
    { id: "all", label: "All", value: "all" }
  ])
  const [loadingCategories, setLoadingCategories] = useState(true)
  
  // Fetch categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true)
        const response = await getProductCategories()
        if (response.success && response.data) {
          // Format categories: add "All" option and keep original category names
          const formattedCategories = [
            { id: "all", label: "All", value: "all" },
            ...response.data.map(cat => ({
              id: cat.toLowerCase().replace(/\s+/g, '-'),
              label: cat,
              value: cat // Use actual category name from database
            }))
          ]
          setCategories(formattedCategories)
          
          // Update selected category based on URL param
          if (categoryFromUrl && categoryFromUrl !== 'all') {
            // Find the category ID that matches the URL param
            const matchingCategory = formattedCategories.find(c => c.value === categoryFromUrl)
            if (matchingCategory) {
              setSelectedCategories([matchingCategory.id])
            } else {
              setSelectedCategories(['all'])
            }
          } else {
            setSelectedCategories(['all'])
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])
  
  // Update state when URL params change
  useEffect(() => {
    setPriceRange([minPriceFromUrl, maxPriceFromUrl])
    
    // Match URL category param to category ID
    if (categoryFromUrl && categoryFromUrl !== 'all') {
      const matchingCategory = categories.find(c => c.value === categoryFromUrl)
      if (matchingCategory) {
        setSelectedCategories([matchingCategory.id])
      } else {
        setSelectedCategories(['all'])
      }
    } else {
      setSelectedCategories(['all'])
    }
    
    setSelectedColors(colorFromUrl ? [colorFromUrl] : [])
  }, [minPriceFromUrl, maxPriceFromUrl, colorFromUrl, categoryFromUrl, categories])

  const colors = [
    { name: "Green", value: "bg-green-500", apiValue: "Green" },
    { name: "Red", value: "bg-red-500", apiValue: "Red" },
    { name: "Yellow", value: "bg-yellow-400", apiValue: "Yellow" },
    { name: "Orange", value: "bg-orange-500", apiValue: "Orange" },
    { name: "Cyan", value: "bg-cyan-400", apiValue: "Cyan" },
    { name: "Blue", value: "bg-blue-600", apiValue: "Blue" },
    { name: "Purple", value: "bg-purple-600", apiValue: "Purple" },
    { name: "Pink", value: "bg-pink-500", apiValue: "Pink" },
    { name: "White", value: "bg-white border border-gray-300", apiValue: "White" },
    { name: "Black", value: "bg-black", apiValue: "Black" },
  ]
  
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Reset page to 1 when filters change
    params.delete('page')
    
    // Set price filters
    if (priceRange[0] > 0) {
      params.set('min_price', priceRange[0].toString())
    } else {
      params.delete('min_price')
    }
    
    if (priceRange[1] < 200) {
      params.set('max_price', priceRange[1].toString())
    } else {
      params.delete('max_price')
    }
    
    // Set category filter
    const selectedCategory = selectedCategories.find(c => c !== 'all') || 'all'
    if (selectedCategory !== 'all') {
      params.set('category', selectedCategory)
    } else {
      params.delete('category')
    }
    
    // Set color filter (only one color at a time for now)
    if (selectedColors.length > 0) {
      params.set('color', selectedColors[0])
    } else {
      params.delete('color')
    }
    
    router.push(`/products?${params.toString()}`)
  }
  
  const handleCategoryChange = (categoryId: string) => {
    // Immediately apply category filter when clicked
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page') // Reset to page 1
    
    if (categoryId === 'all') {
      params.delete('category')
      setSelectedCategories(['all'])
    } else {
      // Find the actual category name from the categories list
      const category = categories.find(c => c.id === categoryId)
      if (category && 'value' in category) {
        // Use the actual category name from database (stored in 'value')
        params.set('category', (category as any).value)
        setSelectedCategories([categoryId])
      }
    }
    
    router.push(`/products?${params.toString()}`)
  }

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">Filters</h2>
          <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Categories */}
        <div className="mb-6">
          {loadingCategories ? (
            <div className="text-sm text-muted-foreground">Loading categories...</div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => {
                      handleCategoryChange(checked ? category.id : 'all')
                    }}
                  />
                  <Label 
                    htmlFor={category.id} 
                    className="ml-2 text-sm cursor-pointer"
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-6">
          <button onClick={() => setShowPrice(!showPrice)} className="flex items-center justify-between w-full mb-4">
            <h3 className="font-semibold">Price</h3>
            <ChevronUp className={`w-4 h-4 transition-transform ${showPrice ? "" : "rotate-180"}`} />
          </button>
          {showPrice && (
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
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
                    // Only allow one color selection at a time
                    if (selectedColors.includes(color.apiValue)) {
                      setSelectedColors([])
                    } else {
                      setSelectedColors([color.apiValue])
                    }
                  }}
                  className={`w-9 h-9 rounded-full ${color.value} ${
                    selectedColors.includes(color.apiValue) ? "ring-2 ring-black ring-offset-2" : ""
                  } hover:scale-110 transition-transform`}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Apply Filter Button */}
        <Button 
          onClick={applyFilters}
          className="w-full bg-black text-white hover:bg-black/90"
        >
          Apply Filter
        </Button>
      </div>
    </aside>
  )
}
