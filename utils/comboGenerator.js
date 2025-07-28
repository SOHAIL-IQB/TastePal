const masterMenu = require('../data/menu');

class ComboGenerator {
  constructor() {
    this.dayProfiles = {
      Monday: ['savoury', 'sweet'],
      Tuesday: ['savoury', 'sweet'],
      Wednesday: ['savoury', 'sweet'],
      Thursday: ['spicy', 'savoury'],
      Friday: ['spicy', 'savoury'],
      Saturday: ['spicy', 'savoury'],
      Sunday: ['savoury', 'sweet']
    };
    this.usedItems = new Set();
    this.usedCombos = new Set();
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  filterByTasteProfile(items, allowedTastes) {
    return items.filter(item => allowedTastes.includes(item.taste_profile));
  }

  createRandomMenu(day) {
    const allowedTastes = this.dayProfiles[day];
    
    const filteredMainCourse = this.filterByTasteProfile(masterMenu.mainCourse, allowedTastes);
    const filteredSideDishes = this.filterByTasteProfile(masterMenu.sideDishes, allowedTastes);
    const filteredDrinks = this.filterByTasteProfile(masterMenu.drinks, allowedTastes);
    
    const mainCoursePool = filteredMainCourse.length >= 5 ? filteredMainCourse : masterMenu.mainCourse;
    const sideDishesPool = filteredSideDishes.length >= 4 ? filteredSideDishes : masterMenu.sideDishes;
    const drinksPool = filteredDrinks.length >= 4 ? filteredDrinks : masterMenu.drinks;
    
    return {
      mainCourse: this.shuffleArray(mainCoursePool).slice(0, 5),
      sideDishes: this.shuffleArray(sideDishesPool).slice(0, 4),
      drinks: this.shuffleArray(drinksPool).slice(0, 4)
    };
  }

  calculateComboCalories(combo) {
    return combo.main.calories + combo.side.calories + combo.drink.calories;
  }

  calculateComboPopularity(combo) {
    return Number(((combo.main.popularity_score + combo.side.popularity_score + combo.drink.popularity_score) / 3).toFixed(1));
  }

  determineTasteProfile(combo) {
    const tastes = [combo.main.taste_profile, combo.side.taste_profile, combo.drink.taste_profile];
    const tasteCount = {};
    
    tastes.forEach(taste => {
      tasteCount[taste] = (tasteCount[taste] || 0) + 1;
    });
    
    const dominantTaste = Object.keys(tasteCount).reduce((a, b) => 
      tasteCount[a] > tasteCount[b] ? a : b
    );
    
    const uniqueTastes = Object.keys(tasteCount).length;
    
    if (uniqueTastes === 1) {
      return dominantTaste;
    } else if (uniqueTastes === 2) {
      const sortedTastes = Object.keys(tasteCount).sort();
      return `${sortedTastes[0]}-${sortedTastes[1]}`;
    } else {
      return 'mixed';
    }
  }

  generateReasoningText(combo, day, tasteProfile) {
    const dayProfileText = this.dayProfiles[day].join(' and ');
    const calorieRange = "550-800 calorie range";
    const popularityText = "balanced popularity score";
    
    return `Perfect ${day} meal with ${tasteProfile} profile matching ${dayProfileText} preferences, ${calorieRange} maintained, ${popularityText} for satisfaction`;
  }

  // NEW: Check if items were used in recent days (sliding window)
  isValidComboWithHistory(combo, existingCombos, currentDayIndex) {
    const calories = this.calculateComboCalories(combo);
    
    // Check calorie range (550-800)
    if (calories < 550 || calories > 800) return false;
    
    // Check against recent days (sliding window of 3 days)
    const windowSize = 3;
    const startIndex = Math.max(0, currentDayIndex - windowSize + 1);
    
    for (let i = startIndex; i < currentDayIndex; i++) {
      if (existingCombos[i]) {
        const existingCombo = existingCombos[i];
        // Check if any item repeats in the window
        if (existingCombo.main === combo.main.name ||
            existingCombo.side === combo.side.name ||
            existingCombo.drink === combo.drink.name) {
          return false;
        }
      }
    }
    
    return true;
  }

  isValidCombo(combo, usedItems) {
    const calories = this.calculateComboCalories(combo);
    
    // Check calorie range (550-800)
    if (calories < 550 || calories > 800) return false;
    
    // Check if any item is already used
    if (usedItems.has(combo.main.id) || 
        usedItems.has(combo.side.id) || 
        usedItems.has(combo.drink.id)) return false;
    
    return true;
  }

  // Generate single day menu in JSON format
  generateSingleDayMenu(day) {
    const dailyMenu = this.createRandomMenu(day);
    let combo = null;
    let attempts = 0;
    const maxAttempts = 1000;
    const dailyUsedItems = new Set();
    
    while (!combo && attempts < maxAttempts) {
      attempts++;
      
      const main = dailyMenu.mainCourse[Math.floor(Math.random() * dailyMenu.mainCourse.length)];
      const side = dailyMenu.sideDishes[Math.floor(Math.random() * dailyMenu.sideDishes.length)];
      const drink = dailyMenu.drinks[Math.floor(Math.random() * dailyMenu.drinks.length)];
      
      const testCombo = { main, side, drink };
      
      if (this.isValidCombo(testCombo, dailyUsedItems)) {
        const totalCalories = this.calculateComboCalories(testCombo);
        const popularityScore = this.calculateComboPopularity(testCombo);
        const tasteProfile = this.determineTasteProfile(testCombo);
        
        combo = {
          combo_id: 1,
          day: day,
          main: main.name,
          side: side.name,
          drink: drink.name,
          total_calories: totalCalories,
          popularity_score: popularityScore,
          reasoning: this.generateReasoningText(testCombo, day, tasteProfile)
        };
        
        dailyUsedItems.add(main.id);
        dailyUsedItems.add(side.id);
        dailyUsedItems.add(drink.id);
      }
    }
    
    return combo ? [combo] : [];
  }

  // Generate three day menu in JSON format
  generateThreeDayMenu(startDay) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const startIndex = days.indexOf(startDay);
    const threeDays = [
      days[startIndex],
      days[(startIndex + 1) % 7],
      days[(startIndex + 2) % 7]
    ];
    
    const threeDayMenu = [];
    const globalUsedItems = new Set(); // No repetition within 3 days
    
    threeDays.forEach((day, dayIndex) => {
      const dailyMenu = this.createRandomMenu(day);
      let combo = null;
      let attempts = 0;
      const maxAttempts = 1000;
      
      while (!combo && attempts < maxAttempts) {
        attempts++;
        
        const main = dailyMenu.mainCourse[Math.floor(Math.random() * dailyMenu.mainCourse.length)];
        const side = dailyMenu.sideDishes[Math.floor(Math.random() * dailyMenu.sideDishes.length)];
        const drink = dailyMenu.drinks[Math.floor(Math.random() * dailyMenu.drinks.length)];
        
        const testCombo = { main, side, drink };
        
        if (this.isValidCombo(testCombo, globalUsedItems)) {
          const totalCalories = this.calculateComboCalories(testCombo);
          const popularityScore = this.calculateComboPopularity(testCombo);
          const tasteProfile = this.determineTasteProfile(testCombo);
          
          combo = {
            combo_id: dayIndex + 1,
            day: day,
            main: main.name,
            side: side.name,
            drink: drink.name,
            total_calories: totalCalories,
            popularity_score: popularityScore,
            reasoning: this.generateReasoningText(testCombo, day, tasteProfile)
          };
          
          globalUsedItems.add(main.id);
          globalUsedItems.add(side.id);
          globalUsedItems.add(drink.id);
        }
      }
      
      if (combo) {
        threeDayMenu.push(combo);
      }
    });
    
    return threeDayMenu;
  }

