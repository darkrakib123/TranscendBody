// server/validators.ts

import { allowedPlans } from '../shared/schema.ts';

/**
 * Checks whether the given plan is one of the allowed subscription types.
 * @param plan - The plan name to validate.
 * @returns true if valid, false otherwise.
 */
export function isValidPlan(plan: string): boolean {
  return allowedPlans.includes(plan.toLowerCase());
}
