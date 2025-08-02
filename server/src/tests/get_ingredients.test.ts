
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ingredientsTable } from '../db/schema';
import { getIngredients } from '../handlers/get_ingredients';

describe('getIngredients', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no ingredients exist', async () => {
    const result = await getIngredients();
    expect(result).toEqual([]);
  });

  it('should return all ingredients', async () => {
    // Create test ingredients
    await db.insert(ingredientsTable)
      .values([
        {
          name: 'Tomatoes',
          unit: 'pieces',
          estimated_price_per_unit: '1.50'
        },
        {
          name: 'Rice',
          unit: 'cups',
          estimated_price_per_unit: '2.25'
        },
        {
          name: 'Olive Oil',
          unit: 'tablespoons',
          estimated_price_per_unit: '0.75'
        }
      ])
      .execute();

    const result = await getIngredients();

    expect(result).toHaveLength(3);
    
    // Check first ingredient
    const tomatoes = result.find(i => i.name === 'Tomatoes');
    expect(tomatoes).toBeDefined();
    expect(tomatoes!.unit).toBe('pieces');
    expect(tomatoes!.estimated_price_per_unit).toBe(1.50);
    expect(typeof tomatoes!.estimated_price_per_unit).toBe('number');
    expect(tomatoes!.id).toBeDefined();
    expect(tomatoes!.created_at).toBeInstanceOf(Date);

    // Check second ingredient
    const rice = result.find(i => i.name === 'Rice');
    expect(rice).toBeDefined();
    expect(rice!.unit).toBe('cups');
    expect(rice!.estimated_price_per_unit).toBe(2.25);
    expect(typeof rice!.estimated_price_per_unit).toBe('number');

    // Check third ingredient
    const oil = result.find(i => i.name === 'Olive Oil');
    expect(oil).toBeDefined();
    expect(oil!.unit).toBe('tablespoons');
    expect(oil!.estimated_price_per_unit).toBe(0.75);
    expect(typeof oil!.estimated_price_per_unit).toBe('number');
  });

  it('should handle ingredients with decimal prices correctly', async () => {
    await db.insert(ingredientsTable)
      .values({
        name: 'Premium Spice',
        unit: 'grams',
        estimated_price_per_unit: '12.99'
      })
      .execute();

    const result = await getIngredients();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Premium Spice');
    expect(result[0].estimated_price_per_unit).toBe(12.99);
    expect(typeof result[0].estimated_price_per_unit).toBe('number');
  });
});