  // FIXED: Generate seven day menu with sliding window approach
  generateSevenDayMenu() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sevenDayMenu = [];
    
    let globalAttempts = 0;
    const maxGlobalAttempts = 5000;
    
    // Generate day by day with sliding window check
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = days[dayIndex];
      const dailyMenu = this.createRandomMenu(day);
      let combo = null;
      let attempts = 0;
      const maxAttempts = 1000;
      
      while (!combo && attempts < maxAttempts && globalAttempts < maxGlobalAttempts) {
        attempts++;
        globalAttempts++;
        
        const main = dailyMenu.mainCourse[Math.floor(Math.random() * dailyMenu.mainCourse.length)];
        const side = dailyMenu.sideDishes[Math.floor(Math.random() * dailyMenu.sideDishes.length)];
        const drink = dailyMenu.drinks[Math.floor(Math.random() * dailyMenu.drinks.length)];
        
        const testCombo = { main, side, drink };
        
        // Use sliding window validation for days after day 0
        const isValid = dayIndex === 0 ? 
          this.isValidCombo(testCombo, new Set()) : 
          this.isValidComboWithHistory(testCombo, sevenDayMenu, dayIndex);
        
        if (isValid) {
          const totalCalories = this.calculateComboCalories(testCombo);
          const popularityScore = this.calculateComboPopularity(testCombo);
          const tasteProfile = this.determineTasteProfile(testCombo);
          
          combo = {
            combo_id: dayIndex + 1,
            day: day,
            main: main.name,
            side: side.name,
            drink: drink.name,
            total_calories: totalCalories,
            popularity_score: popularityScore,
            reasoning: this.generateReasoningText(testCombo, day, tasteProfile)
          };
        }
      }
      
