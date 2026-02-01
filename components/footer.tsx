"use client"

import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-2">Property Price Predict</h3>
            <p className="opacity-80 text-sm">Your trusted partner in real estate valuation</p>
          </div>
          <div className="flex gap-6">
            {[
              { icon: Facebook, label: "Facebook" },
              { icon: Twitter, label: "Twitter" },
              { icon: Linkedin, label: "LinkedIn" },
              { icon: Instagram, label: "Instagram" },
            ].map((social, i) => {
              const Icon = social.icon
              return (
                <a
                  key={i}
                  href="#"
                  title={social.label}
                  className="flex items-center justify-center w-11 h-11 bg-white/10 rounded-full text-white hover:bg-gradient-to-r hover:from-[#6c63ff] hover:to-[#8e75ff] hover:translate-y-1 transition-all"
                >
                  <Icon size={20} />
                </a>
              )
            })}
          </div>
        </div>
        <div className="text-center pt-8 border-t border-white/10 opacity-70 text-sm">
          <p>&copy; 2025 Property Price Predict. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
