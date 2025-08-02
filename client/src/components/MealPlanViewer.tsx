
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MealPlanWithRecipes, Recipe } from '../../../server/src/schema';

interface MealPlanViewerProps {
  mealPlan: MealPlanWithRecipes;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

export function MealPlanViewer({ mealPlan }: MealPlanViewerProps) {
  const { meal_plan, recipes, grocery_list, total_estimated_cost } = mealPlan;

  // Group recipes by day and meal type
  const recipesByDay = recipes.reduce((acc, item) => {
    const key = `${item.day_of_week}-${item.meal_type}`;
    acc[key] = item.recipe;
    return acc;
  }, {} as Record<string, Recipe>);

  return (
    <div className="space-y-6">
      {/* Meal Plan Overview */}
      <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">
          Week of {meal_plan.week_start_date.toLocaleDateString()}
        </h3>
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary" className="capitalize">
            {meal_plan.dietary_preference}
          </Badge>
          <Badge variant="outline">
            Budget: ${meal_plan.weekly_budget}
          </Badge>
          <Badge 
            variant={total_estimated_cost <= meal_plan.weekly_budget ? "default" : "destructive"}
          >
            Cost: ${total_estimated_cost.toFixed(2)}
          </Badge>
        </div>
        {total_estimated_cost > meal_plan.weekly_budget && (
          <p className="text-sm text-red-600">
            ⚠️ Estimated cost exceeds budget by ${(total_estimated_cost - meal_plan.weekly_budget).toFixed(2)}
          </p>
        )}
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Weekly Meal Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day, dayIndex) => (
                <div key={day} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-3">{day}</h4>
                  <div className="grid gap-3">
                    {MEAL_TYPES.map((mealType) => {
                      const recipe = recipesByDay[`${dayIndex}-${mealType}`];
                      return (
                        <div key={mealType} className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="text-sm font-medium capitalize text-gray-600">
                              {mealType}:
                            </span>
                            {recipe ? (
                              <div className="ml-2">
                                <span className="font-medium">{recipe.name}</span>
                                <div className="text-xs text-gray-500">
                                  {recipe.prep_time_minutes} min • ${recipe.estimated_cost.toFixed(2)} • {recipe.servings} servings
                                </div>
                              </div>
                            ) : (
                              <span className="ml-2 text-gray-400 italic">No recipe assigned</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Grocery List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🛒 Grocery List
          </CardTitle>
          <CardDescription>
            Consolidated shopping list for the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grocery_list.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No grocery items found. This may be due to backend stub implementation.
            </p>
          ) : (
            <div className="space-y-2">
              {grocery_list.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <span className="font-medium">{item.ingredient_name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {item.total_quantity} {item.unit}
                    </span>
                  </div>
                  <span className="font-medium text-green-600">
                    ${item.estimated_total_cost.toFixed(2)}
                  </span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-semibold">
                <span>Total Estimated Cost:</span>
                <span className="text-green-600">${total_estimated_cost.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
