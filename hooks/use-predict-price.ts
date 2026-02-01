"use client"

import { useState } from "react"

interface PredictionResult {
  predicted_price_low: string
  predicted_price_high: string
  unit: string
  source?: string
}

interface FormData {
  property_type: string
  sector: string
  bedRoom: number
  bathroom: number
  balcony: number
  agePossession: string
  built_up_area: number
  servant_room: number
  store_room: number
  furnishing_type: string
  luxury_category: string
  floor_category: string
}

export function usePredictPrice() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setResult(null)
    setError(null)
  }

  async function predict(data: FormData, jsonResult?: PredictionResult) {
    if (jsonResult) {
      setResult(jsonResult)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch("http://127.0.0.1:8000/predict_price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorMessage
        } catch (e) {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const prediction = await response.json()
      setResult(prediction)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return { predict, loading, result, error, reset }
}