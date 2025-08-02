
import { db } from '../db';
import { ingredientsTable } from '../db/schema';
import { type Ingredient } from '../schema';

export async function getIngredients(): Promise<Ingredient[]> {
  try {
    const results = await db.select()
      .from(ingredientsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(ingredient => ({
      ...ingredient,
      estimated_price_per_unit: parseFloat(ingredient.estimated_price_per_unit)
    }));
  } catch (error) {
    console.error('Failed to fetch ingredients:', error);
    throw error;
  }
}
