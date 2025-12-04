from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pickle
import pandas as pd
import numpy as np
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Property Recommendation API", version="1.0.0")

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

# Global variables for loaded data
location_df = None
cosine_sim1 = None
cosine_sim2 = None
cosine_sim3 = None

def load_models():
    """Load the recommendation models and data"""
    global location_df, cosine_sim1, cosine_sim2, cosine_sim3
    
    try:
        logger.info("Loading recommendation models...")
        
        location_df = pickle.load(open('datasets/location_distance.pkl', 'rb'))
        cosine_sim1 = pickle.load(open('datasets/cosine_sim1.pkl', 'rb'))
        cosine_sim2 = pickle.load(open('datasets/cosine_sim2.pkl', 'rb'))
        cosine_sim3 = pickle.load(open('datasets/cosine_sim3.pkl', 'rb'))
        
        logger.info("✅ All models loaded successfully!")
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        raise

def recommend_properties_with_scores(property_name: str, top_n: int = 5):
    """Recommend properties based on similarity scores"""
    try:
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

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    load_models()

@app.get("/")
async def serve_home():
    """Serve the main HTML page"""
    return FileResponse("index.html")

@app.get("/locations")
async def get_locations():
    """Get all available locations"""
    try:
        locations = sorted(location_df.columns.to_list())
        return {"locations": locations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting locations: {str(e)}")

@app.get("/properties")
async def get_properties():
    """Get all available properties"""
    try:
        properties = sorted(location_df.index.to_list())
        return {"properties": properties}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting properties: {str(e)}")

@app.get("/search-location")
async def search_location(location: str, radius: float):
    """Search properties within radius of location"""
    try:
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
        if property_name not in location_df.index:
            raise HTTPException(status_code=400, detail="Property not found")
        
        recommendations = recommend_properties_with_scores(property_name, top_n)
        
        return {
            "original_property": property_name,
            "recommendations": recommendations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": all([location_df is not None, cosine_sim1 is not None, 
                             cosine_sim2 is not None, cosine_sim3 is not None])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")