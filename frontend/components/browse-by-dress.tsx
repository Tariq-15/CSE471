export function BrowseByDress() {
  const categories = [
    {
      name: "T-Shirt",
      image: "/placeholder.svg?height=400&width=300",
    },
    {
      name: "Shirt",
      image: "/placeholder.svg?height=400&width=300",
    },
    {
      name: "Tops",
      image: "/placeholder.svg?height=400&width=300",
    },
    {
      name: "Sports",
      image: "/placeholder.svg?height=400&width=300",
    },
  ]

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="bg-accent rounded-3xl p-8 lg:p-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12">BROWSE BY DRESS</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.map((category) => (
              <div
                key={category.name}
                className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-[4/3] bg-white"
              >
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <h3 className="absolute bottom-6 left-6 text-white text-3xl font-bold">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
