/**
 * Property Price Prediction Frontend Integration
 * Handles form submission and API communication
 */

class PropertyPricePredictor {
    constructor() {
        this.apiBaseUrl = 'http://127.0.0.1:8000';
        this.isLoading = false;
        this.debug = true;
    }

    /**
     * Log messages for debugging
     */
    log(message, data = null) {
        if (this.debug) {
            if (data) {
                console.log(`[PropertyPredictor] ${message}`, data);
            } else {
                console.log(`[PropertyPredictor] ${message}`);
            }
        }
    }

    /**
     * Initialize the predictor
     */
    async init() {
        try {
            this.log('Initializing Property Price Predictor...');
            await this.loadDropdownOptions();
            this.setupEventListeners();
            this.log('Property Price Predictor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize predictor:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Load dropdown options from API
     */
    async loadDropdownOptions() {
        try {
            this.log('Loading dropdown options...');
            const response = await fetch(`${this.apiBaseUrl}/dropdown_options`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const options = await response.json();
            this.populateDropdowns(options);
            this.log('Dropdown options loaded successfully');
        } catch (error) {
            console.warn('Error loading dropdown options:', error);
            this.log('Continuing without dropdown options - user can type manually');
        }
    }

    /**
     * Populate dropdown menus with options
     */
    populateDropdowns(options) {
        const dropdowns = {
            'property_type': options.property_type || [],
            'sector': options.sector || [],
            'agePossession': options.agePossession || [],
            'furnishing_type': options.furnishing_type || [],
            'luxury_category': options.luxury_category || [],
            'floor_category': options.floor_category || []
        };

        for (const [fieldId, values] of Object.entries(dropdowns)) {
            const selectElement = document.getElementById(fieldId);
            if (selectElement && values.length > 0) {
                // Clear existing options except the first one (placeholder)
                while (selectElement.options.length > 1) {
                    selectElement.remove(1);
                }

                // Add new options
                values.forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    selectElement.appendChild(option);
                });
                
                this.log(`Populated ${fieldId} with ${values.length} options`);
            }
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const predictButton = document.getElementById('predict-button');
        const resetButton = document.getElementById('reset-button');
        const predictionForm = document.getElementById('prediction-form');
        const viewJsonButton = document.getElementById('view-json-button');
        const predictJsonButton = document.getElementById('predict-json-button');

        if (predictButton) {
            predictButton.addEventListener('click', () => this.predictPrice());
            this.log('Predict button event listener added');
        } else {
            console.error('Predict button not found!');
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetForm());
            this.log('Reset button event listener added');
        }

        if (predictionForm) {
            predictionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.predictPrice();
            });
            this.log('Form submit event listener added');
        }

        // JSON button listeners
        if (viewJsonButton) {
            viewJsonButton.addEventListener('click', () => this.viewJSONFile());
            this.log('View JSON button event listener added');
        }

        if (predictJsonButton) {
            predictJsonButton.addEventListener('click', () => this.predictFromJSON());
            this.log('Predict JSON button event listener added');
        }

        // Add input validation
        this.setupInputValidation();
    }

