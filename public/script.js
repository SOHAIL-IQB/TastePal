class StickyTomatoesApp {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.setCurrentDay();
    }

    initializeElements() {
        this.daySelect = document.getElementById('daySelect');
        this.generateSingleDayBtn = document.getElementById('generateSingleDay');
        this.generateThreeDaysBtn = document.getElementById('generateThreeDays');
        this.generateSevenDaysBtn = document.getElementById('generateSevenDays');
        this.refreshBtn = document.getElementById('refreshButton');
        this.loading = document.getElementById('loading');
        this.results = document.getElementById('results');
    }

    attachEventListeners() {
        this.generateSingleDayBtn.addEventListener('click', () => this.generateSingleDay());
        this.generateThreeDaysBtn.addEventListener('click', () => this.generateThreeDays());
        this.generateSevenDaysBtn.addEventListener('click', () => this.generateSevenDays());
        this.refreshBtn.addEventListener('click', () => this.refreshPage());
    }

    setCurrentDay() {
        const today = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[today.getDay()];
        this.daySelect.value = currentDay;
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.results.innerHTML = '';
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }

    async generateSingleDay() {
        const selectedDay = this.daySelect.value;
        this.showLoading();

        try {
            const response = await fetch(`/api/combos/${selectedDay}`);
            const data = await response.json();

            if (response.ok) {
                this.displayJsonResults(data, `${selectedDay} Meal`);
            } else {
                this.displayError(data.error);
            }
        } catch (error) {
            this.displayError('Failed to generate single day meal. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async generateThreeDays() {
        const selectedDay = this.daySelect.value;
        this.showLoading();

        try {
            const response = await fetch(`/api/three-day-menu/${selectedDay}`);
            const data = await response.json();

            if (response.ok) {
                this.displayJsonResults(data, 'Three Day Menu');
            } else {
                this.displayError(data.error);
            }
        } catch (error) {
            this.displayError('Failed to generate three-day menu. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async generateSevenDays() {
        this.showLoading();

        try {
            const response = await fetch('/api/seven-day-menu');
            const data = await response.json();

            if (response.ok) {
                this.displayJsonResults(data, 'Seven Day Menu');
            } else {
                this.displayError(data.error);
            }
        } catch (error) {
            this.displayError('Failed to generate seven-day menu. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    displayJsonResults(data, title) {
        let html = `<h2 style="margin-bottom: 30px; color: #2c3e50; text-align: center;">${title} - JSON Format</h2>`;
        
        // Display as formatted JSON
        html += `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px; color: #2c3e50;">Raw JSON Output (${data.length} Meal${data.length > 1 ? 's' : ''}):</h4>
                <pre style="background: #2c3e50; color: #ecf0f1; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 14px; max-height: 400px; overflow-y: auto;">${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
        
        // Display in visual format
        html += '<h3 style="margin: 30px 0 20px 0; color: #2c3e50;">Visual Format:</h3>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
        
        data.forEach(meal => {
            html += `
                <div class="combo-card" style="border-left: 5px solid #3498db;">
                    <div class="combo-header">
                        <div class="combo-title">${meal.day} Meal</div>
                        <div class="taste-badge taste-mixed">${meal.popularity_score}</div>
                    </div>
                    
                    <div class="combo-items">
                        <div class="combo-item">
                            <span class="item-name">🍖 ${meal.main}</span>
                        </div>
                        <div class="combo-item">
                            <span class="item-name">🍞 ${meal.side}</span>
                        </div>
                        <div class="combo-item">
                            <span class="item-name">🥤 ${meal.drink}</span>
                        </div>
                    </div>
                    
                    <div class="combo-summary">
                        <div class="summary-item">
                            <div class="summary-label">Total Calories</div>
                            <div class="summary-value">${meal.total_calories}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Popularity</div>
                            <div class="summary-value">${meal.popularity_score}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 10px; background: #e8f5e8; border-radius: 5px; font-size: 0.9em; color: #27ae60;">
                        <strong>Reasoning:</strong> ${meal.reasoning}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Add summary statistics if more than one meal
        if (data.length > 1) {
            const totalCalories = data.reduce((sum, meal) => sum + meal.total_calories, 0);
            const avgCalories = Math.round(totalCalories / data.length);
            const avgPopularity = (data.reduce((sum, meal) => sum + meal.popularity_score, 0) / data.length).toFixed(1);
            
            html += `
                <div style="margin-top: 30px; padding: 20px; background: #f1f3f4; border-radius: 10px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Summary Statistics</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
                        <div>
                            <div style="font-size: 0.9em; color: #6c757d;">Total Meals</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #2c3e50;">${data.length}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.9em; color: #6c757d;">Total Calories</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #e74c3c;">${totalCalories}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.9em; color: #6c757d;">Avg Calories/Day</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #f39c12;">${avgCalories}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.9em; color: #6c757d;">Avg Popularity</div>
                            <div style="font-size: 1.5em; font-weight: bold; color: #27ae60;">${avgPopularity}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        this.results.innerHTML = html;
    }

    displayError(message) {
        this.results.innerHTML = `
            <div class="no-results">
                <h3>❌ Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    refreshPage() {
        location.reload();
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StickyTomatoesApp();
});
