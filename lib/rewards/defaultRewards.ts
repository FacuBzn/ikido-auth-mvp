/**
 * Default Rewards Configuration
 *
 * These rewards are automatically seeded for each child when they are
 * first viewed in the Manage Rewards screen.
 *
 * All rewards default to cost=10 GGPoints and claimed=false.
 */

export interface DefaultReward {
  name: string;
  cost: number;
}

export const DEFAULT_REWARDS: DefaultReward[] = [
  { name: "Choose the Family Playlist (30 min)", cost: 10 },
  { name: "Mystery Box: Tiny Surprise", cost: 10 },
  { name: "Double GG Day (next task counts x2)", cost: 10 },
  { name: "Build-a-Fort Night", cost: 10 },
  { name: "Late Bedtime Pass (20 min)", cost: 10 },
];

/**
 * Get the list of default rewards for seeding
 */
export function getDefaultRewards(): DefaultReward[] {
  return DEFAULT_REWARDS;
}
