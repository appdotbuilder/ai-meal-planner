
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type Recipe, type DietaryPreference } from '../schema';
import { eq } from 'drizzle-orm';

export async function getRecipes(dietaryPreference?: DietaryPreference): Promise<Recipe[]> {
  try {
    // Build query conditionally without reassigning
    const results = dietaryPreference 
      ? await db.select().from(recipesTable).where(eq(recipesTable.dietary_preference, dietaryPreference)).execute()
      : await db.select().from(recipesTable).execute();

    // Convert numeric fields back to numbers
    return results.map(recipe => ({
      ...recipe,
      estimated_cost: parseFloat(recipe.estimated_cost)
    }));
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    throw error;
  }
}
