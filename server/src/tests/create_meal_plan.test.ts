
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  mealPlansTable, 
  mealPlanRecipesTable, 
  recipesTable, 
  ingredientsTable, 
  recipeIngredientsTable 
} from '../db/schema';
import { type CreateMealPlanInput } from '../schema';
import { createMealPlan } from '../handlers/create_meal_plan';
import { eq } from 'drizzle-orm';

describe('createMealPlan', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test ingredients
  const createTestIngredients = async () => {
    const ingredientResults = await db.insert(ingredientsTable)
      .values([
        { name: 'Rice', unit: 'cups', estimated_price_per_unit: '2.50' },
        { name: 'Beans', unit: 'cups', estimated_price_per_unit: '3.00' },
        { name: 'Vegetables', unit: 'cups', estimated_price_per_unit: '4.00' }
      ])
      .returning()
      .execute();
    
    return ingredientResults;
  };

  // Helper function to create test recipes
  const createTestRecipes = async (ingredients: any[]) => {
    const recipeResults = await db.insert(recipesTable)
      .values([
        {
          name: 'Vegan Rice Bowl',
          description: 'Simple rice and beans',
          dietary_preference: 'vegan',
          estimated_cost: '5.00',
          servings: 2,
          prep_time_minutes: 30,
          instructions: 'Cook rice and beans, mix together'
        },
        {
          name: 'Vegetable Stir Fry',
          description: 'Mixed vegetables with rice',
          dietary_preference: 'vegan',
          estimated_cost: '7.00',
          servings: 2,
          prep_time_minutes: 25,
          instructions: 'Stir fry vegetables, serve with rice'
        }
      ])
      .returning()
      .execute();

    // Create recipe ingredients relationships
    await db.insert(recipeIngredientsTable)
      .values([
        { recipe_id: recipeResults[0].id, ingredient_id: ingredients[0].id, quantity: '1.0' },
        { recipe_id: recipeResults[0].id, ingredient_id: ingredients[1].id, quantity: '0.5' },
        { recipe_id: recipeResults[1].id, ingredient_id: ingredients[0].id, quantity: '1.0' },
        { recipe_id: recipeResults[1].id, ingredient_id: ingredients[2].id, quantity: '2.0' }
      ])
      .execute();

    return recipeResults;
  };

  const testInput: CreateMealPlanInput = {
    user_id: 'test-user-123',
    week_start_date: new Date('2024-01-01'),
    dietary_preference: 'vegan',
    weekly_budget: 150.00
  };

  it('should create a meal plan with recipes and grocery list', async () => {
    // Setup test data
    const ingredients = await createTestIngredients();
    const recipes = await createTestRecipes(ingredients);

    const result = await createMealPlan(testInput);

    // Verify meal plan structure
    expect(result.meal_plan.user_id).toEqual('test-user-123');
    expect(result.meal_plan.dietary_preference).toEqual('vegan');
    expect(result.meal_plan.weekly_budget).toEqual(150.00);
    expect(result.meal_plan.id).toBeDefined();
    expect(result.meal_plan.created_at).toBeInstanceOf(Date);

    // Verify 21 recipes assigned (7 days × 3 meals)
    expect(result.recipes).toHaveLength(21);

    // Verify grocery list is generated
    expect(result.grocery_list.length).toBeGreaterThan(0);
    expect(result.total_estimated_cost).toBeGreaterThan(0);

    // Verify all days and meal types are covered
    const daysCovered = new Set(result.recipes.map(r => r.day_of_week));
    const mealTypesCovered = new Set(result.recipes.map(r => r.meal_type));
    expect(daysCovered.size).toEqual(7); // All 7 days
    expect(mealTypesCovered.size).toEqual(3); // All 3 meal types
  });

  it('should save meal plan to database', async () => {
    const ingredients = await createTestIngredients();
    const recipes = await createTestRecipes(ingredients);

    const result = await createMealPlan(testInput);

    // Verify meal plan is saved
    const savedMealPlans = await db.select()
      .from(mealPlansTable)
      .where(eq(mealPlansTable.id, result.meal_plan.id))
      .execute();

    expect(savedMealPlans).toHaveLength(1);
    expect(savedMealPlans[0].user_id).toEqual('test-user-123');
    expect(parseFloat(savedMealPlans[0].weekly_budget)).toEqual(150.00);

    // Verify meal plan recipes are saved
    const savedRecipes = await db.select()
      .from(mealPlanRecipesTable)
      .where(eq(mealPlanRecipesTable.meal_plan_id, result.meal_plan.id))
      .execute();

    expect(savedRecipes).toHaveLength(21);
  });

  it('should consolidate grocery list correctly', async () => {
    const ingredients = await createTestIngredients();
    const recipes = await createTestRecipes(ingredients);

    const result = await createMealPlan(testInput);

    // Verify grocery list structure
    result.grocery_list.forEach(item => {
      expect(item.ingredient_id).toBeDefined();
      expect(item.ingredient_name).toBeDefined();
      expect(item.total_quantity).toBeGreaterThan(0);
      expect(item.unit).toBeDefined();
      expect(item.estimated_total_cost).toBeGreaterThan(0);
      expect(typeof item.estimated_total_cost).toEqual('number');
    });

    // Verify that ingredients are consolidated (not duplicated per recipe)
    const ingredientIds = result.grocery_list.map(item => item.ingredient_id);
    const uniqueIngredientIds = new Set(ingredientIds);
    expect(ingredientIds.length).toEqual(uniqueIngredientIds.size);
  });

  it('should throw error when no recipes match dietary preference', async () => {
    // Create recipes with different dietary preference
    const ingredients = await createTestIngredients();
    await db.insert(recipesTable)
      .values([{
        name: 'Vegetarian Pasta',
        description: 'Pasta with cheese',
        dietary_preference: 'vegetarian',
        estimated_cost: '8.00',
        servings: 2,
        prep_time_minutes: 20,
        instructions: 'Cook pasta, add cheese'
      }])
      .execute();

    const veganInput: CreateMealPlanInput = {
      ...testInput,
      dietary_preference: 'vegan'
    };

    await expect(createMealPlan(veganInput)).rejects.toThrow(/no recipes found for dietary preference/i);
  });

  it('should handle budget constraints', async () => {
    const ingredients = await createTestIngredients();
    
    // Create expensive recipes
    await db.insert(recipesTable)
      .values([{
        name: 'Expensive Vegan Dish',
        description: 'Very costly ingredients',
        dietary_preference: 'vegan',
        estimated_cost: '50.00',
        servings: 1,
        prep_time_minutes: 60,
        instructions: 'Prepare expensive dish'
      }])
      .execute();

    const lowBudgetInput: CreateMealPlanInput = {
      ...testInput,
      weekly_budget: 10.00 // Very low budget
    };

    await expect(createMealPlan(lowBudgetInput)).rejects.toThrow(/no recipes found within budget constraints/i);
  });
});
