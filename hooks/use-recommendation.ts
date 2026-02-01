"use client"

import { useState } from "react"

interface LocationResult {
  property: string
  distance_km: number
  address?: string
}

interface SearchLocationResponse {
  location: string
  radius_km: number
  results: LocationResult[]
}

interface RecommendationResult {
  PropertyName: string
  SimilarityScore: number
  Price?: string
  Location?: string
}

interface GetRecommendationsResponse {
  original_property: string
  recommendations: RecommendationResult[]
}

interface DropdownOptions {
  locations: string[]
  properties: string[]
}

export function useRecommendation() {
  const [loading, setLoading] = useState(false)
  const [locationResults, setLocationResults] = useState<SearchLocationResponse | null>(null)
  const [recommendationResults, setRecommendationResults] = useState<GetRecommendationsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({
    locations: [],
    properties: []
  })

  const API_BASE_URL = "http://127.0.0.1:8000"

  const loadDropdowns = async () => {
    try {
      // Load locations
      const locationsResponse = await fetch(`${API_BASE_URL}/locations`)
      if (!locationsResponse.ok) throw new Error('Failed to load locations')
      const locationsData = await locationsResponse.json()

      // Load properties
      const propertiesResponse = await fetch(`${API_BASE_URL}/properties`)
      if (!propertiesResponse.ok) throw new Error('Failed to load properties')
      const propertiesData = await propertiesResponse.json()

      setDropdownOptions({
        locations: locationsData.locations || [],
        properties: propertiesData.properties || []
      })
    } catch (err: any) {
      console.warn('Error loading dropdowns:', err.message)
    }
  }

  const searchLocation = async (location: string, radius: number) => {
    try {
      setLoading(true)
      setError(null)
      setRecommendationResults(null)

      const response = await fetch(
        `${API_BASE_URL}/search-location?location=${encodeURIComponent(location)}&radius=${radius}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data: SearchLocationResponse = await response.json()
      setLocationResults(data)
    } catch (err: any) {
      setError(getUserFriendlyError(err.message))
      setLocationResults(null)
    } finally {
      setLoading(false)
    }
  }

  const getRecommendations = async (property: string, topN: number = 5) => {
    try {
      setLoading(true)
      setError(null)
      setLocationResults(null)

      const response = await fetch(
        `${API_BASE_URL}/recommend?property_name=${encodeURIComponent(property)}&top_n=${topN}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data: GetRecommendationsResponse = await response.json()
      setRecommendationResults(data)
    } catch (err: any) {
      setError(getUserFriendlyError(err.message))
      setRecommendationResults(null)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setLocationResults(null)
    setRecommendationResults(null)
    setError(null)
  }

  const getUserFriendlyError = (error: string): string => {
    if (error.includes("Failed to fetch")) {
      return "Cannot connect to the server. Please make sure the backend server is running on http://127.0.0.1:8000"
    } else if (error.includes("404")) {
      return "Server endpoint not found. Please check the API URL."
    } else if (error.includes("500")) {
      return "Server error occurred. Please try again later."
    } else if (error.includes("No properties found")) {
      return "No properties found matching your criteria. Please try different parameters."
    } else {
      return error
    }
  }

  return {
    searchLocation,
    getRecommendations,
    loading,
    locationResults,
    recommendationResults,
    error,
    dropdownOptions,
    loadDropdowns,
    reset
  }
}