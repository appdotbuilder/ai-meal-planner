
import { db } from '../db';
import { recipesTable, recipeIngredientsTable, ingredientsTable } from '../db/schema';
import { type CreateRecipeInput, type Recipe } from '../schema';
import { eq } from 'drizzle-orm';

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  try {
    // First, verify all ingredient IDs exist
    const ingredientIds = input.ingredients.map(ing => ing.ingredient_id);
    const existingIngredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.id, ingredientIds[0])) // Start with first ID
      .execute();

    // Check all ingredients exist
    for (const ingredientId of ingredientIds) {
      const ingredient = await db.select()
        .from(ingredientsTable)
        .where(eq(ingredientsTable.id, ingredientId))
        .execute();
      
      if (ingredient.length === 0) {
        throw new Error(`Ingredient with ID ${ingredientId} does not exist`);
      }
    }

    // Create the recipe record
    const recipeResult = await db.insert(recipesTable)
      .values({
        name: input.name,
        description: input.description || null,
        dietary_preference: input.dietary_preference,
        estimated_cost: input.estimated_cost.toString(),
        servings: input.servings,
        prep_time_minutes: input.prep_time_minutes,
        instructions: input.instructions
      })
      .returning()
      .execute();

    const recipe = recipeResult[0];

    // Create recipe ingredient relationships
    if (input.ingredients.length > 0) {
      await db.insert(recipeIngredientsTable)
        .values(
          input.ingredients.map(ingredient => ({
            recipe_id: recipe.id,
            ingredient_id: ingredient.ingredient_id,
            quantity: ingredient.quantity.toString()
          }))
        )
        .execute();
    }

    // Return recipe with proper numeric conversion
    return {
      ...recipe,
      estimated_cost: parseFloat(recipe.estimated_cost)
    };
  } catch (error) {
    console.error('Recipe creation failed:', error);
    throw error;
  }
}
