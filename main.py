from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import pickle
import logging
import sys
import json
import joblib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Property Analytics API",
    description="Combined API for property price prediction and recommendations",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (for HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="."), name="static")

# ============================================================================
# PRICE PREDICTION MODELS AND CLASSES
# ============================================================================

# Global variables for price prediction models
df_loaded = None
pipeline_loaded = None

# Global variables for recommendation models
location_df = None
cosine_sim1 = None
cosine_sim2 = None
cosine_sim3 = None

# Pydantic models for price prediction
class PropertyFeatures(BaseModel):
    property_type: str
    sector: str
    bedRoom: int = Field(..., ge=1, le=10)
    bathroom: int = Field(..., ge=1, le=10)
    balcony: int = Field(..., ge=0, le=5)
    agePossession: str
    built_up_area: float = Field(..., gt=0)
    servant_room: int = Field(..., ge=0, le=2)
    store_room: int = Field(..., ge=0, le=2)
    furnishing_type: str
    luxury_category: str
    floor_category: str

class PricePredictionResponse(BaseModel):
    predicted_price_low: float
    predicted_price_high: float
    unit: str

# ============================================================================
# MODEL LOADING FUNCTIONS
# ============================================================================

def patch_sklearn_for_compatibility():
    """Patch sklearn to handle the missing _RemainderColsList class"""
    try:
        import sklearn.compose._column_transformer as ct_module
        
        # Create a dummy _RemainderColsList class
        class _RemainderColsList(list):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
        
        # Add it to the module
        ct_module._RemainderColsList = _RemainderColsList
        logger.info("✅ Successfully patched _RemainderColsList for price prediction")
        
    except Exception as e:
        logger.warning(f"Patching failed: {e}")

def load_price_prediction_models():
    """Load price prediction models with compatibility patches"""
    global df_loaded, pipeline_loaded
    
    try:
        logger.info("🔄 Loading price prediction models...")
        
        # Apply patches before loading
        patch_sklearn_for_compatibility()
        
        logger.info("Loading pipeline.pkl...")
        pipeline_loaded = joblib.load('pipeline.pkl')
        logger.info("✅ Price prediction pipeline loaded successfully!")
        
        logger.info("Loading df.pkl...")
        df_loaded = joblib.load('df.pkl')
        logger.info("✅ Price prediction dataframe loaded successfully!")
        
    except Exception as e:
        logger.error(f"❌ Price prediction model loading failed: {e}")
        raise Exception(f"Cannot load price prediction models: {e}")

def load_recommendation_models():
    """Load the recommendation models and data"""
    global location_df, cosine_sim1, cosine_sim2, cosine_sim3
    
    try:
        logger.info("🔄 Loading recommendation models...")
        
        location_df = pickle.load(open('datasets/location_distance.pkl', 'rb'))
        cosine_sim1 = pickle.load(open('datasets/cosine_sim1.pkl', 'rb'))
        cosine_sim2 = pickle.load(open('datasets/cosine_sim2.pkl', 'rb'))
        cosine_sim3 = pickle.load(open('datasets/cosine_sim3.pkl', 'rb'))
        
        # Check if any are None
        if location_df is None:
            raise Exception("location_distance.pkl is None")
        if cosine_sim1 is None:
            raise Exception("cosine_sim1.pkl is None")
        if cosine_sim2 is None:
            raise Exception("cosine_sim2.pkl is None")
        if cosine_sim3 is None:
            raise Exception("cosine_sim3.pkl is None")
        
        # Log types and shapes for debugging
        logger.info(f"location_df type: {type(location_df)}, shape: {location_df.shape if hasattr(location_df, 'shape') else 'No shape'}")
        logger.info(f"cosine_sim1 type: {type(cosine_sim1)}, shape: {cosine_sim1.shape if hasattr(cosine_sim1, 'shape') else 'No shape'}")
        logger.info(f"cosine_sim2 type: {type(cosine_sim2)}, shape: {cosine_sim2.shape if hasattr(cosine_sim2, 'shape') else 'No shape'}")
        logger.info(f"cosine_sim3 type: {type(cosine_sim3)}, shape: {cosine_sim3.shape if hasattr(cosine_sim3, 'shape') else 'No shape'}")
        
        logger.info("✅ All recommendation models loaded successfully!")
        
    except Exception as e:
        logger.error(f"❌ Error loading recommendation models: {e}")
        raise

