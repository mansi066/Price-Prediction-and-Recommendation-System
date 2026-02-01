"use client"

import { CheckCircle, Star, Users, Zap } from "lucide-react"

const aboutCards = [
  {
    icon: CheckCircle,
    title: "Accurate Predictions",
    description: "Our AI-powered algorithm analyzes market data to provide precise property valuations.",
  },
  {
    icon: Star,
    title: "User Friendly",
    description: "Simple and intuitive interface designed for everyone, no technical knowledge required.",
  },
  {
    icon: Users,
    title: "Expert Team",
    description: "Backed by real estate professionals with years of industry experience.",
  },
  {
    icon: Zap,
    title: "Fast Results",
    description: "Get instant property valuations in seconds, not hours or days.",
  },
]

export default function About() {
  return (
    <section id="about" className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-bold text-center mb-16 text-gray-800">About Us</h2>
        <div className="grid grid-cols-4 gap-6">
          {aboutCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div
                key={i}
                className="bg-white p-8 rounded-xl text-center shadow-sm hover:shadow-xl hover:translate-y-2 transition-all cursor-pointer"
              >
                <div className="flex justify-center mb-4">
                  <Icon size={40} className="text-[#6c63ff]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{card.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
