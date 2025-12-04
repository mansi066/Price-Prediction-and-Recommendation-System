/**
 * Property Recommendation System Frontend
 * Handles API communication for property search and recommendations
 */

class PropertyRecommendationSystem {
    constructor() {
        this.apiBaseUrl = 'http://127.0.0.1:8000';
        this.isLoading = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Property Recommendation System...');
            await this.loadDropdownOptions();
            this.setupEventListeners();
            console.log('Property Recommendation System initialized successfully');
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Load dropdown options from API
     */
    async loadDropdownOptions() {
        try {
            // Load locations
            const locationsResponse = await fetch(`${this.apiBaseUrl}/locations`);
            if (!locationsResponse.ok) throw new Error('Failed to load locations');
            const locationsData = await locationsResponse.json();
            this.populateDropdown('location', locationsData.locations);

            // Load properties
            const propertiesResponse = await fetch(`${this.apiBaseUrl}/properties`);
            if (!propertiesResponse.ok) throw new Error('Failed to load properties');
            const propertiesData = await propertiesResponse.json();
            this.populateDropdown('property', propertiesData.properties);

        } catch (error) {
            console.error('Error loading dropdown options:', error);
            this.showError('Error loading data. Please check if the server is running.');
        }
    }

    /**
     * Populate dropdown with options
     */
    populateDropdown(dropdownId, options) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">Select an option</option>';
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            dropdown.appendChild(optionElement);
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Enter key support for inputs
        document.getElementById('radius').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchLocation();
        });

        document.getElementById('top-n').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.getRecommendations();
        });
    }

    /**
     * Search properties by location and radius
     */
    async searchLocation() {
        if (this.isLoading) return;

        const location = document.getElementById('location').value;
        const radius = document.getElementById('radius').value;
        const resultsDiv = document.getElementById('location-results');
        const button = document.getElementById('search-btn');

        if (!location) {
            this.showError('Please select a location', resultsDiv);
            return;
        }

        if (!radius || radius <= 0) {
            this.showError('Please enter a valid radius', resultsDiv);
            return;
        }

        this.setLoadingState(true, button, 'Searching...');

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/search-location?location=${encodeURIComponent(location)}&radius=${radius}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayLocationResults(data, resultsDiv);

        } catch (error) {
            console.error('Search error:', error);
            this.showError(`Search failed: ${error.message}`, resultsDiv);
        } finally {
            this.setLoadingState(false, button, '🔍 Search Properties');
        }
    }

    /**
     * Get property recommendations
     */
    async getRecommendations() {
        if (this.isLoading) return;

        const property = document.getElementById('property').value;
        const topN = document.getElementById('top-n').value;
        const resultsDiv = document.getElementById('recommendation-results');
        const button = document.getElementById('recommend-btn');

        if (!property) {
            this.showError('Please select a property', resultsDiv);
            return;
        }

        this.setLoadingState(true, button, 'Getting recommendations...');

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/recommend?property_name=${encodeURIComponent(property)}&top_n=${topN}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayRecommendationResults(data, resultsDiv);

        } catch (error) {
            console.error('Recommendation error:', error);
            this.showError(`Recommendation failed: ${error.message}`, resultsDiv);
        } finally {
            this.setLoadingState(false, button, '🚀 Get Recommendations');
        }
    }

    /**
     * Display location search results
     */
    displayLocationResults(data, resultsDiv) {
        if (!data.results || data.results.length === 0) {
            resultsDiv.innerHTML = `
                <div class="success">
                    No properties found within ${data.radius_km} km of ${data.location}
                </div>
            `;
            return;
        }

        let html = `
            <div class="success">
                Found ${data.results.length} properties within ${data.radius_km} km of ${data.location}
            </div>
        `;

        data.results.forEach(result => {
            html += `
                <div class="result-item">
                    <div class="property-name">${result.property}</div>
                    <div class="distance">📍 ${result.distance_km} km away</div>
                </div>
            `;
        });

        resultsDiv.innerHTML = html;
    }

    /**
     * Display recommendation results
     */
    displayRecommendationResults(data, resultsDiv) {
        let html = `
            <div class="success">
                Top ${data.recommendations.length} recommendations similar to "${data.original_property}"
            </div>
        `;

        data.recommendations.forEach((rec, index) => {
            html += `
                <div class="result-item">
                    <div class="property-name">${index + 1}. ${rec.PropertyName}</div>
                    <div class="similarity">🤖 Similarity Score: ${rec.SimilarityScore}</div>
                </div>
            `;
        });

        resultsDiv.innerHTML = html;
    }

    /**
     * Show error message
     */
    showError(message, element = null) {
        const errorHtml = `<div class="error">${message}</div>`;
        
        if (element) {
            element.innerHTML = errorHtml;
        } else {
            // Create a temporary notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #f5c6cb;
                z-index: 1000;
                max-width: 400px;
            `;
            notification.innerHTML = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 5000);
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(loading, button, text) {
        this.isLoading = loading;
        if (button) {
            button.disabled = loading;
            button.textContent = text;
        }
    }
}

// Create global instance
const propertySystem = new PropertyRecommendationSystem();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    propertySystem.init();
});

// Global functions for HTML onclick handlers
function searchLocation() {
    propertySystem.searchLocation();
}

function getRecommendations() {
    propertySystem.getRecommendations();
}