def recommend_properties_with_scores(property_name: str, top_n: int = 5):
    """Recommend properties based on similarity scores"""
    try:
        # Check if models are loaded
        if cosine_sim1 is None or cosine_sim2 is None or cosine_sim3 is None:
            raise ValueError("One or more cosine similarity matrices are not loaded. Please check the server logs.")

        # Calculate combined similarity matrix
        cosine_sim_matrix = 0.5 * cosine_sim1 + 0.8 * cosine_sim2 + 1 * cosine_sim3

        # Get the similarity scores for the property
        sim_scores = list(enumerate(cosine_sim_matrix[location_df.index.get_loc(property_name)]))

        # Sort properties based on similarity scores
        sorted_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        # Get the indices and scores of top_n most similar properties
        top_indices = [i[0] for i in sorted_scores[1:top_n + 1]]
        top_scores = [i[1] for i in sorted_scores[1:top_n + 1]]

        # Retrieve the names of top properties
        top_properties = location_df.index[top_indices].tolist()

        # Create results
        recommendations = []
        for prop, score in zip(top_properties, top_scores):
            recommendations.append({
                'PropertyName': prop,
                'SimilarityScore': round(score, 4)
            })

        return recommendations
        
    except Exception as e:
        logger.error(f"Error in recommendation: {e}")
        raise
