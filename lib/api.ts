// Base API configuration
const API_BASE_URL = "http://127.0.0.1:8000"

// ============================
// PRICE PREDICTION INTERFACES
// ============================

export interface PredictionRequest {
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

export interface PredictionResponse {
  predicted_price_low: string
  predicted_price_high: string
  unit: string
  source?: string
}

export interface DropdownOptionsResponse {
  property_type: string[]
  sector: string[]
  agePossession: string[]
  furnishing_type: string[]
  luxury_category: string[]
  floor_category: string[]
}

// ============================
// RECOMMENDATION INTERFACES
// ============================

export interface LocationResult {
  property: string
  distance_km: number
  address?: string
  price?: string
  property_type?: string
}

export interface SearchLocationResponse {
  location: string
  radius_km: number
  results: LocationResult[]
  total_results: number
  status: string
}

export interface RecommendationResult {
  PropertyName: string
  SimilarityScore: number
  Price?: string
  Location?: string
  PropertyType?: string
  Bedrooms?: number
  Bathrooms?: number
}

export interface GetRecommendationsResponse {
  original_property: string
  recommendations: RecommendationResult[]
  total_recommendations: number
  status: string
}

export interface DropdownOptions {
  locations: string[]
  properties: string[]
  property_types?: string[]
  sectors?: string[]
}

// ============================
// PRICE PREDICTION APIs
// ============================

/**
 * Predict property price based on form data
 */
export async function predictPrice(data: PredictionRequest): Promise<PredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/predict_price`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      detail: `HTTP Error: ${response.status} ${response.statusText}` 
    }))
    throw new Error(errorData.detail || `Prediction failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Predict from JSON file
 */
export async function predictFromJSON(): Promise<PredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/predict_from_json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      detail: `HTTP Error: ${response.status} ${response.statusText}` 
    }))
    throw new Error(errorData.detail || `JSON prediction failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * View JSON file contents
 */
export async function viewJSONFile(): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE_URL}/view_json`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      detail: `HTTP Error: ${response.status} ${response.statusText}` 
    }))
    throw new Error(errorData.detail || `Failed to view JSON file: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get dropdown options for price prediction form
 */
export async function getDropdownOptions(): Promise<DropdownOptionsResponse> {
  const response = await fetch(`${API_BASE_URL}/dropdown_options`)

  if (!response.ok) {
    throw new Error(`Failed to fetch dropdown options: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Ensure all arrays exist
  return {
    property_type: data.property_type || [],
    sector: data.sector || [],
    agePossession: data.agePossession || [],
    furnishing_type: data.furnishing_type || [],
    luxury_category: data.luxury_category || [],
    floor_category: data.floor_category || []
  }
}

// ============================
// RECOMMENDATION & SEARCH APIs
// ============================

/**
 * Get all available locations
 */
export async function fetchLocations(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/locations`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      detail: `HTTP Error: ${response.status} ${response.statusText}` 
    }))
    throw new Error(errorData.detail || `Failed to fetch locations: ${response.statusText}`)
  }

  const data = await response.json()
  return data.locations || []
}

/**
 * Get all available properties
 */
export async function fetchProperties(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/properties`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      detail: `HTTP Error: ${response.status} ${response.statusText}` 
    }))
    throw new Error(errorData.detail || `Failed to fetch properties: ${response.statusText}`)
  }

  const data = await response.json()
  return data.properties || []
}

/**
 * Search properties by location and radius
 */
export async function searchByLocation(
  location: string, 
  radius: number
): Promise<SearchLocationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/search-location?location=${encodeURIComponent(location)}&radius=${radius}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      detail: `HTTP Error: ${response.status} ${response.statusText}` 
    }))
    throw new Error(errorData.detail || `Location search failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get property recommendations based on similarity
 */
export async function getPropertyRecommendations(
  property: string, 
  topN: number = 5
): Promise<GetRecommendationsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/recommend?property_name=${encodeURIComponent(property)}&top_n=${topN}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      detail: `HTTP Error: ${response.status} ${response.statusText}` 
    }))
    throw new Error(errorData.detail || `Recommendation failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get all dropdown options for recommendation system
 */
export async function getRecommendationDropdowns(): Promise<DropdownOptions> {
  try {
    const [locations, properties] = await Promise.all([
      fetchLocations().catch(() => []),  // Return empty array on error
      fetchProperties().catch(() => [])  // Return empty array on error
    ])

    return {
      locations,
      properties
    }
  } catch (error) {
    console.error('Error fetching recommendation dropdowns:', error)
    return {
      locations: [],
      properties: []
    }
  }
}

/**
 * Get complete dropdown options (both prediction and recommendation)
 */
export async function getAllDropdownOptions(): Promise<{
  prediction: DropdownOptionsResponse
  recommendation: DropdownOptions
}> {
  try {
    const [predictionOptions, recommendationOptions] = await Promise.all([
      getDropdownOptions().catch(() => ({
        property_type: [],
        sector: [],
        agePossession: [],
        furnishing_type: [],
        luxury_category: [],
        floor_category: []
      })),
      getRecommendationDropdowns()
    ])

    return {
      prediction: predictionOptions,
      recommendation: recommendationOptions
    }
  } catch (error) {
    console.error('Error fetching all dropdown options:', error)
    return {
      prediction: {
        property_type: [],
        sector: [],
        agePossession: [],
        furnishing_type: [],
        luxury_category: [],
        floor_category: []
      },
      recommendation: {
        locations: [],
        properties: []
      }
    }
  }
}

/**
 * Test API connection
 */
export async function testAPIConnection(): Promise<{
  isConnected: boolean
  message: string
  endpoints: Record<string, boolean>
}> {
  const endpoints = [
    { name: 'predict_price', url: '/predict_price', method: 'OPTIONS' },
    { name: 'dropdown_options', url: '/dropdown_options', method: 'GET' },
    { name: 'locations', url: '/locations', method: 'GET' },
    { name: 'properties', url: '/properties', method: 'GET' }
  ]

  const results: Record<string, boolean> = {}
  let isConnected = false

  try {
    // Test base connection
    const testResponse = await fetch(`${API_BASE_URL}/`, { method: 'HEAD' })
    isConnected = testResponse.ok

    // Test individual endpoints
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint.url}`, { 
          method: endpoint.method as any 
        })
        results[endpoint.name] = response.ok || response.status !== 404
      } catch {
        results[endpoint.name] = false
      }
    }

    return {
      isConnected,
      message: isConnected ? 'Connected to API server' : 'Failed to connect to API server',
      endpoints: results
    }
  } catch (error) {
    return {
      isConnected: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      endpoints: results
    }
  }
}

/**
 * Utility function to format API error messages
 */
export function formatErrorMessage(error: any): string {
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Cannot connect to the server. Please make sure the backend server is running on http://127.0.0.1:8000'
    }
    if (error.message.includes('404')) {
      return 'API endpoint not found. Please check the server configuration.'
    }
    if (error.message.includes('500')) {
      return 'Server error occurred. Please try again later.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}