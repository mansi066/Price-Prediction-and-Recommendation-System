"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Loader2, Home, RefreshCw, FileText } from "lucide-react"
import { usePredictPrice } from "@/hooks/use-predict-price"

interface DropdownOptions {
  property_type: string[]
  sector: string[]
  agePossession: string[]
  furnishing_type: string[]
  luxury_category: string[]
  floor_category: string[]
}

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

export default function PricePrediction() {
  const { predict, loading, result, error, reset: resetPrediction } = usePredictPrice()
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions | null>(null)
  const [jsonData, setJsonData] = useState<any>(null)
  const [showJsonView, setShowJsonView] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    property_type: "",
    sector: "",
    bedRoom: 3,
    bathroom: 2,
    balcony: 2,
    agePossession: "",
    built_up_area: 1800,
    servant_room: 0,
    store_room: 1,
    furnishing_type: "",
    luxury_category: "",
    floor_category: "",
  })

  // Load dropdown options on mount
  useEffect(() => {
    loadDropdownOptions()
  }, [])

  const loadDropdownOptions = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/dropdown_options")
      if (response.ok) {
        const data = await response.json()
        setDropdownOptions(data)
      }
    } catch (err) {
      console.warn("Failed to load dropdown options:", err)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target
    const newValue = isNaN(Number(value)) ? value : Number(value)
    
    setFormData((prev) => ({
      ...prev,
      [id]: newValue,
    }))

    // Clear error for this field
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }

    // Validate numeric fields in real-time
    if (["bedRoom", "bathroom", "balcony", "built_up_area", "servant_room", "store_room"].includes(id)) {
      validateNumericField(id, Number(value))
    }
  }

  const validateNumericField = (fieldId: string, value: number) => {
    const ranges: Record<string, { min: number; max: number }> = {
      bedRoom: { min: 1, max: 10 },
      bathroom: { min: 1, max: 10 },
      balcony: { min: 0, max: 5 },
      built_up_area: { min: 100, max: 10000 },
      servant_room: { min: 0, max: 2 },
      store_room: { min: 0, max: 2 },
    }

    if (fieldId in ranges) {
      const { min, max } = ranges[fieldId]
      if (value < min || value > max) {
        setFormErrors((prev) => ({
          ...prev,
          [fieldId]: `Please enter a value between ${min} and ${max}`,
        }))
      } else if (formErrors[fieldId]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[fieldId]
          return newErrors
        })
      }
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const requiredFields = [
      "property_type",
      "sector",
      "bedRoom",
      "bathroom",
      "agePossession",
      "built_up_area",
      "furnishing_type",
      "luxury_category",
      "floor_category",
    ]

    // Check required fields
    requiredFields.forEach((field) => {
      if (!formData[field as keyof FormData]) {
        errors[field] = "This field is required"
      }
    })

    // Validate numeric fields
    const numericFields = [
      { id: "bedRoom", min: 1, max: 10 },
      { id: "bathroom", min: 1, max: 10 },
      { id: "balcony", min: 0, max: 5 },
      { id: "built_up_area", min: 100, max: 10000 },
      { id: "servant_room", min: 0, max: 2 },
      { id: "store_room", min: 0, max: 2 },
    ]

    numericFields.forEach(({ id, min, max }) => {
      const value = formData[id as keyof FormData] as number
      if (value < min || value > max) {
        errors[id] = `Please enter a value between ${min} and ${max}`
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    await predict(formData)
  }

  const handleReset = () => {
    setFormData({
      property_type: "",
      sector: "",
      bedRoom: 3,
      bathroom: 2,
      balcony: 2,
      agePossession: "",
      built_up_area: 1800,
      servant_room: 0,
      store_room: 1,
      furnishing_type: "",
      luxury_category: "",
      floor_category: "",
    })
    setFormErrors({})
    resetPrediction()
    setShowJsonView(false)
  }

  const handlePredictFromJSON = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/predict_from_json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const prediction = await response.json()
      resetPrediction()
      // Update the result in the hook
      predict({} as FormData, prediction)
    } catch (err: any) {
      console.error("Error predicting from JSON:", err)
    }
  }

  const handleViewJSON = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/view_json")
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const jsonData = await response.json()
      setJsonData(jsonData)
      setShowJsonView(true)
      resetPrediction()
    } catch (err: any) {
      console.error("Error viewing JSON:", err)
    }
  }

  const getUserFriendlyError = (error: string): string => {
    if (error.includes("Failed to fetch")) {
      return "Cannot connect to the server. Please make sure the backend server is running on http://127.0.0.1:8000"
    } else if (error.includes("404")) {
      return "Server endpoint not found. Please check the API URL."
    } else if (error.includes("500")) {
      return "Server error occurred. Please try again later."
    } else if (error.includes("Models not loaded")) {
      return "Prediction models are not ready. Please try again in a moment."
    } else {
      return error
    }
  }

  return (
    <section className="py-20 px-4" id="predict">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6c63ff] to-[#667eea] text-white p-8 md:p-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Property Price Predictor</h1>
          <p className="opacity-90 text-lg">Get accurate price predictions for your property</p>
        </div>

        {/* Form Section */}
        <div className="p-6 md:p-10">
          <form onSubmit={handleSubmit} id="prediction-form">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Property Type */}
              <div className="form-group">
                <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  id="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.property_type ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Property Type</option>
                  {dropdownOptions?.property_type?.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {formErrors.property_type && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.property_type}</p>
                )}
              </div>

              {/* Sector */}
              <div className="form-group">
                <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-2">
                  Sector *
                </label>
                <select
                  id="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.sector ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Sector</option>
                  {dropdownOptions?.sector?.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
                {formErrors.sector && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.sector}</p>
                )}
              </div>

              {/* Bedrooms */}
              <div className="form-group">
                <label htmlFor="bedRoom" className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms *
                </label>
                <input
                  type="number"
                  id="bedRoom"
                  value={formData.bedRoom}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.bedRoom ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.bedRoom && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.bedRoom}</p>
                )}
              </div>

              {/* Bathrooms */}
              <div className="form-group">
                <label htmlFor="bathroom" className="block text-sm font-medium text-gray-700 mb-2">
                  Bathrooms *
                </label>
                <input
                  type="number"
                  id="bathroom"
                  value={formData.bathroom}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.bathroom ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.bathroom && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.bathroom}</p>
                )}
              </div>

              {/* Balcony */}
              <div className="form-group">
                <label htmlFor="balcony" className="block text-sm font-medium text-gray-700 mb-2">
                  Balcony
                </label>
                <input
                  type="number"
                  id="balcony"
                  value={formData.balcony}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.balcony ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.balcony && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.balcony}</p>
                )}
              </div>

              {/* Age Possession */}
              <div className="form-group">
                <label htmlFor="agePossession" className="block text-sm font-medium text-gray-700 mb-2">
                  Age Possession *
                </label>
                <select
                  id="agePossession"
                  value={formData.agePossession}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.agePossession ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Age</option>
                  {dropdownOptions?.agePossession?.map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
                {formErrors.agePossession && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.agePossession}</p>
                )}
              </div>

              {/* Built-up Area */}
              <div className="form-group">
                <label htmlFor="built_up_area" className="block text-sm font-medium text-gray-700 mb-2">
                  Built-up Area (sq ft) *
                </label>
                <input
                  type="number"
                  id="built_up_area"
                  value={formData.built_up_area}
                  onChange={handleChange}
                  min="100"
                  max="10000"
                  step="50"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.built_up_area ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.built_up_area && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.built_up_area}</p>
                )}
              </div>

              {/* Servant Room */}
              <div className="form-group">
                <label htmlFor="servant_room" className="block text-sm font-medium text-gray-700 mb-2">
                  Servant Room
                </label>
                <input
                  type="number"
                  id="servant_room"
                  value={formData.servant_room}
                  onChange={handleChange}
                  min="0"
                  max="2"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.servant_room ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.servant_room && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.servant_room}</p>
                )}
              </div>

              {/* Store Room */}
              <div className="form-group">
                <label htmlFor="store_room" className="block text-sm font-medium text-gray-700 mb-2">
                  Store Room
                </label>
                <input
                  type="number"
                  id="store_room"
                  value={formData.store_room}
                  onChange={handleChange}
                  min="0"
                  max="2"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.store_room ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {formErrors.store_room && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.store_room}</p>
                )}
              </div>

              {/* Furnishing Type */}
              <div className="form-group">
                <label htmlFor="furnishing_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Furnishing Type *
                </label>
                <select
                  id="furnishing_type"
                  value={formData.furnishing_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.furnishing_type ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Furnishing</option>
                  {dropdownOptions?.furnishing_type?.map((furnishing) => (
                    <option key={furnishing} value={furnishing}>
                      {furnishing}
                    </option>
                  ))}
                </select>
                {formErrors.furnishing_type && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.furnishing_type}</p>
                )}
              </div>

              {/* Luxury Category */}
              <div className="form-group">
                <label htmlFor="luxury_category" className="block text-sm font-medium text-gray-700 mb-2">
                  Luxury Category *
                </label>
                <select
                  id="luxury_category"
                  value={formData.luxury_category}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.luxury_category ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Luxury Category</option>
                  {dropdownOptions?.luxury_category?.map((luxury) => (
                    <option key={luxury} value={luxury}>
                      {luxury}
                    </option>
                  ))}
                </select>
                {formErrors.luxury_category && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.luxury_category}</p>
                )}
              </div>

              {/* Floor Category */}
              <div className="form-group">
                <label htmlFor="floor_category" className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Category *
                </label>
                <select
                  id="floor_category"
                  value={formData.floor_category}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    formErrors.floor_category ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Floor Category</option>
                  {dropdownOptions?.floor_category?.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>
                {formErrors.floor_category && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.floor_category}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#6c63ff] to-[#667eea] text-white py-4 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <Home className="h-5 w-5" />
                    Predict Price
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-4 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                Reset Form
              </button>

              <button
                type="button"
                onClick={handleViewJSON}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white py-4 rounded-lg font-bold hover:bg-amber-600 transition-colors"
              >
                <FileText className="h-5 w-5" />
                View JSON
              </button>
            </div>
          </form>

          {/* JSON Actions */}
          {showJsonView && jsonData && (
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border">
              <h3 className="text-xl font-bold text-gray-800 mb-4">property_price.json Contents</h3>
              <div className="space-y-2 mb-6">
                {Object.entries(jsonData).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-4 py-2 border-b">
                    <span className="font-medium text-gray-700 min-w-[150px]">{key}:</span>
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handlePredictFromJSON}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <FileText className="h-5 w-5" />
                  Predict from this JSON
                </button>
                <button
                  onClick={() => setShowJsonView(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Prediction Result */}
          {result && !showJsonView && (
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="text-3xl">💰</div>
                <h3 className="text-2xl font-bold text-blue-800">
                  {result.source === "json" ? "Predicted Price from JSON File" : "Predicted Property Price"}
                </h3>
              </div>
              
              <div className="flex items-center justify-center flex-wrap gap-2 mb-4">
                <span className="bg-emerald-100 text-emerald-800 px-4 py-3 rounded-lg text-2xl font-bold">
                  {result.predicted_price_low}
                </span>
                <span className="text-gray-600 font-medium">to</span>
                <span className="bg-rose-100 text-rose-800 px-4 py-3 rounded-lg text-2xl font-bold">
                  {result.predicted_price_high} {result.unit}
                </span>
              </div>
              
              <p className="text-center text-gray-600 mb-2">
                Based on {result.source === "json" ? "data from property_price.json" : "the provided property features"}
              </p>
              
              {result.source === "json" && (
                <p className="text-center text-sm text-gray-500">
                  Source: {result.source || "JSON file"}
                </p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && !showJsonView && (
            <div className="mt-8 p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border-2 border-red-200">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-bold text-red-800">Prediction Failed</h3>
              </div>
              <p className="text-red-700 mb-4">{getUserFriendlyError(error)}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mt-8 p-8 text-center">
              <div className="inline-flex flex-col items-center">
                <div className="text-3xl mb-4">⏳</div>
                <div className="text-blue-600 font-bold text-lg mb-2">Calculating prediction...</div>
                <div className="text-gray-500">Analyzing property features</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}