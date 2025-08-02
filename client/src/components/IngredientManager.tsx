
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { Ingredient, CreateIngredientInput } from '../../../server/src/schema';

interface IngredientManagerProps {
  ingredients: Ingredient[];
  onIngredientCreated: () => void;
}

export function IngredientManager({ ingredients, onIngredientCreated }: IngredientManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState<CreateIngredientInput>({
    name: '',
    unit: '',
    estimated_price_per_unit: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createIngredient.mutate(formData);
      onIngredientCreated();
      
      // Reset form
      setFormData({
        name: '',
        unit: '',
        estimated_price_per_unit: 0
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create ingredient:', error);
      alert('Failed to create ingredient. Backend handlers are not fully implemented yet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Ingredient Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ingredient Database</h3>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "outline" : "default"}
        >
          {showCreateForm ? 'Cancel' : '+ Add New Ingredient'}
        </Button>
      </div>

      {/* Create Ingredient Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Ingredient</CardTitle>
            <CardDescription>Add a new ingredient to the database</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ingredient-name">Ingredient Name</Label>
                  <Input
                    id="ingredient-name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIngredientInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Tomatoes, Rice, Olive Oil"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measurement</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIngredientInput) => ({ ...prev, unit: e.target.value }))
                    }
                    placeholder="e.g., cups, grams, pieces"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price per Unit ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimated_price_per_unit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIngredientInput) => ({ 
                        ...prev, 
                        estimated_price_per_unit: parseFloat(e.target.value) || 0 
                      }))
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Adding Ingredient...' : 'Add Ingredient'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Ingredients List */}
      <div className="space-y-4">
        {ingredients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-2">No ingredients available</p>
              <p className="text-sm text-gray-400">
                Backend handlers are stub implementations. Add ingredients to see them here!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ingredients.map((ingredient: Ingredient) => (
              <Card key={ingredient.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex justify-between items-start">
                    <span>{ingredient.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      ${ingredient.estimated_price_per_unit.toFixed(2)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Unit: {ingredient.unit}</span>
                    <span>per {ingredient.unit}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Added: {ingredient.created_at.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Common Ingredients */}
      {ingredients.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-base text-yellow-800">💡 Quick Start</CardTitle>
            <CardDescription className="text-yellow-700">
              Add some common ingredients to get started with recipe creation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              Common ingredients to add: Rice (cups), Olive Oil (tbsp), Onions (pieces), 
              Garlic (cloves), Tomatoes (pieces), Bell Peppers (pieces), Spinach (cups), 
              Black Beans (cups), Quinoa (cups), Tofu (blocks)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
