from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pickle
import logging

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Property Recommendation API",
    version="1.0.0",
    description="Backend API for property search and recommendation (Next.js frontend)"
)

# -----------------------------------------------------------------------------
# CORS (Allow Next.js frontend)
# -----------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# GLOBAL MODEL VARIABLES
# -----------------------------------------------------------------------------

location_df = None
cosine_sim1 = None
cosine_sim2 = None
cosine_sim3 = None

# -----------------------------------------------------------------------------
# LOAD MODELS
# -----------------------------------------------------------------------------

def load_models():
    global location_df, cosine_sim1, cosine_sim2, cosine_sim3
    try:
        logger.info("🔄 Loading recommendation models...")

        location_df = pickle.load(open("models/location_distance.pkl", "rb"))
        cosine_sim1 = pickle.load(open("models/cosine_sim1.pkl", "rb"))
        cosine_sim2 = pickle.load(open("models/cosine_sim2.pkl", "rb"))
        cosine_sim3 = pickle.load(open("models/cosine_sim3.pkl", "rb"))

        logger.info("✅ Recommendation models loaded successfully")

    except Exception as e:
        logger.error(f"❌ Model loading failed: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    load_models()

# -----------------------------------------------------------------------------
# ROOT ENDPOINT (Next.js compatible)
# -----------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "message": "Property Recommendation API is running",
        "frontend": "Next.js",
        "docs": "/docs",
        "status": "ok"
    }

# -----------------------------------------------------------------------------
# API ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/locations")
async def get_locations():
    try:
        return {"locations": sorted(location_df.columns.to_list())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/properties")
async def get_properties():
    try:
        return {"properties": sorted(location_df.index.to_list())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search-location")
async def search_location(location: str, radius: float):
    try:
        if location not in location_df.columns:
            raise HTTPException(status_code=400, detail="Location not found")

        result_ser = location_df[location_df[location] < radius * 1000][location].sort_values()

        results = [
            {
                "property": prop,
                "distance_km": round(dist / 1000, 2)
            }
            for prop, dist in result_ser.items()
        ]

        return {
            "location": location,
            "radius_km": radius,
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend")
async def recommend_properties(property_name: str, top_n: int = 5):
    try:
        if property_name not in location_df.index:
            raise HTTPException(status_code=400, detail="Property not found")

        cosine_sim_matrix = (
            0.5 * cosine_sim1 +
            0.8 * cosine_sim2 +
            1.0 * cosine_sim3
        )

        sim_scores = list(
            enumerate(cosine_sim_matrix[location_df.index.get_loc(property_name)])
        )

        sorted_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:top_n + 1]

        recommendations = [
            {
                "PropertyName": location_df.index[i],
                "SimilarityScore": round(score, 4)
            }
            for i, score in sorted_scores
        ]

        return {
            "original_property": property_name,
            "recommendations": recommendations
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": all([
            location_df is not None,
            cosine_sim1 is not None,
            cosine_sim2 is not None,
            cosine_sim3 is not None,
        ])
    }

# -----------------------------------------------------------------------------
# ENTRY POINT
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
