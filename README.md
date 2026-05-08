# Price Prediction and Recommendation System

A full-stack web application for property price prediction and intelligent property recommendations. This system combines machine learning capabilities with a modern web interface to help users predict property prices and find suitable properties based on their preferences.

## Features

- **Property Price Prediction**: Predict property prices based on various features using machine learning models
- **Property Recommendations**: Get personalized property recommendations based on user preferences
- **Modern UI**: Responsive and intuitive user interface built with Next.js and React
- **REST API**: Complete backend API for prediction and recommendation services
- **Real-time Processing**: Fast prediction and recommendation generation

## Technology Stack

### Frontend
- **Next.js 14**: React framework for production
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Components**: Custom UI component library
- **Shadcn UI**: High-quality React components

### Backend
- **Python 3.x**: Core programming language
- **FastAPI**: Modern, fast web framework for building APIs
- **Machine Learning**: Models for price prediction and recommendations
- **Pandas/Numpy**: Data processing and manipulation

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── navbar.tsx        # Navigation bar
│   ├── hero.tsx          # Hero section
│   ├── about.tsx         # About section
│   ├── footer.tsx        # Footer component
│   ├── price-prediction.tsx      # Price prediction component
│   └── property-recommendation.tsx # Recommendations component
├── backend/              # Python backend
│   ├── api/
│   │   ├── main.py      # FastAPI application entry point
│   │   ├── recommendation.py # Recommendation logic
│   │   └── __init__.py
│   ├── datasets/
│   │   └── appartments.csv # Property dataset
│   ├── models/          # Machine learning models
│   ├── services/        # Business logic services
│   └── requirements.txt  # Python dependencies
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
│   ├── api.ts          # API client functions
│   └── utils.ts        # Helper utilities
├── public/             # Static assets
└── styles/             # Global stylesheets
```

## Installation

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.8+
- Git

### Frontend Setup

1. Navigate to the project root:
```bash
cd Price-Prediction-and-Recommendation-System
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Create a `.env.local` file for environment variables (if needed):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a Python virtual environment:
```bash
python -m venv venv
source venv/Scripts/activate  # On Windows
# or
source venv/bin/activate  # On macOS/Linux
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

### Development Mode

**Terminal 1 - Frontend (Next.js):**
```bash
pnpm dev
# or
npm run dev
```
The frontend will be available at `http://localhost:3000`

**Terminal 2 - Backend (FastAPI):**
```bash
cd backend
python -m api.main
# or
uvicorn api.main:app --reload
```
The backend API will be available at `http://localhost:8000`

### Production Build

**Frontend:**
```bash
pnpm build
pnpm start
```

**Backend:**
```bash
cd backend
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Price Prediction
- **POST** `/api/predict` - Predict property price based on features
  - Request: Property features (location, size, bedrooms, etc.)
  - Response: Predicted price

### Recommendations
- **POST** `/api/recommend` - Get property recommendations
  - Request: User preferences and criteria
  - Response: List of recommended properties

## Configuration

### Environment Variables

Create `.env.local` in the root directory for frontend configuration:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key Components

### Frontend Components
- **Price Prediction Component**: Form for property price prediction
- **Property Recommendation Component**: Interface for getting recommendations
- **Navbar**: Navigation and branding
- **Hero Section**: Landing page hero component
- **Footer**: Application footer

### Backend Modules
- **main.py**: FastAPI application setup and route definitions
- **recommendation.py**: Property recommendation algorithm
- **services/**: Business logic implementation
- **models/**: Machine learning model management

## Data

The system uses a property dataset stored in `backend/datasets/appartments.csv` containing various property features used for training and predictions.

## Development

### Code Style
- Frontend: ESLint + Prettier (TypeScript/React)
- Backend: PEP 8 compliance

### Adding New Features

1. Frontend: Add components in `components/` and wire them in `app/page.tsx`
2. Backend: Add routes in `api/main.py` and implement logic in service modules

## Troubleshooting

### Common Issues

1. **Backend not connecting**: Ensure the FastAPI server is running and `NEXT_PUBLIC_API_URL` is correctly configured
2. **Port conflicts**: Change ports in development commands if defaults are in use
3. **Missing dependencies**: Reinstall with `pnpm install` or `pip install -r requirements.txt`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is part of the OpenMRS initiative.

## Support

For issues or questions, please check the project documentation or contact the development team.
