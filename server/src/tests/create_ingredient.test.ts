
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ingredientsTable } from '../db/schema';
import { type CreateIngredientInput } from '../schema';
import { createIngredient } from '../handlers/create_ingredient';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateIngredientInput = {
  name: 'Organic Tomatoes',
  unit: 'pounds',
  estimated_price_per_unit: 3.49
};

describe('createIngredient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an ingredient', async () => {
    const result = await createIngredient(testInput);

    // Basic field validation
    expect(result.name).toEqual('Organic Tomatoes');
    expect(result.unit).toEqual('pounds');
    expect(result.estimated_price_per_unit).toEqual(3.49);
    expect(typeof result.estimated_price_per_unit).toEqual('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save ingredient to database', async () => {
    const result = await createIngredient(testInput);

    // Query using proper drizzle syntax
    const ingredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.id, result.id))
      .execute();

    expect(ingredients).toHaveLength(1);
    expect(ingredients[0].name).toEqual('Organic Tomatoes');
    expect(ingredients[0].unit).toEqual('pounds');
    expect(parseFloat(ingredients[0].estimated_price_per_unit)).toEqual(3.49);
    expect(ingredients[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different ingredient units correctly', async () => {
    const gramInput: CreateIngredientInput = {
      name: 'Brown Rice',
      unit: 'grams',
      estimated_price_per_unit: 0.05
    };

    const result = await createIngredient(gramInput);

    expect(result.name).toEqual('Brown Rice');
    expect(result.unit).toEqual('grams');
    expect(result.estimated_price_per_unit).toEqual(0.05);
    expect(typeof result.estimated_price_per_unit).toEqual('number');
  });

  it('should handle high precision prices correctly', async () => {
    const precisionInput: CreateIngredientInput = {
      name: 'Saffron',
      unit: 'grams',
      estimated_price_per_unit: 12.99
    };

    const result = await createIngredient(precisionInput);

    expect(result.estimated_price_per_unit).toEqual(12.99);
    expect(typeof result.estimated_price_per_unit).toEqual('number');

    // Verify database storage and retrieval
    const ingredients = await db.select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.id, result.id))
      .execute();

    expect(parseFloat(ingredients[0].estimated_price_per_unit)).toEqual(12.99);
  });
});
