
import { db } from '../db';
import { mealPlanRecipesTable, recipeIngredientsTable, ingredientsTable, recipesTable } from '../db/schema';
import { type GroceryListItem } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function generateGroceryList(mealPlanId: number): Promise<GroceryListItem[]> {
  try {
    // Query to get all ingredients for recipes in the meal plan, aggregated by ingredient
    const results = await db
      .select({
        ingredient_id: ingredientsTable.id,
        ingredient_name: ingredientsTable.name,
        unit: ingredientsTable.unit,
        estimated_price_per_unit: ingredientsTable.estimated_price_per_unit,
        total_quantity: sql<string>`sum(${recipeIngredientsTable.quantity})`.as('total_quantity'),
      })
      .from(mealPlanRecipesTable)
      .innerJoin(recipesTable, eq(mealPlanRecipesTable.recipe_id, recipesTable.id))
      .innerJoin(recipeIngredientsTable, eq(recipesTable.id, recipeIngredientsTable.recipe_id))
      .innerJoin(ingredientsTable, eq(recipeIngredientsTable.ingredient_id, ingredientsTable.id))
      .where(eq(mealPlanRecipesTable.meal_plan_id, mealPlanId))
      .groupBy(
        ingredientsTable.id,
        ingredientsTable.name,
        ingredientsTable.unit,
        ingredientsTable.estimated_price_per_unit
      )
      .execute();

    // Transform results to GroceryListItem format with proper numeric conversions
    return results.map(result => {
      const totalQuantity = parseFloat(result.total_quantity);
      const pricePerUnit = parseFloat(result.estimated_price_per_unit);
      
      return {
        ingredient_id: result.ingredient_id,
        ingredient_name: result.ingredient_name,
        total_quantity: totalQuantity,
        unit: result.unit,
        estimated_total_cost: totalQuantity * pricePerUnit
      };
    });
  } catch (error) {
    console.error('Grocery list generation failed:', error);
    throw error;
  }
}
