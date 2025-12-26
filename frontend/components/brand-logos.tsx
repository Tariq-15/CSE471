export function BrandLogos() {
  const brands = ["VERSACE", "ZARA", "GUCCI", "PRADA", "Calvin Klein"]

  return (
    <section className="bg-black text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center lg:justify-between gap-8 lg:gap-12">
          {brands.map((brand) => (
            <div key={brand} className="text-2xl lg:text-3xl font-bold tracking-wider">
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
