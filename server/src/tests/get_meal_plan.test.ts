
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mealPlansTable, recipesTable, ingredientsTable, recipeIngredientsTable, mealPlanRecipesTable } from '../db/schema';
import { getMealPlan } from '../handlers/get_meal_plan';
import type { CreateMealPlanInput, CreateRecipeInput, CreateIngredientInput } from '../schema';

describe('getMealPlan', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent meal plan', async () => {
    const result = await getMealPlan(999);
    expect(result).toBeNull();
  });

  it('should return complete meal plan with recipes and grocery list', async () => {
    // Create ingredients
    const ingredient1Data: CreateIngredientInput = {
      name: 'Tofu',
      unit: 'blocks',
      estimated_price_per_unit: 3.50
    };

    const ingredient2Data: CreateIngredientInput = {
      name: 'Rice',
      unit: 'cups',
      estimated_price_per_unit: 0.50
    };

    const [ingredient1] = await db.insert(ingredientsTable)
      .values({
        name: ingredient1Data.name,
        unit: ingredient1Data.unit,
        estimated_price_per_unit: ingredient1Data.estimated_price_per_unit.toString()
      })
      .returning()
      .execute();

    const [ingredient2] = await db.insert(ingredientsTable)
      .values({
        name: ingredient2Data.name,
        unit: ingredient2Data.unit,
        estimated_price_per_unit: ingredient2Data.estimated_price_per_unit.toString()
      })
      .returning()
      .execute();

    // Create recipe
    const recipeData: CreateRecipeInput = {
      name: 'Tofu Stir Fry',
      description: 'Delicious vegan stir fry',
      dietary_preference: 'vegan',
      estimated_cost: 8.00,
      servings: 4,
      prep_time_minutes: 30,
      instructions: 'Cook tofu and rice, mix together',
      ingredients: [
        { ingredient_id: ingredient1.id, quantity: 1 },
        { ingredient_id: ingredient2.id, quantity: 2 }
      ]
    };

    const [recipe] = await db.insert(recipesTable)
      .values({
        name: recipeData.name,
        description: recipeData.description,
        dietary_preference: recipeData.dietary_preference,
        estimated_cost: recipeData.estimated_cost.toString(),
        servings: recipeData.servings,
        prep_time_minutes: recipeData.prep_time_minutes,
        instructions: recipeData.instructions
      })
      .returning()
      .execute();

    // Create recipe ingredients
    await db.insert(recipeIngredientsTable)
      .values([
        {
          recipe_id: recipe.id,
          ingredient_id: ingredient1.id,
          quantity: '1'
        },
        {
          recipe_id: recipe.id,
          ingredient_id: ingredient2.id,
          quantity: '2'
        }
      ])
      .execute();

    // Create meal plan
    const mealPlanData: CreateMealPlanInput = {
      user_id: 'user123',
      week_start_date: new Date('2024-01-01'),
      dietary_preference: 'vegan',
      weekly_budget: 50.00
    };

    const [mealPlan] = await db.insert(mealPlansTable)
      .values({
        user_id: mealPlanData.user_id,
        week_start_date: mealPlanData.week_start_date,
        dietary_preference: mealPlanData.dietary_preference,
        weekly_budget: mealPlanData.weekly_budget.toString(),
        total_estimated_cost: '8.00'
      })
      .returning()
      .execute();

    // Add recipe to meal plan
    await db.insert(mealPlanRecipesTable)
      .values({
        meal_plan_id: mealPlan.id,
        recipe_id: recipe.id,
        day_of_week: 1, // Monday
        meal_type: 'dinner'
      })
      .execute();

    // Get the meal plan
    const result = await getMealPlan(mealPlan.id);

    expect(result).not.toBeNull();
    expect(result!.meal_plan.id).toEqual(mealPlan.id);
    expect(result!.meal_plan.user_id).toEqual('user123');
    expect(result!.meal_plan.dietary_preference).toEqual('vegan');
    expect(result!.meal_plan.weekly_budget).toEqual(50.00);
    expect(typeof result!.meal_plan.weekly_budget).toBe('number');

    // Check recipes
    expect(result!.recipes).toHaveLength(1);
    expect(result!.recipes[0].day_of_week).toEqual(1);
    expect(result!.recipes[0].meal_type).toEqual('dinner');
    expect(result!.recipes[0].recipe.name).toEqual('Tofu Stir Fry');
    expect(result!.recipes[0].recipe.estimated_cost).toEqual(8.00);
    expect(typeof result!.recipes[0].recipe.estimated_cost).toBe('number');

    // Check grocery list
    expect(result!.grocery_list).toHaveLength(2);
    
    const tofuItem = result!.grocery_list.find(item => item.ingredient_name === 'Tofu');
    expect(tofuItem).toBeDefined();
    expect(tofuItem!.total_quantity).toEqual(1);
    expect(tofuItem!.unit).toEqual('blocks');
    expect(tofuItem!.estimated_total_cost).toEqual(3.50);

    const riceItem = result!.grocery_list.find(item => item.ingredient_name === 'Rice');
    expect(riceItem).toBeDefined();
    expect(riceItem!.total_quantity).toEqual(2);
    expect(riceItem!.unit).toEqual('cups');
    expect(riceItem!.estimated_total_cost).toEqual(1.00);

    // Check total estimated cost
    expect(result!.total_estimated_cost).toEqual(4.50); // 3.50 + 1.00
  });

  it('should consolidate duplicate ingredients in grocery list', async () => {
    // Create ingredient
    const [ingredient] = await db.insert(ingredientsTable)
      .values({
        name: 'Rice',
        unit: 'cups',
        estimated_price_per_unit: '0.50'
      })
      .returning()
      .execute();

    // Create two recipes that use the same ingredient
    const [recipe1] = await db.insert(recipesTable)
      .values({
        name: 'Rice Bowl 1',
        dietary_preference: 'vegan',
        estimated_cost: '3.00',
        servings: 2,
        prep_time_minutes: 20,
        instructions: 'Cook rice'
      })
      .returning()
      .execute();

    const [recipe2] = await db.insert(recipesTable)
      .values({
        name: 'Rice Bowl 2',
        dietary_preference: 'vegan',
        estimated_cost: '4.00',
        servings: 2,
        prep_time_minutes: 25,
        instructions: 'Cook more rice'
      })
      .returning()
      .execute();

    // Add ingredients to both recipes
    await db.insert(recipeIngredientsTable)
      .values([
        {
          recipe_id: recipe1.id,
          ingredient_id: ingredient.id,
          quantity: '1.5'
        },
        {
          recipe_id: recipe2.id,
          ingredient_id: ingredient.id,
          quantity: '2.5'
        }
      ])
      .execute();

    // Create meal plan
    const [mealPlan] = await db.insert(mealPlansTable)
      .values({
        user_id: 'user123',
        week_start_date: new Date('2024-01-01'),
        dietary_preference: 'vegan',
        weekly_budget: '50.00',
        total_estimated_cost: '7.00'
      })
      .returning()
      .execute();

    // Add both recipes to meal plan
    await db.insert(mealPlanRecipesTable)
      .values([
        {
          meal_plan_id: mealPlan.id,
          recipe_id: recipe1.id,
          day_of_week: 1,
          meal_type: 'lunch'
        },
        {
          meal_plan_id: mealPlan.id,
          recipe_id: recipe2.id,
          day_of_week: 2,
          meal_type: 'dinner'
        }
      ])
      .execute();

    const result = await getMealPlan(mealPlan.id);

    expect(result).not.toBeNull();
    expect(result!.recipes).toHaveLength(2);
    
    // Should consolidate rice into single grocery list item
    expect(result!.grocery_list).toHaveLength(1);
    expect(result!.grocery_list[0].ingredient_name).toEqual('Rice');
    expect(result!.grocery_list[0].total_quantity).toEqual(4.0); // 1.5 + 2.5
    expect(result!.grocery_list[0].estimated_total_cost).toEqual(2.0); // 4.0 * 0.50
    expect(result!.total_estimated_cost).toEqual(2.0);
  });
});
