
import { db } from '../db';
import { ingredientsTable } from '../db/schema';
import { type CreateIngredientInput, type Ingredient } from '../schema';

export const createIngredient = async (input: CreateIngredientInput): Promise<Ingredient> => {
  try {
    // Insert ingredient record
    const result = await db.insert(ingredientsTable)
      .values({
        name: input.name,
        unit: input.unit,
        estimated_price_per_unit: input.estimated_price_per_unit.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const ingredient = result[0];
    return {
      ...ingredient,
      estimated_price_per_unit: parseFloat(ingredient.estimated_price_per_unit) // Convert string back to number
    };
  } catch (error) {
    console.error('Ingredient creation failed:', error);
    throw error;
  }
};
