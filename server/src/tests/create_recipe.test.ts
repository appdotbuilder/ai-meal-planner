
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable, recipeIngredientsTable, ingredientsTable } from '../db/schema';
import { type CreateRecipeInput } from '../schema';
import { createRecipe } from '../handlers/create_recipe';
import { eq } from 'drizzle-orm';

describe('createRecipe', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let ingredientId1: number;
  let ingredientId2: number;

  beforeEach(async () => {
    // Create test ingredients
    const ingredient1Result = await db.insert(ingredientsTable)
      .values({
        name: 'Test Ingredient 1',
        unit: 'cups',
        estimated_price_per_unit: '2.50'
      })
      .returning()
      .execute();

    const ingredient2Result = await db.insert(ingredientsTable)
      .values({
        name: 'Test Ingredient 2',
        unit: 'grams',
        estimated_price_per_unit: '0.05'
      })
      .returning()
      .execute();

    ingredientId1 = ingredient1Result[0].id;
    ingredientId2 = ingredient2Result[0].id;
  });

  const testInput: CreateRecipeInput = {
    name: 'Test Recipe',
    description: 'A delicious test recipe',
    dietary_preference: 'vegan',
    estimated_cost: 15.99,
    servings: 4,
    prep_time_minutes: 30,
    instructions: 'Mix ingredients and cook for 20 minutes',
    ingredients: []
  };

  it('should create a recipe without ingredients', async () => {
    const result = await createRecipe(testInput);

    expect(result.name).toEqual('Test Recipe');
    expect(result.description).toEqual('A delicious test recipe');
    expect(result.dietary_preference).toEqual('vegan');
    expect(result.estimated_cost).toEqual(15.99);
    expect(typeof result.estimated_cost).toEqual('number');
    expect(result.servings).toEqual(4);
    expect(result.prep_time_minutes).toEqual(30);
    expect(result.instructions).toEqual('Mix ingredients and cook for 20 minutes');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a recipe with ingredients', async () => {
    const inputWithIngredients = {
      ...testInput,
      ingredients: [
        { ingredient_id: ingredientId1, quantity: 2.5 },
        { ingredient_id: ingredientId2, quantity: 100 }
      ]
    };

    const result = await createRecipe(inputWithIngredients);

    expect(result.name).toEqual('Test Recipe');
    expect(result.id).toBeDefined();

    // Verify recipe ingredients were created
    const recipeIngredients = await db.select()
      .from(recipeIngredientsTable)
      .where(eq(recipeIngredientsTable.recipe_id, result.id))
      .execute();

    expect(recipeIngredients).toHaveLength(2);
    expect(recipeIngredients[0].ingredient_id).toEqual(ingredientId1);
    expect(parseFloat(recipeIngredients[0].quantity)).toEqual(2.5);
    expect(recipeIngredients[1].ingredient_id).toEqual(ingredientId2);
    expect(parseFloat(recipeIngredients[1].quantity)).toEqual(100);
  });

  it('should save recipe to database', async () => {
    const result = await createRecipe(testInput);

    const recipes = await db.select()
      .from(recipesTable)
      .where(eq(recipesTable.id, result.id))
      .execute();

    expect(recipes).toHaveLength(1);
    expect(recipes[0].name).toEqual('Test Recipe');
    expect(recipes[0].description).toEqual('A delicious test recipe');
    expect(recipes[0].dietary_preference).toEqual('vegan');
    expect(parseFloat(recipes[0].estimated_cost)).toEqual(15.99);
    expect(recipes[0].servings).toEqual(4);
    expect(recipes[0].prep_time_minutes).toEqual(30);
    expect(recipes[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    const inputWithNullDescription = {
      ...testInput,
      description: null
    };

    const result = await createRecipe(inputWithNullDescription);

    expect(result.description).toBeNull();
  });

  it('should throw error for non-existent ingredient', async () => {
    const inputWithBadIngredient = {
      ...testInput,
      ingredients: [
        { ingredient_id: 99999, quantity: 1.0 }
      ]
    };

    expect(createRecipe(inputWithBadIngredient)).rejects.toThrow(/ingredient with id 99999 does not exist/i);
  });

  it('should create vegetarian recipe', async () => {
    const vegetarianInput = {
      ...testInput,
      dietary_preference: 'vegetarian' as const
    };

    const result = await createRecipe(vegetarianInput);

    expect(result.dietary_preference).toEqual('vegetarian');
  });
});
