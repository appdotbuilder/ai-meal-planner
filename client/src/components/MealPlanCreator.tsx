
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { 
  CreateMealPlanInput, 
  MealPlanWithRecipes, 
  DietaryPreference 
} from '../../../server/src/schema';

interface MealPlanCreatorProps {
  onMealPlanCreated: (mealPlan: MealPlanWithRecipes) => void;
  userId: string;
}

export function MealPlanCreator({ onMealPlanCreated, userId }: MealPlanCreatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [formData, setFormData] = useState<Omit<CreateMealPlanInput, 'week_start_date'>>({
    user_id: userId,
    dietary_preference: 'vegetarian' as DietaryPreference,
    weekly_budget: 50
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsLoading(true);
    try {
      const input: CreateMealPlanInput = {
        ...formData,
        week_start_date: date
      };
      
      const result = await trpc.createMealPlan.mutate(input);
      onMealPlanCreated(result);
      
      // Reset form
      setDate(new Date());
      setFormData({
        user_id: userId,
        dietary_preference: 'vegetarian',
        weekly_budget: 50
      });
    } catch (error) {
      console.error('Failed to create meal plan:', error);
      // Show user-friendly error - in real app would use toast notification
      alert('Failed to create meal plan. Backend handlers are not fully implemented yet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Week Start Date */}
      <div className="space-y-2">
        <Label htmlFor="week-start">Week Starting Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Dietary Preference */}
      <div className="space-y-2">
        <Label htmlFor="dietary-preference">Dietary Preference</Label>
        <Select
          value={formData.dietary_preference || 'vegetarian'}
          onValueChange={(value: DietaryPreference) =>
            setFormData((prev) => ({ ...prev, dietary_preference: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select dietary preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vegetarian">🥗 Vegetarian</SelectItem>
            <SelectItem value="vegan">🌱 Vegan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Weekly Budget */}
      <div className="space-y-2">
        <Label htmlFor="budget">Weekly Budget ($)</Label>
        <Input
          id="budget"
          type="number"
          min="1"
          step="0.01"
          value={formData.weekly_budget}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ 
              ...prev, 
              weekly_budget: parseFloat(e.target.value) || 0 
            }))
          }
          placeholder="Enter your weekly budget"
          required
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Generating Meal Plan...
          </>
        ) : (
          <>
            ✨ Generate AI Meal Plan
          </>
        )}
      </Button>

      {isLoading && (
        <p className="text-sm text-gray-500 text-center">
          Our AI is selecting the perfect recipes within your budget...
        </p>
      )}
    </form>
  );
}
