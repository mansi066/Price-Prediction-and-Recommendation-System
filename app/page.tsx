"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Hero from "@/components/hero"
import PricePrediction from "@/components/price-prediction"
import PropertyRecommendation from "@/components/property-recommendation"
import About from "@/components/about"
import Footer from "@/components/footer"

export default function Home() {
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false)

  return (
    <main className="w-full">
      <Navbar onRecommendationClick={() => setIsRecommendationOpen(true)} />
      <Hero />
      <PricePrediction />
      <PropertyRecommendation isOpen={isRecommendationOpen} onClose={() => setIsRecommendationOpen(false)} />
      <About />
      <Footer />
    </main>
  )
}
