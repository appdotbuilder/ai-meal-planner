
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createIngredientInputSchema,
  createRecipeInputSchema,
  createMealPlanInputSchema,
  dietaryPreferenceSchema
} from './schema';

// Import handlers
import { createIngredient } from './handlers/create_ingredient';
import { getIngredients } from './handlers/get_ingredients';
import { createRecipe } from './handlers/create_recipe';
import { getRecipes } from './handlers/get_recipes';
import { createMealPlan } from './handlers/create_meal_plan';
import { getMealPlan } from './handlers/get_meal_plan';
import { getUserMealPlans } from './handlers/get_user_meal_plans';
import { generateGroceryList } from './handlers/generate_grocery_list';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Ingredient management
  createIngredient: publicProcedure
    .input(createIngredientInputSchema)
    .mutation(({ input }) => createIngredient(input)),
  
  getIngredients: publicProcedure
    .query(() => getIngredients()),

  // Recipe management
  createRecipe: publicProcedure
    .input(createRecipeInputSchema)
    .mutation(({ input }) => createRecipe(input)),
  
  getRecipes: publicProcedure
    .input(z.object({ dietaryPreference: dietaryPreferenceSchema.optional() }))
    .query(({ input }) => getRecipes(input.dietaryPreference)),

  // Meal plan management
  createMealPlan: publicProcedure
    .input(createMealPlanInputSchema)
    .mutation(({ input }) => createMealPlan(input)),
  
  getMealPlan: publicProcedure
    .input(z.object({ mealPlanId: z.number() }))
    .query(({ input }) => getMealPlan(input.mealPlanId)),
  
  getUserMealPlans: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getUserMealPlans(input.userId)),

  // Grocery list generation
  generateGroceryList: publicProcedure
    .input(z.object({ mealPlanId: z.number() }))
    .query(({ input }) => generateGroceryList(input.mealPlanId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
