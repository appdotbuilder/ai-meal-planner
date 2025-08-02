
import { db } from '../db';
import { 
  mealPlansTable, 
  mealPlanRecipesTable, 
  recipesTable, 
  recipeIngredientsTable, 
  ingredientsTable 
} from '../db/schema';
import { type CreateMealPlanInput, type MealPlanWithRecipes, type GroceryListItem } from '../schema';
import { eq, and, lte, SQL } from 'drizzle-orm';

export async function createMealPlan(input: CreateMealPlanInput): Promise<MealPlanWithRecipes> {
  try {
    // Step 1: Find suitable recipes based on dietary preference and budget constraints
    const availableRecipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.dietary_preference, input.dietary_preference))
      .execute();

    if (availableRecipes.length === 0) {
      throw new Error(`No recipes found for dietary preference: ${input.dietary_preference}`);
    }

    // Step 2: Select recipes for the week (21 meals: 7 days × 3 meals)
    // Simple algorithm: cycle through available recipes, prioritizing budget-friendly options
    const budgetPerMeal = input.weekly_budget / 21;
    const suitableRecipes = availableRecipes
      .filter(recipe => parseFloat(recipe.estimated_cost) <= budgetPerMeal * 2) // Allow some flexibility
      .sort((a, b) => parseFloat(a.estimated_cost) - parseFloat(b.estimated_cost)); // Sort by cost

    if (suitableRecipes.length === 0) {
      throw new Error('No recipes found within budget constraints');
    }

    // Step 3: Create the meal plan record
    const mealPlanResult = await db.insert(mealPlansTable)
      .values({
        user_id: input.user_id,
        week_start_date: input.week_start_date,
        dietary_preference: input.dietary_preference,
        weekly_budget: input.weekly_budget.toString(),
        total_estimated_cost: '0' // Will be calculated later
      })
      .returning()
      .execute();

    const mealPlan = mealPlanResult[0];

    // Step 4: Assign recipes to specific days and meal types
    const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
    const assignedRecipes: Array<{
      day_of_week: number;
      meal_type: typeof mealTypes[number];
      recipe_id: number;
    }> = [];

    let recipeIndex = 0;
    let totalCost = 0;

    for (let day = 0; day < 7; day++) {
      for (const mealType of mealTypes) {
        const selectedRecipe = suitableRecipes[recipeIndex % suitableRecipes.length];
        
        assignedRecipes.push({
          day_of_week: day,
          meal_type: mealType,
          recipe_id: selectedRecipe.id
        });

        totalCost += parseFloat(selectedRecipe.estimated_cost);
        recipeIndex++;
      }
    }

    // Step 5: Insert meal plan recipes
    await db.insert(mealPlanRecipesTable)
      .values(assignedRecipes.map(assignment => ({
        meal_plan_id: mealPlan.id,
        recipe_id: assignment.recipe_id,
        day_of_week: assignment.day_of_week,
        meal_type: assignment.meal_type
      })))
      .execute();

    // Step 6: Update total estimated cost
    await db.update(mealPlansTable)
      .set({ total_estimated_cost: totalCost.toString() })
      .where(eq(mealPlansTable.id, mealPlan.id))
      .execute();

    // Step 7: Generate consolidated grocery list
    const groceryListQuery = await db.select({
      ingredient_id: ingredientsTable.id,
      ingredient_name: ingredientsTable.name,
      unit: ingredientsTable.unit,
      estimated_price_per_unit: ingredientsTable.estimated_price_per_unit,
      quantity: recipeIngredientsTable.quantity
    })
    .from(recipeIngredientsTable)
    .innerJoin(ingredientsTable, eq(recipeIngredientsTable.ingredient_id, ingredientsTable.id))
    .innerJoin(mealPlanRecipesTable, eq(recipeIngredientsTable.recipe_id, mealPlanRecipesTable.recipe_id))
    .where(eq(mealPlanRecipesTable.meal_plan_id, mealPlan.id))
    .execute();

    // Consolidate ingredients by summing quantities
    const ingredientMap = new Map<number, {
      ingredient_id: number;
      ingredient_name: string;
      unit: string;
      total_quantity: number;
      estimated_price_per_unit: number;
    }>();

    for (const item of groceryListQuery) {
      const ingredientId = item.ingredient_id;
      const quantity = parseFloat(item.quantity);
      
      if (ingredientMap.has(ingredientId)) {
        const existing = ingredientMap.get(ingredientId)!;
        existing.total_quantity += quantity;
      } else {
        ingredientMap.set(ingredientId, {
          ingredient_id: ingredientId,
          ingredient_name: item.ingredient_name,
          unit: item.unit,
          total_quantity: quantity,
          estimated_price_per_unit: parseFloat(item.estimated_price_per_unit)
        });
      }
    }

    const groceryList: GroceryListItem[] = Array.from(ingredientMap.values()).map(item => ({
      ingredient_id: item.ingredient_id,
      ingredient_name: item.ingredient_name,
      total_quantity: item.total_quantity,
      unit: item.unit,
      estimated_total_cost: item.total_quantity * item.estimated_price_per_unit
    }));

    // Step 8: Build response with assigned recipes
    const responseRecipes = assignedRecipes.map(assignment => {
      const recipe = availableRecipes.find(r => r.id === assignment.recipe_id)!;
      return {
        day_of_week: assignment.day_of_week,
        meal_type: assignment.meal_type,
        recipe: {
          ...recipe,
          estimated_cost: parseFloat(recipe.estimated_cost)
        }
      };
    });

    return {
      meal_plan: {
        ...mealPlan,
        weekly_budget: parseFloat(mealPlan.weekly_budget),
        total_estimated_cost: totalCost
      },
      recipes: responseRecipes,
      grocery_list: groceryList,
      total_estimated_cost: totalCost
    };

  } catch (error) {
    console.error('Meal plan creation failed:', error);
    throw error;
  }
}
