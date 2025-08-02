
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  Recipe, 
  Ingredient, 
  CreateRecipeInput, 
  DietaryPreference 
} from '../../../server/src/schema';

interface RecipeManagerProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onRecipeCreated: () => void;
}

export function RecipeManager({ recipes, ingredients, onRecipeCreated }: RecipeManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState<Omit<CreateRecipeInput, 'ingredients'>>({
    name: '',
    description: null,
    dietary_preference: 'vegetarian' as DietaryPreference,
    estimated_cost: 0,
    servings: 1,
    prep_time_minutes: 30,
    instructions: ''
  });

  const [recipeIngredients, setRecipeIngredients] = useState<Array<{ ingredient_id: number; quantity: number }>>([]);
  const [newIngredient, setNewIngredient] = useState({ ingredient_id: 0, quantity: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const input: CreateRecipeInput = {
        ...formData,
        ingredients: recipeIngredients
      };
      
      await trpc.createRecipe.mutate(input);
      onRecipeCreated();
      
      // Reset form
      setFormData({
        name: '',
        description: null,
        dietary_preference: 'vegetarian',
        estimated_cost: 0,
        servings: 1,
        prep_time_minutes: 30,
        instructions: ''
      });
      setRecipeIngredients([]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create recipe:', error);
      alert('Failed to create recipe. Backend handlers are not fully implemented yet.');
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredient = () => {
    if (newIngredient.ingredient_id && newIngredient.quantity > 0) {
      setRecipeIngredients((prev) => [...prev, newIngredient]);
      setNewIngredient({ ingredient_id: 0, quantity: 0 });
    }
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const getIngredientName = (ingredientId: number) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.name : 'Unknown Ingredient';
  };

  return (
    <div className="space-y-6">
      {/* Create Recipe Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recipe Collection</h3>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "outline" : "default"}
        >
          {showCreateForm ? 'Cancel' : '+ Add New Recipe'}
        </Button>
      </div>

      {/* Create Recipe Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Recipe</CardTitle>
            <CardDescription>Add a new recipe to your collection</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Recipe Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipe-name">Recipe Name</Label>
                  <Input
                    id="recipe-name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter recipe name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dietary-preference">Dietary Preference</Label>
                  <Select
                    value={formData.dietary_preference || 'vegetarian'}
                    onValueChange={(value: DietaryPreference) =>
                      setFormData((prev) => ({ ...prev, dietary_preference: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetarian">🥗 Vegetarian</SelectItem>
                      <SelectItem value="vegan">🌱 Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={formData.servings}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, servings: parseInt(e.target.value) || 1 }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    min="1"
                    value={formData.prep_time_minutes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, prep_time_minutes: parseInt(e.target.value) || 30 }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated-cost">Estimated Cost ($)</Label>
                  <Input
                    id="estimated-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Brief recipe description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  placeholder="Enter step-by-step cooking instructions"
                  className="min-h-[100px]"
                  required
                />
              </div>

              {/* Ingredients Section */}
              <div className="space-y-4">
                <Label>Recipe Ingredients</Label>
                
                {/* Add Ingredient */}
                <div className="flex gap-2">
                  <Select
                    value={newIngredient.ingredient_id ? newIngredient.ingredient_id.toString() : 'none'}
                    onValueChange={(value) =>
                      setNewIngredient((prev) => ({ ...prev, ingredient_id: value === 'none' ? 0 : parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select ingredient</SelectItem>
                      {ingredients.map((ingredient: Ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                          {ingredient.name} ({ingredient.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newIngredient.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewIngredient((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="Quantity"
                    className="w-24"
                  />
                  
                  <Button type="button" variant="outline" onClick={addIngredient}>
                    Add
                  </Button>
                </div>

                

                {/* Ingredients List */}
                {recipeIngredients.length > 0 && (
                  <div className="space-y-2">
                    {recipeIngredients.map((ingredient, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>
                          {getIngredientName(ingredient.ingredient_id)} - {ingredient.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating Recipe...' : 'Create Recipe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recipe List */}
      <div className="space-y-4">
        {recipes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-2">No recipes available</p>
              <p className="text-sm text-gray-400">
                Backend handlers are stub implementations. Create recipes to see them here!
              </p>
            </CardContent>
          </Card>
        ) : (
          recipes.map((recipe: Recipe) => (
            <Card key={recipe.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    {recipe.description && (
                      <CardDescription>{recipe.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {recipe.dietary_preference}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <span>⏱️ {recipe.prep_time_minutes} min</span>
                  <span>🍽️ {recipe.servings} servings</span>
                  <span>💰 ${recipe.estimated_cost.toFixed(2)}</span>
                </div>
                <Separator className="my-3" />
                <div>
                  <h4 className="font-medium mb-2">Instructions:</h4>
                  <p className="text-sm text-gray-700">{recipe.instructions}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