      // Fallback with more relaxed constraints if needed
      if (!combo) {
        let fallbackCombo = null;
        const allMains = masterMenu.mainCourse;
        const allSides = masterMenu.sideDishes;
        const allDrinks = masterMenu.drinks;
        
        // Try to find any valid calorie combination that doesn't repeat in last 2 days
        for (let retryAttempts = 0; retryAttempts < 100; retryAttempts++) {
          const main = allMains[Math.floor(Math.random() * allMains.length)];
          const side = allSides[Math.floor(Math.random() * allSides.length)];
          const drink = allDrinks[Math.floor(Math.random() * allDrinks.length)];
          
          const testCombo = { main, side, drink };
          const calories = this.calculateComboCalories(testCombo);
          
          if (calories >= 550 && calories <= 800) {
            // Check only last 2 days for fallback
            let isValidFallback = true;
            const checkDays = Math.min(2, dayIndex);
            
            for (let i = dayIndex - checkDays; i < dayIndex; i++) {
              if (sevenDayMenu[i]) {
                const existingCombo = sevenDayMenu[i];
                if (existingCombo.main === main.name ||
                    existingCombo.side === side.name ||
                    existingCombo.drink === drink.name) {
                  isValidFallback = false;
                  break;
                }
              }
            }
            
            if (isValidFallback) {
              const totalCalories = this.calculateComboCalories(testCombo);
              const popularityScore = this.calculateComboPopularity(testCombo);
              const tasteProfile = this.determineTasteProfile(testCombo);
              
              fallbackCombo = {
                combo_id: dayIndex + 1,
                day: day,
                main: main.name,
                side: side.name,
                drink: drink.name,
                total_calories: totalCalories,
                popularity_score: popularityScore,
                reasoning: this.generateReasoningText(testCombo, day, tasteProfile)
              };
              break;
            }
          }
        }
        
        combo = fallbackCombo;
      }
      
      if (combo) {
        sevenDayMenu.push(combo);
      }
    }
    
    return sevenDayMenu;
  }
}

module.exports = ComboGenerator;
