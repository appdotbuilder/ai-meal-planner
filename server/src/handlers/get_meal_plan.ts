
import { db } from '../db';
import { mealPlansTable, mealPlanRecipesTable, recipesTable, recipeIngredientsTable, ingredientsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type MealPlanWithRecipes, type GroceryListItem } from '../schema';

export async function getMealPlan(mealPlanId: number): Promise<MealPlanWithRecipes | null> {
  try {
    // First, get the meal plan
    const mealPlanResults = await db.select()
      .from(mealPlansTable)
      .where(eq(mealPlansTable.id, mealPlanId))
      .execute();

    if (mealPlanResults.length === 0) {
      return null;
    }

    const mealPlanData = mealPlanResults[0];
    const mealPlan = {
      ...mealPlanData,
      weekly_budget: parseFloat(mealPlanData.weekly_budget),
      total_estimated_cost: parseFloat(mealPlanData.total_estimated_cost)
    };

    // Get meal plan recipes with recipe details
    const mealPlanRecipeResults = await db.select()
      .from(mealPlanRecipesTable)
      .innerJoin(recipesTable, eq(mealPlanRecipesTable.recipe_id, recipesTable.id))
      .where(eq(mealPlanRecipesTable.meal_plan_id, mealPlanId))
      .execute();

    const recipes = mealPlanRecipeResults.map(result => ({
      day_of_week: result.meal_plan_recipes.day_of_week,
      meal_type: result.meal_plan_recipes.meal_type,
      recipe: {
        ...result.recipes,
        estimated_cost: parseFloat(result.recipes.estimated_cost)
      }
    }));

    // Get all ingredients for the recipes in this meal plan
    const ingredientResults = await db.select({
      ingredient_id: ingredientsTable.id,
      ingredient_name: ingredientsTable.name,
      unit: ingredientsTable.unit,
      estimated_price_per_unit: ingredientsTable.estimated_price_per_unit,
      quantity: recipeIngredientsTable.quantity
    })
      .from(mealPlanRecipesTable)
      .innerJoin(recipeIngredientsTable, eq(mealPlanRecipesTable.recipe_id, recipeIngredientsTable.recipe_id))
      .innerJoin(ingredientsTable, eq(recipeIngredientsTable.ingredient_id, ingredientsTable.id))
      .where(eq(mealPlanRecipesTable.meal_plan_id, mealPlanId))
      .execute();

    // Consolidate ingredients into grocery list
    const ingredientMap = new Map<number, GroceryListItem>();

    for (const item of ingredientResults) {
      const ingredientId = item.ingredient_id;
      const quantity = parseFloat(item.quantity);
      const pricePerUnit = parseFloat(item.estimated_price_per_unit);

      if (ingredientMap.has(ingredientId)) {
        const existing = ingredientMap.get(ingredientId)!;
        existing.total_quantity += quantity;
        existing.estimated_total_cost = existing.total_quantity * pricePerUnit;
      } else {
        ingredientMap.set(ingredientId, {
          ingredient_id: ingredientId,
          ingredient_name: item.ingredient_name,
          total_quantity: quantity,
          unit: item.unit,
          estimated_total_cost: quantity * pricePerUnit
        });
      }
    }

    const grocery_list = Array.from(ingredientMap.values());

    // Calculate total estimated cost from grocery list
    const total_estimated_cost = grocery_list.reduce((sum, item) => sum + item.estimated_total_cost, 0);

    return {
      meal_plan: mealPlan,
      recipes,
      grocery_list,
      total_estimated_cost
    };
  } catch (error) {
    console.error('Failed to get meal plan:', error);
    throw error;
  }
}
