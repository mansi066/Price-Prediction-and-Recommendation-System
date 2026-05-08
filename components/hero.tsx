"use client"

import Image from "next/image"

export default function Hero() {
  const handlePredictClick = () => {
    const element = document.getElementById("predict")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <section
      id="home"
      className="flex items-center justify-between min-h-screen px-10 py-20 bg-gradient-to-r from-[#6c63ff] to-[#8e75ff] gap-20"
    >
      <div className="flex-1 text-white" style={{ animation: "fadeInLeft 0.8s ease" }}>
        <h1 className="text-6xl font-bold mb-5 leading-tight">Easy Way to Predict Your Property Price</h1>
        <p className="text-2xl mb-10 opacity-95 font-light">Estimate your property value accurately with AI.</p>
        <button
          onClick={handlePredictClick}
          className="px-8 py-4 bg-white text-[#6c63ff] font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all uppercase tracking-wide"
        >
          Predict Now
        </button>
      </div>
      <div
        className="flex-1 relative h-96 rounded-xl shadow-2xl overflow-hidden"
        style={{
          animation: "fadeInRight 0.8s ease",
        }}
      >
        <Image
          src="/house-for-sale.png"
          alt="Property for sale"
          fill
          priority
          className="object-contain"
        />
      </div>
    </section>
  )
}
