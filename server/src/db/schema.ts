
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const dietaryPreferenceEnum = pgEnum('dietary_preference', ['vegan', 'vegetarian']);
export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner']);

// Ingredients table
export const ingredientsTable = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  unit: text('unit').notNull(), // e.g., 'cups', 'grams', 'pieces'
  estimated_price_per_unit: numeric('estimated_price_per_unit', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Recipes table
export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable
  dietary_preference: dietaryPreferenceEnum('dietary_preference').notNull(),
  estimated_cost: numeric('estimated_cost', { precision: 10, scale: 2 }).notNull(),
  servings: integer('servings').notNull(),
  prep_time_minutes: integer('prep_time_minutes').notNull(),
  instructions: text('instructions').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Recipe ingredients junction table
export const recipeIngredientsTable = pgTable('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id),
  ingredient_id: integer('ingredient_id').notNull().references(() => ingredientsTable.id),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Meal plans table
export const mealPlansTable = pgTable('meal_plans', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  week_start_date: timestamp('week_start_date').notNull(),
  dietary_preference: dietaryPreferenceEnum('dietary_preference').notNull(),
  weekly_budget: numeric('weekly_budget', { precision: 10, scale: 2 }).notNull(),
  total_estimated_cost: numeric('total_estimated_cost', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Meal plan recipes junction table
export const mealPlanRecipesTable = pgTable('meal_plan_recipes', {
  id: serial('id').primaryKey(),
  meal_plan_id: integer('meal_plan_id').notNull().references(() => mealPlansTable.id),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id),
  day_of_week: integer('day_of_week').notNull(), // 0 = Sunday, 6 = Saturday
  meal_type: mealTypeEnum('meal_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const ingredientsRelations = relations(ingredientsTable, ({ many }) => ({
  recipeIngredients: many(recipeIngredientsTable),
}));

export const recipesRelations = relations(recipesTable, ({ many }) => ({
  recipeIngredients: many(recipeIngredientsTable),
  mealPlanRecipes: many(mealPlanRecipesTable),
}));

export const recipeIngredientsRelations = relations(recipeIngredientsTable, ({ one }) => ({
  recipe: one(recipesTable, {
    fields: [recipeIngredientsTable.recipe_id],
    references: [recipesTable.id],
  }),
  ingredient: one(ingredientsTable, {
    fields: [recipeIngredientsTable.ingredient_id],
    references: [ingredientsTable.id],
  }),
}));

export const mealPlansRelations = relations(mealPlansTable, ({ many }) => ({
  mealPlanRecipes: many(mealPlanRecipesTable),
}));

export const mealPlanRecipesRelations = relations(mealPlanRecipesTable, ({ one }) => ({
  mealPlan: one(mealPlansTable, {
    fields: [mealPlanRecipesTable.meal_plan_id],
    references: [mealPlansTable.id],
  }),
  recipe: one(recipesTable, {
    fields: [mealPlanRecipesTable.recipe_id],
    references: [recipesTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  ingredients: ingredientsTable,
  recipes: recipesTable,
  recipeIngredients: recipeIngredientsTable,
  mealPlans: mealPlansTable,
  mealPlanRecipes: mealPlanRecipesTable,
};
