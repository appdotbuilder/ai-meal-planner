
import { z } from 'zod';

// Dietary preference enum
export const dietaryPreferenceSchema = z.enum(['vegan', 'vegetarian']);
export type DietaryPreference = z.infer<typeof dietaryPreferenceSchema>;

// Recipe schema
export const recipeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  dietary_preference: dietaryPreferenceSchema,
  estimated_cost: z.number(),
  servings: z.number().int(),
  prep_time_minutes: z.number().int(),
  instructions: z.string(),
  created_at: z.coerce.date()
});

export type Recipe = z.infer<typeof recipeSchema>;

// Ingredient schema
export const ingredientSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string(), // e.g., 'cups', 'grams', 'pieces'
  estimated_price_per_unit: z.number(),
  created_at: z.coerce.date()
});

export type Ingredient = z.infer<typeof ingredientSchema>;

// Recipe ingredient relationship schema
export const recipeIngredientSchema = z.object({
  id: z.number(),
  recipe_id: z.number(),
  ingredient_id: z.number(),
  quantity: z.number(),
  created_at: z.coerce.date()
});

export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

// Meal plan schema
export const mealPlanSchema = z.object({
  id: z.number(),
  user_id: z.string(), // Simple string ID for users
  week_start_date: z.coerce.date(),
  dietary_preference: dietaryPreferenceSchema,
  weekly_budget: z.number(),
  total_estimated_cost: z.number(),
  created_at: z.coerce.date()
});

export type MealPlan = z.infer<typeof mealPlanSchema>;

// Meal plan recipe relationship schema
export const mealPlanRecipeSchema = z.object({
  id: z.number(),
  meal_plan_id: z.number(),
  recipe_id: z.number(),
  day_of_week: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  meal_type: z.enum(['breakfast', 'lunch', 'dinner']),
  created_at: z.coerce.date()
});

export type MealPlanRecipe = z.infer<typeof mealPlanRecipeSchema>;

// Input schemas for creating meal plans
export const createMealPlanInputSchema = z.object({
  user_id: z.string(),
  week_start_date: z.coerce.date(),
  dietary_preference: dietaryPreferenceSchema,
  weekly_budget: z.number().positive()
});

export type CreateMealPlanInput = z.infer<typeof createMealPlanInputSchema>;

// Input schema for creating recipes
export const createRecipeInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  dietary_preference: dietaryPreferenceSchema,
  estimated_cost: z.number().positive(),
  servings: z.number().int().positive(),
  prep_time_minutes: z.number().int().positive(),
  instructions: z.string(),
  ingredients: z.array(z.object({
    ingredient_id: z.number(),
    quantity: z.number().positive()
  }))
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Input schema for creating ingredients
export const createIngredientInputSchema = z.object({
  name: z.string(),
  unit: z.string(),
  estimated_price_per_unit: z.number().positive()
});

export type CreateIngredientInput = z.infer<typeof createIngredientInputSchema>;

// Grocery list item schema for consolidated shopping list
export const groceryListItemSchema = z.object({
  ingredient_id: z.number(),
  ingredient_name: z.string(),
  total_quantity: z.number(),
  unit: z.string(),
  estimated_total_cost: z.number()
});

export type GroceryListItem = z.infer<typeof groceryListItemSchema>;

// Complete meal plan with recipes response schema
export const mealPlanWithRecipesSchema = z.object({
  meal_plan: mealPlanSchema,
  recipes: z.array(z.object({
    day_of_week: z.number().int(),
    meal_type: z.enum(['breakfast', 'lunch', 'dinner']),
    recipe: recipeSchema
  })),
  grocery_list: z.array(groceryListItemSchema),
  total_estimated_cost: z.number()
});

export type MealPlanWithRecipes = z.infer<typeof mealPlanWithRecipesSchema>;
