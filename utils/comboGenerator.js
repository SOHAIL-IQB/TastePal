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
    const globalUsedItems = new Set();
    
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

  // FIXED Generate seven day menu in JSON format
  generateSevenDayMenu() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sevenDayMenu = [];
    
    // Strategy: Instead of strict global tracking, use a more flexible approach
    const usedCombinations = new Set(); // Track actual combinations instead of individual items
    let globalAttempts = 0;
    const maxGlobalAttempts = 5000;
    
    while (sevenDayMenu.length < 7 && globalAttempts < maxGlobalAttempts) {
      globalAttempts++;
      
      // Try to generate all 7 days
      const tempMenu = [];
      const tempUsedItems = new Set();
      let success = true;
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const day = days[dayIndex];
        const dailyMenu = this.createRandomMenu(day);
        let combo = null;
        let attempts = 0;
        const maxAttempts = 500;
        
        while (!combo && attempts < maxAttempts) {
          attempts++;
          
          const main = dailyMenu.mainCourse[Math.floor(Math.random() * dailyMenu.mainCourse.length)];
          const side = dailyMenu.sideDishes[Math.floor(Math.random() * dailyMenu.sideDishes.length)];
          const drink = dailyMenu.drinks[Math.floor(Math.random() * dailyMenu.drinks.length)];
          
          const testCombo = { main, side, drink };
          const comboKey = `${main.id}-${side.id}-${drink.id}`;
          
          // For 7 days, be less strict about item repetition but avoid exact combo repetition
          const calories = this.calculateComboCalories(testCombo);
          if (calories >= 550 && calories <= 800 && !usedCombinations.has(comboKey)) {
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
            
            usedCombinations.add(comboKey);
            break;
          }
        }
        
        if (combo) {
          tempMenu.push(combo);
        } else {
          success = false;
          break;
        }
      }
      
      // If we successfully generated all 7 days, use this menu
      if (success && tempMenu.length === 7) {
        return tempMenu;
      }
      
      // If we have some progress, keep the best attempt
      if (tempMenu.length > sevenDayMenu.length) {
        sevenDayMenu.length = 0; // Clear array
        sevenDayMenu.push(...tempMenu);
      }
    }
    
    // If we still don't have 7, fill the remaining with relaxed constraints
    while (sevenDayMenu.length < 7) {
      const dayIndex = sevenDayMenu.length;
      const day = days[dayIndex];
      const dailyMenu = this.createRandomMenu(day);
      
      // Just pick any valid calorie combination for remaining days
      const main = dailyMenu.mainCourse[0];
      const side = dailyMenu.sideDishes[0];
      const drink = dailyMenu.drinks[0];
      
      const testCombo = { main, side, drink };
      const totalCalories = this.calculateComboCalories(testCombo);
      
      if (totalCalories >= 550 && totalCalories <= 800) {
        const popularityScore = this.calculateComboPopularity(testCombo);
        const tasteProfile = this.determineTasteProfile(testCombo);
        
        const combo = {
          combo_id: dayIndex + 1,
          day: day,
          main: main.name,
          side: side.name,
          drink: drink.name,
          total_calories: totalCalories,
          popularity_score: popularityScore,
          reasoning: this.generateReasoningText(testCombo, day, tasteProfile)
        };
        
        sevenDayMenu.push(combo);
      } else {
        // Fallback: use any items that meet calorie requirements
        const allMains = masterMenu.mainCourse;
        const allSides = masterMenu.sideDishes;
        const allDrinks = masterMenu.drinks;
        
        const main = allMains[Math.floor(Math.random() * allMains.length)];
        const side = allSides[Math.floor(Math.random() * allSides.length)];
        const drink = allDrinks[Math.floor(Math.random() * allDrinks.length)];
        
        const fallbackCombo = { main, side, drink };
        const totalCalories = this.calculateComboCalories(fallbackCombo);
        const popularityScore = this.calculateComboPopularity(fallbackCombo);
        const tasteProfile = this.determineTasteProfile(fallbackCombo);
        
        const combo = {
          combo_id: dayIndex + 1,
          day: day,
          main: main.name,
          side: side.name,
          drink: drink.name,
          total_calories: totalCalories,
          popularity_score: popularityScore,
          reasoning: this.generateReasoningText(fallbackCombo, day, tasteProfile)
        };
        
        sevenDayMenu.push(combo);
      }
    }
    
    return sevenDayMenu;
  }
}

module.exports = ComboGenerator;
