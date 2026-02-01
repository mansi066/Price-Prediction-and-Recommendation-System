"use client"

import type React from "react"

import { Home } from "lucide-react"
import Link from "next/link"

interface NavbarProps {
  onRecommendationClick?: () => void
}

export default function Navbar({ onRecommendationClick }: NavbarProps) {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <nav className="sticky top-0 bg-white shadow-md z-100" style={{ animation: "slideDown 0.5s ease" }}>
      <div className="max-w-7xl mx-auto px-10 flex justify-between items-center h-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-[#6c63ff] hover:scale-105 transition-transform"
        >
          <Home size={24} />
          <span>Property Price Predict</span>
        </Link>
        <ul className="flex list-none gap-10">
          <li>
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, "home")}
              className="text-gray-700 font-medium hover:text-[#6c63ff] transition-colors relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6c63ff] to-[#8e75ff] group-hover:w-full transition-all"></span>
            </a>
          </li>
          <li>
            <a
              href="#predict"
              onClick={(e) => handleNavClick(e, "predict")}
              className="text-gray-700 font-medium hover:text-[#6c63ff] transition-colors relative group"
            >
              Predict
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6c63ff] to-[#8e75ff] group-hover:w-full transition-all"></span>
            </a>
          </li>
          <li>
            <a
              href="#recommend"
              onClick={(e) => {
                e.preventDefault()
                onRecommendationClick?.()
              }}
              className="text-gray-700 font-medium hover:text-[#6c63ff] transition-colors relative group"
            >
              Recommend
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6c63ff] to-[#8e75ff] group-hover:w-full transition-all"></span>
            </a>
          </li>
          <li>
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, "about")}
              className="text-gray-700 font-medium hover:text-[#6c63ff] transition-colors relative group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6c63ff] to-[#8e75ff] group-hover:w-full transition-all"></span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