    /**
     * Set up real-time input validation
     */
    setupInputValidation() {
        const numericFields = ['bedRoom', 'bathroom', 'balcony', 'built_up_area', 'servant_room', 'store_room'];
        
        numericFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', (e) => {
                    this.validateNumericField(e.target);
                });
                field.addEventListener('blur', (e) => {
                    this.validateNumericField(e.target);
                });
            }
        });
        
        this.log('Input validation setup completed');
    }

    /**
     * Validate numeric field input
     */
    validateNumericField(field) {
        const value = field.value.trim();
        if (value === '') {
            field.style.borderColor = '';
            this.clearFieldError(field.id);
            return;
        }

        const numValue = parseFloat(value);
        const min = parseFloat(field.min) || 0;
        const max = parseFloat(field.max) || Infinity;

        if (isNaN(numValue) || numValue < min || numValue > max) {
            field.style.borderColor = '#dc2626';
            this.showFieldError(field.id, `Please enter a value between ${min} and ${max}`);
        } else {
            field.style.borderColor = '#10b981';
            this.clearFieldError(field.id);
        }
    }

    /**
     * Show field-specific error message
     */
    showFieldError(fieldId, message) {
        this.clearFieldError(fieldId);
        
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.id = `${fieldId}-error`;
        errorElement.textContent = message;
        errorElement.style.color = '#dc2626';
        errorElement.style.fontSize = '0.8em';
        errorElement.style.marginTop = '5px';
        errorElement.style.fontWeight = '500';
        
        field.parentNode.appendChild(errorElement);
    }

    /**
     * Clear field-specific error message
     */
    clearFieldError(fieldId) {
        const existingError = document.getElementById(`${fieldId}-error`);
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Main function to predict property price from form
     */
    async predictPrice() {
        if (this.isLoading) {
            this.log('Prediction already in progress...');
            return;
        }

        this.log('Starting price prediction from form...');

        // Validate form before submission
        if (!this.validateForm()) {
            this.log('Form validation failed');
            return;
        }

        this.setLoadingState(true);

        try {
            const formData = this.collectFormData();
            this.log('Form data collected:', formData);
            
            const prediction = await this.sendPredictionRequest(formData);
            this.log('Prediction received:', prediction);
            
            this.displayPredictionResult(prediction);
        } catch (error) {
            this.handlePredictionError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Predict property price from JSON file
     */
    async predictFromJSON() {
        if (this.isLoading) {
            return;
        }

        this.setLoadingState(true);

        try {
            this.log('Fetching prediction from property_price.json...');
            
            const response = await fetch(`${this.apiBaseUrl}/predict_from_json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const prediction = await response.json();
            this.log('JSON prediction received:', prediction);
            
            this.displayJSONPredictionResult(prediction);
            
        } catch (error) {
            this.handlePredictionError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * View current JSON file contents
     */
    async viewJSONFile() {
        try {
            this.log('Fetching JSON file contents...');
            
            const response = await fetch(`${this.apiBaseUrl}/view_json`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const jsonData = await response.json();
            
            // Display JSON data in a readable format
            this.displayJSONData(jsonData);
            
        } catch (error) {
            console.error('Error viewing JSON file:', error);
            this.showError(`Failed to view JSON file: ${error.message}`);
        }
    }

    /**
     * Collect and validate form data
     */
    collectFormData() {
        // Get all form values
        const formData = {
            property_type: this.getValue('property_type'),
            sector: this.getValue('sector'),
            bedRoom: this.getNumberValue('bedRoom'),
            bathroom: this.getNumberValue('bathroom'),
            balcony: this.getNumberValue('balcony'),
            agePossession: this.getValue('agePossession'),
            built_up_area: this.getNumberValue('built_up_area'),
            servant_room: this.getNumberValue('servant_room'),
            store_room: this.getNumberValue('store_room'),
            furnishing_type: this.getValue('furnishing_type'),
            luxury_category: this.getValue('luxury_category'),
            floor_category: this.getValue('floor_category')
        };

        this.log('Collected form data:', formData);
        return formData;
    }

    /**
     * Get string value from form field
     */
    getValue(fieldId) {
        const element = document.getElementById(fieldId);
        return element ? element.value.trim() : '';
    }

    /**
     * Get numeric value from form field
     */
    getNumberValue(fieldId) {
        const element = document.getElementById(fieldId);
        if (!element || !element.value.trim()) return 0;
        
        const value = parseFloat(element.value);
        return isNaN(value) ? 0 : value;
    }

    /**
     * Validate all form fields
     */
    validateForm() {
        let isValid = true;
        const requiredFields = [
            'property_type', 'sector', 'bedRoom', 'bathroom', 'balcony',
            'agePossession', 'built_up_area', 'furnishing_type', 
            'luxury_category', 'floor_category'
        ];

        // Clear all previous errors
        requiredFields.forEach(fieldId => this.clearFieldError(fieldId));

        // Check required fields
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                this.showFieldError(fieldId, 'This field is required');
                isValid = false;
            }
        });

        // Validate numeric fields
        const numericFields = [
            { id: 'bedRoom', min: 1, max: 10 },
            { id: 'bathroom', min: 1, max: 10 },
            { id: 'balcony', min: 0, max: 5 },
            { id: 'built_up_area', min: 100, max: 10000 },
            { id: 'servant_room', min: 0, max: 2 },
            { id: 'store_room', min: 0, max: 2 }
        ];

        numericFields.forEach(({ id, min, max }) => {
            const field = document.getElementById(id);
            if (field && field.value.trim()) {
                const value = parseFloat(field.value);
                if (isNaN(value) || value < min || value > max) {
                    this.showFieldError(id, `Please enter a value between ${min} and ${max}`);
                    isValid = false;
                }
            }
        });

        if (!isValid) {
            this.showError('Please fix the errors in the form before submitting.');
        } else {
            this.log('Form validation passed');
        }

        return isValid;
    }

    /**
     * Send prediction request to API
     */
    async sendPredictionRequest(formData) {
        this.log('Sending prediction request to API...');
        
        const response = await fetch(`${this.apiBaseUrl}/predict_price`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        this.log(`API response status: ${response.status}`);

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        this.log('Prediction API response:', result);
        return result;
    }

    /**
     * Display prediction result from form
     */
    displayPredictionResult(prediction) {
        const resultElement = document.getElementById('prediction-result');
        if (!resultElement) {
            console.error('Result element not found!');
            return;
        }

        this.ensureResultStyling();

        resultElement.innerHTML = `
            <div class="prediction-success">
                <div class="success-icon">💰</div>
                <h3>Predicted Property Price</h3>
                <div class="price-range">
                    <span class="price-low">${prediction.predicted_price_low} ${prediction.unit}</span>
                    <span class="price-separator"> to </span>
                    <span class="price-high">${prediction.predicted_price_high} ${prediction.unit}</span>
                </div>
                <p class="price-note">Based on the provided property features</p>
            </div>
        `;

        this.log('Form prediction result displayed');
        
        // Scroll to result smoothly
        setTimeout(() => {
            resultElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }, 100);
    }

    /**
     * Display prediction result from JSON
     */
    displayJSONPredictionResult(prediction) {
        const resultElement = document.getElementById('prediction-result');
        if (!resultElement) return;

        this.ensureResultStyling();

        resultElement.innerHTML = `
            <div class="prediction-success">
                <div class="success-icon">📄</div>
                <h3>Predicted Price from JSON File</h3>
                <div class="price-range">
                    <span class="price-low">${prediction.predicted_price_low} ${prediction.unit}</span>
                    <span class="price-separator"> to </span>
                    <span class="price-high">${prediction.predicted_price_high} ${prediction.unit}</span>
                </div>
                <p class="price-note">Based on data from property_price.json</p>
                <div class="json-info">
                    <small>Source: ${prediction.source || 'JSON file'}</small>
                </div>
            </div>
        `;

        this.log('JSON prediction result displayed');
        
        setTimeout(() => {
            resultElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }, 100);
    }

    /**
     * Display JSON file contents
     */
    displayJSONData(jsonData) {
        const resultElement = document.getElementById('prediction-result');
        if (!resultElement) return;

        // Format the JSON data for display
        const formattedData = Object.entries(jsonData)
            .map(([key, value]) => `<div class="json-item"><strong>${key}:</strong> ${value}</div>`)
            .join('');

        resultElement.innerHTML = `
            <div class="json-view">
                <h3>📄 property_price.json Contents</h3>
                <div class="json-data">
                    ${formattedData}
                </div>
                <div class="json-actions">
                    <button onclick="propertyPredictor.predictFromJSON()" class="btn-primary">
                        Predict from this JSON
                    </button>
                </div>
            </div>
        `;

        this.ensureJSONStyling();
        this.log('JSON data displayed');
    }

    /**
     * Ensure result element has proper styling
     */
    ensureResultStyling() {
        if (!document.querySelector('#prediction-styles')) {
            const style = document.createElement('style');
            style.id = 'prediction-styles';
            style.textContent = `
                .prediction-success {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border: 2px solid #0ea5e9;
                    border-radius: 12px;
                    padding: 25px;
                    text-align: center;
                    margin: 20px 0;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                }
                .prediction-success h3 {
                    margin: 0 0 15px 0;
                    color: #0369a1;
                    font-size: 1.4em;
                }
                .success-icon {
                    font-size: 2.5em;
                    margin-bottom: 10px;
                }
                .price-range {
                    font-size: 1.8em;
                    font-weight: bold;
                    margin: 15px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .price-low { 
                    color: #059669; 
                    background: #ecfdf5;
                    padding: 5px 12px;
                    border-radius: 6px;
                }
                .price-high { 
                    color: #dc2626; 
                    background: #fef2f2;
                    padding: 5px 12px;
                    border-radius: 6px;
                }
                .price-separator { 
                    color: #6b7280;
                    font-weight: normal;
                }
                .price-note {
                    font-size: 1em;
                    color: #6b7280;
                    margin: 15px 0 5px 0;
                }
                .json-info {
                    margin-top: 10px;
                }
                .json-info small {
                    color: #9ca3af;
                    font-style: italic;
                }
                .loading {
                    opacity: 0.7;
                    pointer-events: none;
                }
                .field-error {
                    color: #dc2626;
                    font-size: 0.8em;
                    margin-top: 5px;
                    font-weight: 500;
                }
                .btn-primary:disabled {
                    background-color: #9ca3af;
                    cursor: not-allowed;
                }
            `;
            document.head.appendChild(style);
            this.log('Prediction styles added');
        }
    }

    /**
     * Ensure JSON-specific styling
     */
    ensureJSONStyling() {
        if (!document.querySelector('#json-styles')) {
            const style = document.createElement('style');
            style.id = 'json-styles';
            style.textContent = `
                .json-view {
                    background: #f8f9fa;
                    border: 2px solid #6c757d;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .json-view h3 {
                    margin: 0 0 15px 0;
                    color: #495057;
                }
                .json-data {
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                .json-item {
                    padding: 5px 0;
                    border-bottom: 1px solid #f1f3f4;
                }
                .json-item:last-child {
                    border-bottom: none;
                }
                .json-item strong {
                    color: #2c3e50;
                    min-width: 150px;
                    display: inline-block;
                }
                .json-actions {
                    text-align: center;
                }
            `;
            document.head.appendChild(style);
            this.log('JSON styles added');
        }
    }

    /**
     * Handle prediction errors
     */
    handlePredictionError(error) {
        console.error('Prediction error:', error);
        this.log(`Prediction failed: ${error.message}`);
        
        const resultElement = document.getElementById('prediction-result');
        if (resultElement) {
            resultElement.innerHTML = `
                <div class="prediction-error">
                    <div class="error-icon">❌</div>
                    <h3>Prediction Failed</h3>
                    <p>${this.getUserFriendlyErrorMessage(error)}</p>
                    <div class="error-actions">
                        <button onclick="propertyPredictor.resetForm()" class="btn-secondary" style="margin: 10px;">
                            Try Again
                        </button>
                    </div>
                </div>
            `;

            // Add error styling if not present
            if (!document.querySelector('.prediction-error')) {
                const errorStyle = document.createElement('style');
                errorStyle.textContent = `
                    .prediction-error {
                        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                        border: 2px solid #dc2626;
                        border-radius: 12px;
                        padding: 25px;
                        text-align: center;
                        margin: 20px 0;
                        color: #dc2626;
                    }
                    .error-icon {
                        font-size: 2.5em;
                        margin-bottom: 10px;
                    }
                    .prediction-error h3 {
                        margin: 0 0 15px 0;
                    }
                    .error-actions {
                        margin-top: 15px;
                    }
                `;
                document.head.appendChild(errorStyle);
            }
        }

        this.showError(`Prediction failed: ${this.getUserFriendlyErrorMessage(error)}`);
    }

    /**
     * Convert technical errors to user-friendly messages
     */
    getUserFriendlyErrorMessage(error) {
        const message = error.message || 'An unexpected error occurred';
        
        if (message.includes('Failed to fetch')) {
            return 'Cannot connect to the server. Please make sure the backend server is running on http://127.0.0.1:8000';
        } else if (message.includes('404')) {
            return 'Server endpoint not found. Please check the API URL.';
        } else if (message.includes('500')) {
            return 'Server error occurred. Please try again later.';
        } else if (message.includes('Models not loaded')) {
            return 'Prediction models are not ready. Please try again in a moment.';
        } else if (message.includes('JSON file not found')) {
            return 'property_price.json file not found. Please create the file first.';
        } else if (message.includes('Invalid JSON format')) {
            return 'Invalid JSON format in property_price.json file.';
        } else {
            return message;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Use browser notification or custom notification system
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
        } else {
            // Fallback to alert
            alert(`Error: ${message}`);
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        const predictButton = document.getElementById('predict-button');
        const predictJsonButton = document.getElementById('predict-json-button');
        const resultElement = document.getElementById('prediction-result');

        // Disable both predict buttons during loading
        [predictButton, predictJsonButton].forEach(button => {
            if (button) {
                button.disabled = loading;
                if (button.id === 'predict-button') {
                    button.textContent = loading ? '🔮 Predicting...' : 'Predict Price';
                } else if (button.id === 'predict-json-button') {
                    button.textContent = loading ? '📄 Predicting...' : 'Predict from JSON';
                }
                button.classList.toggle('loading', loading);
            }
        });

        if (resultElement && loading) {
            resultElement.innerHTML = `
                <div class="loading-state" style="text-align: center; padding: 30px;">
                    <div style="font-size: 2em; margin-bottom: 10px;">⏳</div>
                    <div style="color: #0ea5e9; font-weight: 500;">Calculating prediction...</div>
                    <div style="color: #6b7280; font-size: 0.9em; margin-top: 10px;">
                        Analyzing property features
                    </div>
                </div>
            `;
        }

        this.log(`Loading state: ${loading}`);
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        const form = document.getElementById('prediction-form');
        if (form) {
            form.reset();
            this.log('Form reset');
        }
        
        const resultElement = document.getElementById('prediction-result');
        if (resultElement) {
            resultElement.innerHTML = '';
            this.log('Result cleared');
        }

        // Clear all field errors and reset borders
        const errorElements = document.querySelectorAll('.field-error');
        errorElements.forEach(el => el.remove());
        
        const fields = document.querySelectorAll('input, select');
        fields.forEach(field => {
            field.style.borderColor = '';
        });
    }
}

// Create global instance
const propertyPredictor = new PropertyPricePredictor();

// Initialize the predictor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    propertyPredictor.init();
});

// Export for use in module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PropertyPricePredictor;
}