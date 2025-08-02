
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { MealPlanCreator } from './components/MealPlanCreator';
import { MealPlanViewer } from './components/MealPlanViewer';
import { RecipeManager } from './components/RecipeManager';
import { IngredientManager } from './components/IngredientManager';
// Using type-only imports for better TypeScript compliance
import type { 
  MealPlan, 
  MealPlanWithRecipes,
  Recipe,
  Ingredient 
} from '../../server/src/schema';

function App() {
  // State management with proper typing
  const [userMealPlans, setUserMealPlans] = useState<MealPlan[]>([]);
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlanWithRecipes | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentUser] = useState<string>('user-123'); // Simple user ID for demo
  const [isLoading, setIsLoading] = useState(false);

  // Load user's meal plans
  const loadUserMealPlans = useCallback(async () => {
    try {
      const result = await trpc.getUserMealPlans.query({ userId: currentUser });
      setUserMealPlans(result);
    } catch (error) {
      console.error('Failed to load meal plans:', error);
      // Using stub data since backend is not implemented yet
      console.log('Using stub data - backend handlers not implemented yet');
      setUserMealPlans([]);
    }
  }, [currentUser]);

  // Load available recipes
  const loadRecipes = useCallback(async () => {
    try {
      const result = await trpc.getRecipes.query({});
      setRecipes(result);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      // Using stub data since backend is not implemented yet
      console.log('Using stub data - backend handlers not implemented yet');
      setRecipes([]);
    }
  }, []);

  // Load available ingredients
  const loadIngredients = useCallback(async () => {
    try {
      const result = await trpc.getIngredients.query();
      setIngredients(result);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
      // Using stub data since backend is not implemented yet
      console.log('Using stub data - backend handlers not implemented yet');
      setIngredients([]);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadUserMealPlans();
    loadRecipes();
    loadIngredients();
  }, [loadUserMealPlans, loadRecipes, loadIngredients]);

  // Handle meal plan creation
  const handleMealPlanCreated = async (newMealPlan: MealPlanWithRecipes) => {
    setCurrentMealPlan(newMealPlan);
    // Refresh the user's meal plans list
    await loadUserMealPlans();
  };

  // Handle viewing a specific meal plan
  const handleViewMealPlan = async (mealPlanId: number) => {
    setIsLoading(true);
    try {
      const result = await trpc.getMealPlan.query({ mealPlanId });
      setCurrentMealPlan(result);
    } catch (error) {
      console.error('Failed to load meal plan:', error);
      // Using stub data since backend is not implemented yet
      console.log('Using stub data - backend handlers not implemented yet');
      setCurrentMealPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            🥬 AI Meal Planner & Grocery Assistant
          </h1>
          <p className="text-lg text-gray-600">
            Create weekly meal plans based on your dietary preferences and budget
          </p>
        </div>

        <Tabs defaultValue="planner" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="planner" className="text-sm">
              📅 Meal Planner
            </TabsTrigger>
            <TabsTrigger value="recipes" className="text-sm">
              🍳 Recipes
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="text-sm">
              🥕 Ingredients
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">
              📋 My Plans
            </TabsTrigger>
          </TabsList>

          {/* Meal Planner Tab */}
          <TabsContent value="planner" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Meal Plan Creator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ✨ Create New Meal Plan
                  </CardTitle>
                  <CardDescription>
                    Generate a personalized weekly meal plan based on your preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MealPlanCreator 
                    onMealPlanCreated={handleMealPlanCreated}
                    userId={currentUser}
                  />
                </CardContent>
              </Card>

              {/* Current Meal Plan Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🗓️ Your Meal Plan
                  </CardTitle>
                  <CardDescription>
                    View your current weekly meal plan and grocery list
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentMealPlan ? (
                    <MealPlanViewer mealPlan={currentMealPlan} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-2">No meal plan selected</p>
                      <p className="text-sm">Create a new meal plan to get started!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🍳 Recipe Manager
                </CardTitle>
                <CardDescription>
                  Manage your recipe collection for meal planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecipeManager 
                  recipes={recipes}
                  ingredients={ingredients}
                  onRecipeCreated={loadRecipes}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ingredients Tab */}
          <TabsContent value="ingredients">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🥕 Ingredient Manager
                </CardTitle>
                <CardDescription>
                  Manage available ingredients and their pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IngredientManager 
                  ingredients={ingredients}
                  onIngredientCreated={loadIngredients}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meal Plan History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 My Meal Plans
                </CardTitle>
                <CardDescription>
                  View and manage your previous meal plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userMealPlans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No meal plans yet</p>
                    <p className="text-sm">Create your first meal plan to see it here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userMealPlans.map((plan: MealPlan) => (
                      <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              Week of {plan.week_start_date.toLocaleDateString()}
                            </h3>
                            <p className="text-sm text-gray-600 capitalize">
                              {plan.dietary_preference} • Budget: ${plan.weekly_budget}
                            </p>
                            <p className="text-sm text-green-600">
                              Estimated Cost: ${plan.total_estimated_cost.toFixed(2)}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewMealPlan(plan.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Loading...' : 'View Plan'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
