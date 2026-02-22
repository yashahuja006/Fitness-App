import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { preferences, prompt } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const enhancedPrompt = `
You are a professional nutritionist and dietitian. Create a comprehensive, personalized diet plan based on the following user information:

${prompt}

Please provide a detailed response in the following JSON format:
{
  "planTitle": "Personalized Diet Plan for [Goal]",
  "summary": {
    "dailyCalories": 2000,
    "macros": {
      "protein": "25%",
      "carbs": "45%", 
      "fats": "30%"
    },
    "mealsPerDay": ${preferences.mealsPerDay},
    "planDuration": "7 days"
  },
  "weeklyPlan": [
    {
      "day": 1,
      "dayName": "Monday",
      "meals": [
        {
          "type": "breakfast",
          "name": "Meal Name",
          "ingredients": ["ingredient1", "ingredient2"],
          "calories": 400,
          "protein": 20,
          "carbs": 45,
          "fats": 15,
          "prepTime": "15 minutes",
          "instructions": "Step by step cooking instructions"
        }
      ],
      "totalCalories": 2000,
      "waterIntake": "2.5L"
    }
  ],
  "shoppingList": {
    "proteins": ["chicken breast", "eggs"],
    "vegetables": ["spinach", "broccoli"],
    "fruits": ["banana", "apple"],
    "grains": ["oats", "brown rice"],
    "dairy": ["greek yogurt", "milk"],
    "other": ["olive oil", "nuts"]
  },
  "mealPrepTips": [
    "Prepare proteins in bulk on Sunday",
    "Pre-cut vegetables for quick cooking"
  ],
  "nutritionalGuidance": [
    "Drink water before each meal",
    "Include protein in every meal"
  ],
  "substitutions": {
    "vegetarian": ["Replace chicken with tofu"],
    "glutenFree": ["Use quinoa instead of wheat"]
  }
}

Make sure the plan is:
1. Nutritionally balanced and appropriate for the user's goals
2. Realistic and achievable 
3. Includes variety to prevent boredom
4. Considers the specified dietary restrictions and allergies
5. Fits within the specified budget and cooking time preferences
6. Includes proper portion sizes
7. Provides adequate hydration recommendations

Be specific with measurements, cooking methods, and timing.
`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    // Try to extract JSON from the response
    let dietPlan;
    try {
      // Look for JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        dietPlan = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create a structured response from the text
        dietPlan = {
          planTitle: "AI Generated Diet Plan",
          summary: {
            dailyCalories: 2000,
            macros: { protein: "25%", carbs: "45%", fats: "30%" },
            mealsPerDay: preferences.mealsPerDay,
            planDuration: "7 days"
          },
          rawResponse: text,
          weeklyPlan: [],
          shoppingList: {},
          mealPrepTips: [],
          nutritionalGuidance: []
        };
      }
    } catch (parseError) {
      // If JSON parsing fails, return the raw text with structure
      dietPlan = {
        planTitle: "AI Generated Diet Plan",
        summary: {
          dailyCalories: 2000,
          macros: { protein: "25%", carbs: "45%", fats: "30%" },
          mealsPerDay: preferences.mealsPerDay,
          planDuration: "7 days"
        },
        rawResponse: text,
        weeklyPlan: [],
        shoppingList: {},
        mealPrepTips: [],
        nutritionalGuidance: []
      };
    }

    // Generate a unique plan ID
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the plan (in a real app, you'd save to database)
    // For now, we'll just return it with an ID
    const planWithId = {
      id: planId,
      createdAt: new Date().toISOString(),
      preferences,
      ...dietPlan
    };

    return NextResponse.json({
      success: true,
      planId,
      plan: planWithId
    });

  } catch (error) {
    console.error('Error generating diet plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate diet plan' },
      { status: 500 }
    );
  }
}