"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
}

export function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const div = divRef.current
    if (!div) return

    const onMouseMove = (e: MouseEvent) => {
      const rect = div.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      div.style.setProperty("--mouse-x", `${x}px`)
      div.style.setProperty("--mouse-y", `${y}px`)
    }

    div.addEventListener("mousemove", onMouseMove)
    return () => {
      div.removeEventListener("mousemove", onMouseMove)
    }
  }, [])

  if (!isMounted) return <div className={className}>{children}</div>

  return (
    <div
      ref={divRef}
      className={`relative group overflow-hidden rounded-xl transition-all duration-300 ${className}`}
      style={
        {
          "--mouse-x": "0px",
          "--mouse-y": "0px",
        } as React.CSSProperties & { "--mouse-x": string; "--mouse-y": string }
      }
    >
      <style>{`
        [style*="--mouse-x"] {
          position: relative;
        }
        [style*="--mouse-x"]::before {
          content: '';
          position: absolute;
          left: var(--mouse-x);
          top: var(--mouse-y);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(108, 99, 255, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        [style*="--mouse-x"]:hover::before {
          opacity: 1;
        }
      `}</style>
      {children}
    </div>
  )
}
