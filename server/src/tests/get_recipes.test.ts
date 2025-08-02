
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipesTable } from '../db/schema';
import { type DietaryPreference } from '../schema';
import { getRecipes } from '../handlers/get_recipes';

describe('getRecipes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no recipes exist', async () => {
    const result = await getRecipes();
    expect(result).toEqual([]);
  });

  it('should return all recipes when no dietary preference filter is provided', async () => {
    // Create test recipes
    await db.insert(recipesTable).values([
      {
        name: 'Vegan Pasta',
        description: 'Delicious vegan pasta',
        dietary_preference: 'vegan',
        estimated_cost: '12.50',
        servings: 4,
        prep_time_minutes: 30,
        instructions: 'Cook pasta, add sauce'
      },
      {
        name: 'Vegetarian Pizza',
        description: 'Cheese pizza with vegetables',
        dietary_preference: 'vegetarian',
        estimated_cost: '15.75',
        servings: 2,
        prep_time_minutes: 45,
        instructions: 'Make dough, add toppings, bake'
      }
    ]).execute();

    const result = await getRecipes();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Vegan Pasta');
    expect(result[0].dietary_preference).toEqual('vegan');
    expect(result[0].estimated_cost).toEqual(12.50);
    expect(typeof result[0].estimated_cost).toBe('number');
    expect(result[0].servings).toEqual(4);
    expect(result[0].prep_time_minutes).toEqual(30);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Vegetarian Pizza');
    expect(result[1].dietary_preference).toEqual('vegetarian');
    expect(result[1].estimated_cost).toEqual(15.75);
    expect(typeof result[1].estimated_cost).toBe('number');
  });

  it('should filter recipes by vegan dietary preference', async () => {
    // Create test recipes with different dietary preferences
    await db.insert(recipesTable).values([
      {
        name: 'Vegan Salad',
        description: 'Fresh vegan salad',
        dietary_preference: 'vegan',
        estimated_cost: '8.25',
        servings: 2,
        prep_time_minutes: 15,
        instructions: 'Chop vegetables, mix dressing'
      },
      {
        name: 'Vegetarian Sandwich',
        description: 'Grilled cheese sandwich',
        dietary_preference: 'vegetarian',
        estimated_cost: '6.50',
        servings: 1,
        prep_time_minutes: 10,
        instructions: 'Grill bread with cheese'
      }
    ]).execute();

    const result = await getRecipes('vegan');

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Vegan Salad');
    expect(result[0].dietary_preference).toEqual('vegan');
    expect(result[0].estimated_cost).toEqual(8.25);
    expect(typeof result[0].estimated_cost).toBe('number');
  });

  it('should filter recipes by vegetarian dietary preference', async () => {
    // Create test recipes
    await db.insert(recipesTable).values([
      {
        name: 'Vegan Smoothie',
        description: 'Fruit smoothie',
        dietary_preference: 'vegan',
        estimated_cost: '4.00',
        servings: 1,
        prep_time_minutes: 5,
        instructions: 'Blend fruits'
      },
      {
        name: 'Vegetarian Omelet',
        description: 'Cheese and veggie omelet',
        dietary_preference: 'vegetarian',
        estimated_cost: '7.25',
        servings: 1,
        prep_time_minutes: 12,
        instructions: 'Beat eggs, add filling, cook'
      }
    ]).execute();

    const result = await getRecipes('vegetarian');

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Vegetarian Omelet');
    expect(result[0].dietary_preference).toEqual('vegetarian');
    expect(result[0].estimated_cost).toEqual(7.25);
    expect(typeof result[0].estimated_cost).toBe('number');
  });

  it('should return empty array when no recipes match dietary preference', async () => {
    // Create only vegan recipes
    await db.insert(recipesTable).values([
      {
        name: 'Vegan Soup',
        description: 'Vegetable soup',
        dietary_preference: 'vegan',
        estimated_cost: '9.00',
        servings: 3,
        prep_time_minutes: 25,
        instructions: 'Simmer vegetables'
      }
    ]).execute();

    const result = await getRecipes('vegetarian');
    expect(result).toEqual([]);
  });

  it('should handle null description correctly', async () => {
    await db.insert(recipesTable).values([
      {
        name: 'Simple Recipe',
        description: null,
        dietary_preference: 'vegan',
        estimated_cost: '5.00',
        servings: 1,
        prep_time_minutes: 10,
        instructions: 'Very simple'
      }
    ]).execute();

    const result = await getRecipes();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe(null);
    expect(result[0].name).toEqual('Simple Recipe');
  });
});
