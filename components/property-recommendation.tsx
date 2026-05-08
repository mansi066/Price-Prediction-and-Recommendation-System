"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MapPin, Lightbulb, Search, Users, Navigation, Star, Home, AlertCircle, Loader2, X } from "lucide-react"
import { useRecommendation } from "@/hooks/use-recommendation"

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

interface PropertyRecommendationProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function PropertyRecommendation({ isOpen = false, onClose }: PropertyRecommendationProps) {
  const { 
    searchLocation, 
    getRecommendations, 
    loading, 
    locationResults, 
    recommendationResults, 
    error,
    dropdownOptions,
    loadDropdowns
  } = useRecommendation()

  const [location, setLocation] = useState("")
  const [radius, setRadius] = useState<number>(5)
  const [property, setProperty] = useState("")
  const [topN, setTopN] = useState<number>(5)
  const [searchType, setSearchType] = useState<"location" | "recommendation" | null>(null)

  // Load dropdown options on mount
  useEffect(() => {
    loadDropdowns()
  }, [])

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim() || radius <= 0) {
      return
    }
    setSearchType("location")
    await searchLocation(location, radius)
  }

  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property.trim()) {
      return
    }
    setSearchType("recommendation")
    await getRecommendations(property, topN)
  }

  const handleReset = () => {
    setLocation("")
    setRadius(5)
    setProperty("")
    setTopN(5)
    setSearchType(null)
  }

  const handleClose = () => {
    handleReset()
    onClose?.()
  }

  // Modal overlay - shows when isOpen is true
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-white bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal content */}
      <div className="relative min-h-screen flex items-center justify-center py-4 px-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Modal body */}
          <div className="py-16 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Home className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Property Recommendation System</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover properties by location and get AI-powered intelligent recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Location Search Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900"> Search by Location & Radius</h2>
            </div>
            
            <form onSubmit={handleLocationSearch}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Location *
                  </label>
                  <div className="relative">
                    <select
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                      required
                      disabled={loading && searchType === "location"}
                    >
                      <option value="">Select a location</option>
                      {dropdownOptions?.locations?.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    <Navigation className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                    Radius (in Kilometers)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="radius"
                      value={radius}
                      onChange={(e) => setRadius(Math.max(0.1, Number(e.target.value)))}
                      min="0.1"
                      max="50"
                      step="0.1"
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter radius in km"
                      disabled={loading && searchType === "location"}
                    />
                    <span className="absolute left-4 top-3.5 text-gray-400">km</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Min: 0.1 km</span>
                    <span className="text-xs text-gray-500">Max: 50 km</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={(loading && searchType === "location") || !location.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && searchType === "location" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Search Properties
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Location Results */}
            {searchType === "location" && locationResults && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📍 Search Results
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {locationResults.results.length} properties found
                  </span>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                  <p className="text-blue-800">
                    Found within <span className="font-bold">{locationResults.radius_km} km</span> of{" "}
                    <span className="font-bold">{locationResults.location}</span>
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {locationResults.results.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No properties found in this radius</p>
                      <p className="text-sm mt-1">Try increasing the search radius</p>
                    </div>
                  ) : (
                    locationResults.results.map((result, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                {index + 1}
                              </div>
                              <h4 className="font-bold text-gray-900">{result.property}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium text-green-600">
                                📍 {result.distance_km.toFixed(2)} km away
                              </span>
                            </div>
                            {result.address && (
                              <p className="text-sm text-gray-500 mt-1 truncate">{result.address}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recommendation Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Lightbulb className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Get Property Recommendations</h2>
            </div>

            <form onSubmit={handleGetRecommendations}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Property *
                  </label>
                  <div className="relative">
                    <select
                      id="property"
                      value={property}
                      onChange={(e) => setProperty(e.target.value)}
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors appearance-none bg-white"
                      required
                      disabled={loading && searchType === "recommendation"}
                    >
                      <option value="">Select a property</option>
                      {dropdownOptions?.properties?.map((prop) => (
                        <option key={prop} value={prop}>
                          {prop}
                        </option>
                      ))}
                    </select>
                    <Home className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="top-n" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Recommendations
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="top-n"
                      value={topN}
                      onChange={(e) => {
                        const value = Math.min(20, Math.max(1, Number(e.target.value)))
                        setTopN(value)
                      }}
                      min="1"
                      max="20"
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Number of recommendations"
                      disabled={loading && searchType === "recommendation"}
                    />
                    <Users className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Min: 1</span>
                    <span className="text-xs text-gray-500">Max: 20</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={(loading && searchType === "recommendation") || !property.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && searchType === "recommendation" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Star className="h-5 w-5" />
                      Get Recommendations
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Recommendation Results */}
            {searchType === "recommendation" && recommendationResults && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                     AI Recommendations
                  </h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    Top {recommendationResults.recommendations.length} matches
                  </span>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
                  <p className="text-purple-800">
                    Properties similar to{" "}
                    <span className="font-bold">{recommendationResults.original_property}</span>
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {recommendationResults.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold">
                              {index + 1}
                            </div>
                            <h4 className="font-bold text-gray-900">{rec.PropertyName}</h4>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm font-medium text-purple-700">
                                Similarity: <span className="font-bold">{rec.SimilarityScore.toFixed(4)}</span>
                              </span>
                            </div>
                            
                            {rec.Price && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-green-700">
                                  Price: <span className="font-bold">{rec.Price}</span>
                                </span>
                              </div>
                            )}
                            
                            {rec.Location && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-blue-700">
                                  {rec.Location}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            rec.SimilarityScore > 0.8 
                              ? "bg-green-100 text-green-800"
                              : rec.SimilarityScore > 0.6
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {rec.SimilarityScore > 0.8 ? "Very High" : 
                             rec.SimilarityScore > 0.6 ? "High" : "Moderate"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-8 mx-auto max-w-4xl">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-red-800 mb-1">Something went wrong</h4>
                  <p className="text-red-700">{error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-3 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Common Actions */}
        <div className="mt-8 text-center">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
          >
            Reset All
          </button>
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}