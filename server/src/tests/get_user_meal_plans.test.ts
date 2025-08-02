
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mealPlansTable } from '../db/schema';
import { getUserMealPlans } from '../handlers/get_user_meal_plans';

describe('getUserMealPlans', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no meal plans', async () => {
    const result = await getUserMealPlans('user123');
    expect(result).toEqual([]);
  });

  it('should return meal plans for specific user', async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier
    
    // Create test meal plans for different users with explicit created_at times
    await db.insert(mealPlansTable).values([
      {
        user_id: 'user123',
        week_start_date: new Date('2024-01-01'),
        dietary_preference: 'vegan',
        weekly_budget: '100.00',
        total_estimated_cost: '85.50',
        created_at: earlier
      },
      {
        user_id: 'user123',
        week_start_date: new Date('2024-01-08'),
        dietary_preference: 'vegetarian',
        weekly_budget: '120.00',
        total_estimated_cost: '95.75',
        created_at: now
      },
      {
        user_id: 'user456',
        week_start_date: new Date('2024-01-01'),
        dietary_preference: 'vegan',
        weekly_budget: '150.00',
        total_estimated_cost: '140.00'
      }
    ]).execute();

    const result = await getUserMealPlans('user123');

    expect(result).toHaveLength(2);
    
    // Verify all returned meal plans belong to correct user
    result.forEach(mealPlan => {
      expect(mealPlan.user_id).toEqual('user123');
    });

    // Verify numeric conversions
    expect(typeof result[0].weekly_budget).toBe('number');
    expect(typeof result[0].total_estimated_cost).toBe('number');
    
    // Verify field values - most recent first due to ordering
    expect(result[0].weekly_budget).toEqual(120.00);
    expect(result[0].total_estimated_cost).toEqual(95.75);
    expect(result[1].weekly_budget).toEqual(100.00);
    expect(result[1].total_estimated_cost).toEqual(85.50);
  });

  it('should return meal plans ordered by creation date descending', async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier
    
    await db.insert(mealPlansTable).values([
      {
        user_id: 'user123',
        week_start_date: new Date('2024-01-01'),
        dietary_preference: 'vegan',
        weekly_budget: '100.00',
        total_estimated_cost: '85.50',
        created_at: earlier
      },
      {
        user_id: 'user123',
        week_start_date: new Date('2024-01-08'),
        dietary_preference: 'vegetarian',
        weekly_budget: '120.00',
        total_estimated_cost: '95.75',
        created_at: now
      }
    ]).execute();

    const result = await getUserMealPlans('user123');

    expect(result).toHaveLength(2);
    // Most recent should be first
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
    expect(result[0].weekly_budget).toEqual(120.00);
    expect(result[1].weekly_budget).toEqual(100.00);
  });

  it('should not return meal plans for other users', async () => {
    await db.insert(mealPlansTable).values([
      {
        user_id: 'user123',
        week_start_date: new Date('2024-01-01'),
        dietary_preference: 'vegan',
        weekly_budget: '100.00',
        total_estimated_cost: '85.50'
      },
      {
        user_id: 'user456',
        week_start_date: new Date('2024-01-01'),
        dietary_preference: 'vegetarian',
        weekly_budget: '150.00',
        total_estimated_cost: '140.00'
      }
    ]).execute();

    const result = await getUserMealPlans('user789');
    expect(result).toEqual([]);
  });

  it('should handle all meal plan fields correctly', async () => {
    const testDate = new Date('2024-01-01');
    
    await db.insert(mealPlansTable).values({
      user_id: 'user123',
      week_start_date: testDate,
      dietary_preference: 'vegan',
      weekly_budget: '99.99',
      total_estimated_cost: '88.88'
    }).execute();

    const result = await getUserMealPlans('user123');

    expect(result).toHaveLength(1);
    const mealPlan = result[0];
    
    expect(mealPlan.id).toBeDefined();
    expect(mealPlan.user_id).toEqual('user123');
    expect(mealPlan.week_start_date).toEqual(testDate);
    expect(mealPlan.dietary_preference).toEqual('vegan');
    expect(mealPlan.weekly_budget).toEqual(99.99);
    expect(mealPlan.total_estimated_cost).toEqual(88.88);
    expect(mealPlan.created_at).toBeInstanceOf(Date);
  });
});