# ============================================================================
# APPLICATION STARTUP
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load all models on startup"""
    logger.info("🚀 Starting Property Analytics API...")
    
    try:
        # Load price prediction models
        load_price_prediction_models()
        logger.info("✅ Price prediction models loaded successfully!")
        
        # Test price prediction model
        test_price_prediction()
        
    except Exception as e:
        logger.error(f"❌ Price prediction models failed to load: {e}")
    
    try:
        # Load recommendation models
        load_recommendation_models()
        logger.info("✅ Recommendation models loaded successfully!")
        
    except Exception as e:
        logger.error(f"❌ Recommendation models failed to load: {e}")
    
    logger.info("✅ Application startup completed!")

def test_price_prediction():
    """Test the price prediction model with sample data"""
    try:
        if pipeline_loaded is not None and df_loaded is not None:
            # Get actual categories from training data
            valid_property_types = df_loaded['property_type'].unique().tolist()
            valid_sectors = df_loaded['sector'].unique().tolist()
            valid_furnishing = df_loaded['furnishing_type'].unique().tolist()
            valid_luxury = df_loaded['luxury_category'].unique().tolist()
            valid_floor = df_loaded['floor_category'].unique().tolist()
            valid_age = df_loaded['agePossession'].unique().tolist()
            
            # Create test data with valid categories
            test_data = {
                'property_type': valid_property_types[0] if valid_property_types else 'flat',
                'sector': valid_sectors[0] if valid_sectors else 'Sector 62',
                'bedRoom': 3.0,
                'bathroom': 2.0,
                'balcony': 2.0,
                'agePossession': valid_age[0] if valid_age else '0-1 Year Old Property',
                'built_up_area': 1800.0,
                'servant room': 0.0,
                'store room': 1.0,
                'furnishing_type': valid_furnishing[0] if valid_furnishing else 'unfurnished',
                'luxury_category': valid_luxury[0] if valid_luxury else 'Low',
                'floor_category': valid_floor[0] if valid_floor else 'Low Floor'
            }
            
            test_df = pd.DataFrame([test_data])
            prediction = pipeline_loaded.predict(test_df)
            logger.info(f"✅ Price prediction model test successful! Sample prediction: {np.expm1(prediction[0]):.2f} Cr")
    except Exception as e:
        logger.warning(f"⚠️  Price prediction model test failed: {e}")

# ============================================================================
# ROOT AND HEALTH ENDPOINTS
# ============================================================================

@app.get("/")
async def serve_home():
    """Serve the main HTML page"""
    return FileResponse("index.html")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "price_prediction_loaded": pipeline_loaded is not None and df_loaded is not None,
        "recommendation_loaded": all([location_df is not None, cosine_sim1 is not None, 
                                     cosine_sim2 is not None, cosine_sim3 is not None]),
        "message": "Property Analytics API - Combined Price Prediction and Recommendation System"
    }

# ============================================================================
# PRICE PREDICTION ENDPOINTS
# ============================================================================

@app.post("/predict_price", response_model=PricePredictionResponse)
async def predict_price(features: PropertyFeatures):
    """Predict property price"""
    try:
        if pipeline_loaded is None:
            raise HTTPException(status_code=503, detail="Price prediction models not loaded. Please check server logs.")
        
        # Prepare input data
        input_data = features.dict()
        input_data['servant room'] = float(input_data.pop('servant_room'))
        input_data['store room'] = float(input_data.pop('store_room'))
        
        # Ensure all numeric fields are floats
        numeric_fields = ['bedRoom', 'bathroom', 'built_up_area']
        for field in numeric_fields:
            input_data[field] = float(input_data[field])
        
        # Convert balcony to string (it's categorical in the model)
        input_data['balcony'] = str(input_data['balcony'])
        
        # Create DataFrame
        input_df = pd.DataFrame([input_data])
        
        # Ensure correct column order
        expected_columns = [
            'property_type', 'sector', 'bedRoom', 'bathroom', 'balcony',
            'agePossession', 'built_up_area', 'servant room', 'store room',
            'furnishing_type', 'luxury_category', 'floor_category'
        ]
        
        # Reorder columns
        input_df = input_df.reindex(columns=expected_columns)
        
        logger.info(f"Making price prediction for: {input_df.iloc[0].to_dict()}")
        
        # Make prediction
        prediction = pipeline_loaded.predict(input_df)
        predicted_price = np.expm1(prediction[0])
        
        # Calculate price range (±0.22 Cr)
        price_low = max(0.5, round(predicted_price - 0.22, 2))
        price_high = round(predicted_price + 0.22, 2)
        
        logger.info(f"Price prediction result: {price_low} - {price_high} Cr")
        
        return PricePredictionResponse(
            predicted_price_low=price_low,
            predicted_price_high=price_high,
            unit="Cr"
        )
        
    except Exception as e:
        logger.error(f"Price prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Price prediction failed: {str(e)}")

@app.get("/dropdown_options")
async def get_dropdown_options():
    """Get available options for dropdown fields for price prediction"""
    try:
        if df_loaded is None:
            return {
                "property_type": ["Apartment", "Villa", "Penthouse"],
                "sector": ["Sector 62", "Sector 63", "Sector 64", "Sector 65"],
                "agePossession": ["0-1 Year Old Property", "1-5 Year Old Property", "5-10 Year Old Property", "10+ Year Old Property"],
                "furnishing_type": ["Unfurnished", "Semi-Furnished", "Fully-Furnished"],
                "luxury_category": ["Low", "Medium", "Luxury", "Ultra Luxury"],
                "floor_category": ["Low Floor", "Mid Floor", "High Floor"]
            }
        
        options = {
            "property_type": df_loaded['property_type'].unique().tolist(),
            "sector": df_loaded['sector'].unique().tolist(),
            "agePossession": df_loaded['agePossession'].unique().tolist(),
            "furnishing_type": df_loaded['furnishing_type'].unique().tolist(),
            "luxury_category": df_loaded['luxury_category'].unique().tolist(),
            "floor_category": df_loaded['floor_category'].unique().tolist()
        }
        
        return options
        
    except Exception as e:
        logger.error(f"Error getting dropdown options: {e}")
        return {
            "property_type": ["Apartment", "Villa", "Penthouse"],
            "sector": ["Sector 62", "Sector 63", "Sector 64", "Sector 65"],
            "agePossession": ["0-1 Year Old Property", "1-5 Year Old Property", "5-10 Year Old Property", "10+ Year Old Property"],
            "furnishing_type": ["Unfurnished", "Semi-Furnished", "Fully-Furnished"],
            "luxury_category": ["Low", "Medium", "Luxury", "Ultra Luxury"],
            "floor_category": ["Low Floor", "Mid Floor", "High Floor"]
        }

@app.post("/predict_from_json")
async def predict_from_json():
    """
    Predict property price from property_price.json file
    """
    try:
        if pipeline_loaded is None:
            raise HTTPException(status_code=503, detail="Price prediction models not loaded")
        
        # Read the JSON file
        with open('property_price.json', 'r') as f:
            json_data = json.load(f)
        
        # Validate the data matches our PropertyFeatures model
        features = PropertyFeatures(**json_data)
        
        # Prepare input data (same as predict_price endpoint)
        input_data = features.dict()
        input_data['servant room'] = float(input_data.pop('servant_room'))
        input_data['store room'] = float(input_data.pop('store_room'))
        
        # Ensure all numeric fields are floats
        numeric_fields = ['bedRoom', 'bathroom', 'built_up_area']
        for field in numeric_fields:
            input_data[field] = float(input_data[field])
        
        # Convert balcony to string
        input_data['balcony'] = str(input_data['balcony'])
        
        # Create DataFrame
        input_df = pd.DataFrame([input_data])
        
        # Ensure correct column order
        expected_columns = [
            'property_type', 'sector', 'bedRoom', 'bathroom', 'balcony',
            'agePossession', 'built_up_area', 'servant room', 'store room',
            'furnishing_type', 'luxury_category', 'floor_category'
        ]
        input_df = input_df.reindex(columns=expected_columns)
        
        logger.info(f"Making JSON prediction for: {input_df.iloc[0].to_dict()}")
        
        # Make prediction
        prediction = pipeline_loaded.predict(input_df)
        predicted_price = np.expm1(prediction[0])
        
        # Calculate price range (±0.22 Cr)
        price_low = max(0.5, round(predicted_price - 0.22, 2))
        price_high = round(predicted_price + 0.22, 2)
        
        logger.info(f"JSON Prediction result: {price_low} - {price_high} Cr")
        
        return {
            "predicted_price_low": price_low,
            "predicted_price_high": price_high,
            "unit": "Cr",
            "source": "property_price.json"
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="property_price.json file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format in property_price.json")
    except Exception as e:
        logger.error(f"JSON prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction from JSON failed: {str(e)}")

@app.get("/view_json")
async def view_json_file():
    """
    View the current contents of property_price.json
    """
    try:
        with open('property_price.json', 'r') as f:
            json_data = json.load(f)
        return json_data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="property_price.json file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading JSON file: {str(e)}")

# ============================================================================
# RECOMMENDATION ENDPOINTS
# ============================================================================

@app.get("/locations")
async def get_locations():
    """Get all available locations for recommendations"""
    try:
        if location_df is None:
            raise HTTPException(status_code=503, detail="Recommendation models not loaded")
            
        locations = sorted(location_df.columns.to_list())
        return {"locations": locations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting locations: {str(e)}")

@app.get("/properties")
async def get_properties():
    """Get all available properties for recommendations"""
    try:
        if location_df is None:
            raise HTTPException(status_code=503, detail="Recommendation models not loaded")
            
        properties = sorted(location_df.index.to_list())
        return {"properties": properties}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting properties: {str(e)}")

@app.get("/search-location")
async def search_location(location: str, radius: float):
    """Search properties within radius of location"""
    try:
        if location_df is None:
            raise HTTPException(status_code=503, detail="Recommendation models not loaded")
            
        if location not in location_df.columns:
            raise HTTPException(status_code=400, detail="Location not found")
        
        # Filter properties within radius
        result_ser = location_df[location_df[location] < radius * 1000][location].sort_values()
        
        # Convert to list of dictionaries
        results = []
        for property_name, distance in result_ser.items():
            results.append({
                "property": property_name,
                "distance_km": round(distance / 1000, 2)
            })
        
        return {
            "location": location,
            "radius_km": radius,
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@app.get("/recommend")
async def recommend_properties(property_name: str, top_n: int = 5):
    """Get property recommendations"""
    try:
        if location_df is None:
            raise HTTPException(status_code=503, detail="Recommendation models not loaded")
            
        if property_name not in location_df.index:
            raise HTTPException(status_code=400, detail="Property not found")
        
        recommendations = recommend_properties_with_scores(property_name, top_n)
        
        return {
            "original_property": property_name,
            "recommendations": recommendations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")