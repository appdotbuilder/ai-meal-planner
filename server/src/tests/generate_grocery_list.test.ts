
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ingredientsTable, recipesTable, recipeIngredientsTable, mealPlansTable, mealPlanRecipesTable } from '../db/schema';
import { generateGroceryList } from '../handlers/generate_grocery_list';

describe('generateGroceryList', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate consolidated grocery list for meal plan', async () => {
    // Create test ingredients
    const ingredientResults = await db.insert(ingredientsTable).values([
      {
        name: 'Flour',
        unit: 'cups',
        estimated_price_per_unit: '2.50'
      },
      {
        name: 'Sugar',
        unit: 'cups',
        estimated_price_per_unit: '1.75'
      },
      {
        name: 'Eggs',
        unit: 'pieces',
        estimated_price_per_unit: '0.25'
      }
    ]).returning().execute();

    // Create test recipes
    const recipeResults = await db.insert(recipesTable).values([
      {
        name: 'Pancakes',
        description: 'Fluffy pancakes',
        dietary_preference: 'vegetarian',
        estimated_cost: '5.00',
        servings: 4,
        prep_time_minutes: 20,
        instructions: 'Mix and cook'
      },
      {
        name: 'Cookies',
        description: 'Sweet cookies',
        dietary_preference: 'vegetarian',
        estimated_cost: '3.00',
        servings: 12,
        prep_time_minutes: 30,
        instructions: 'Bake until golden'
      }
    ]).returning().execute();

    // Create recipe ingredients - some ingredients used in multiple recipes
    await db.insert(recipeIngredientsTable).values([
      // Pancakes recipe
      {
        recipe_id: recipeResults[0].id,
        ingredient_id: ingredientResults[0].id, // Flour
        quantity: '2.000' // 2 cups
      },
      {
        recipe_id: recipeResults[0].id,
        ingredient_id: ingredientResults[1].id, // Sugar
        quantity: '0.250' // 0.25 cups
      },
      {
        recipe_id: recipeResults[0].id,
        ingredient_id: ingredientResults[2].id, // Eggs
        quantity: '2.000' // 2 eggs
      },
      // Cookies recipe
      {
        recipe_id: recipeResults[1].id,
        ingredient_id: ingredientResults[0].id, // Flour (shared ingredient)
        quantity: '1.500' // 1.5 cups
      },
      {
        recipe_id: recipeResults[1].id,
        ingredient_id: ingredientResults[1].id, // Sugar (shared ingredient)
        quantity: '0.750' // 0.75 cups
      }
    ]).execute();

    // Create meal plan
    const mealPlanResults = await db.insert(mealPlansTable).values({
      user_id: 'user123',
      week_start_date: new Date('2024-01-01'),
      dietary_preference: 'vegetarian',
      weekly_budget: '50.00',
      total_estimated_cost: '8.00'
    }).returning().execute();

    // Add recipes to meal plan
    await db.insert(mealPlanRecipesTable).values([
      {
        meal_plan_id: mealPlanResults[0].id,
        recipe_id: recipeResults[0].id, // Pancakes
        day_of_week: 0, // Sunday
        meal_type: 'breakfast'
      },
      {
        meal_plan_id: mealPlanResults[0].id,
        recipe_id: recipeResults[1].id, // Cookies
        day_of_week: 1, // Monday
        meal_type: 'breakfast'
      }
    ]).execute();

    // Generate grocery list
    const groceryList = await generateGroceryList(mealPlanResults[0].id);

    // Should have 3 consolidated ingredients
    expect(groceryList).toHaveLength(3);

    // Find each ingredient in the list
    const flour = groceryList.find(item => item.ingredient_name === 'Flour');
    const sugar = groceryList.find(item => item.ingredient_name === 'Sugar');
    const eggs = groceryList.find(item => item.ingredient_name === 'Eggs');

    // Verify flour aggregation (2 + 1.5 = 3.5 cups)
    expect(flour).toBeDefined();
    expect(flour!.ingredient_id).toBe(ingredientResults[0].id);
    expect(flour!.total_quantity).toBe(3.5);
    expect(flour!.unit).toBe('cups');
    expect(flour!.estimated_total_cost).toBe(8.75); // 3.5 * 2.50

    // Verify sugar aggregation (0.25 + 0.75 = 1.0 cups)
    expect(sugar).toBeDefined();
    expect(sugar!.ingredient_id).toBe(ingredientResults[1].id);
    expect(sugar!.total_quantity).toBe(1.0);
    expect(sugar!.unit).toBe('cups');
    expect(sugar!.estimated_total_cost).toBe(1.75); // 1.0 * 1.75

    // Verify eggs (only in pancakes recipe)
    expect(eggs).toBeDefined();
    expect(eggs!.ingredient_id).toBe(ingredientResults[2].id);
    expect(eggs!.total_quantity).toBe(2.0);
    expect(eggs!.unit).toBe('pieces');
    expect(eggs!.estimated_total_cost).toBe(0.5); // 2.0 * 0.25
  });

  it('should return empty list for meal plan with no recipes', async () => {
    // Create meal plan with no recipes
    const mealPlanResults = await db.insert(mealPlansTable).values({
      user_id: 'user123',
      week_start_date: new Date('2024-01-01'),
      dietary_preference: 'vegan',
      weekly_budget: '30.00',
      total_estimated_cost: '0.00'
    }).returning().execute();

    const groceryList = await generateGroceryList(mealPlanResults[0].id);

    expect(groceryList).toHaveLength(0);
  });

  it('should handle meal plan with single recipe', async () => {
    // Create test ingredient
    const ingredientResults = await db.insert(ingredientsTable).values({
      name: 'Oats',
      unit: 'cups',
      estimated_price_per_unit: '1.20'
    }).returning().execute();

    // Create test recipe
    const recipeResults = await db.insert(recipesTable).values({
      name: 'Oatmeal',
      description: 'Simple oatmeal',
      dietary_preference: 'vegan',
      estimated_cost: '2.40',
      servings: 2,
      prep_time_minutes: 10,
      instructions: 'Cook oats with water'
    }).returning().execute();

    // Create recipe ingredient
    await db.insert(recipeIngredientsTable).values({
      recipe_id: recipeResults[0].id,
      ingredient_id: ingredientResults[0].id,
      quantity: '2.000' // 2 cups
    }).execute();

    // Create meal plan
    const mealPlanResults = await db.insert(mealPlansTable).values({
      user_id: 'user456',
      week_start_date: new Date('2024-01-08'),
      dietary_preference: 'vegan',
      weekly_budget: '25.00',
      total_estimated_cost: '2.40'
    }).returning().execute();

    // Add recipe to meal plan
    await db.insert(mealPlanRecipesTable).values({
      meal_plan_id: mealPlanResults[0].id,
      recipe_id: recipeResults[0].id,
      day_of_week: 2, // Tuesday
      meal_type: 'breakfast'
    }).execute();

    const groceryList = await generateGroceryList(mealPlanResults[0].id);

    expect(groceryList).toHaveLength(1);
    expect(groceryList[0].ingredient_name).toBe('Oats');
    expect(groceryList[0].total_quantity).toBe(2.0);
    expect(groceryList[0].unit).toBe('cups');
    expect(groceryList[0].estimated_total_cost).toBe(2.4); // 2.0 * 1.20
  });
});
