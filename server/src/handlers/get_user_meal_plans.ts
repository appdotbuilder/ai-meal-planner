
import { db } from '../db';
import { mealPlansTable } from '../db/schema';
import { type MealPlan } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserMealPlans(userId: string): Promise<MealPlan[]> {
  try {
    const results = await db.select()
      .from(mealPlansTable)
      .where(eq(mealPlansTable.user_id, userId))
      .orderBy(desc(mealPlansTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(mealPlan => ({
      ...mealPlan,
      weekly_budget: parseFloat(mealPlan.weekly_budget),
      total_estimated_cost: parseFloat(mealPlan.total_estimated_cost)
    }));
  } catch (error) {
    console.error('Failed to get user meal plans:', error);
    throw error;
  }
}
