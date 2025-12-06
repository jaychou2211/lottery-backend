// ============================================================
// Base
// ============================================================
export { DomainError } from './domain-error';

// ============================================================
// Enums
// ============================================================
export { RaffleStatus } from './raffle-status';
export { EmployeeRole } from './employee-role';
export { DrawnGroup } from './drawn-group';

// ============================================================
// Value Objects
// ============================================================
export { RegularEligibleCounts, BonusEligibleCounts } from './eligible-counts';
export type { EligibleCounts } from './eligible-counts';
export { PrizeRank } from './prize-rank';

// ============================================================
// Errors
// ============================================================
export { InvalidTotalError, TotalMismatchError } from './eligible-counts';
export type { EligibleCountsError } from './eligible-counts';
export {
	InvalidPrizeRankFormatError,
	InvalidPrizeSequenceError,
	NonConsecutiveSequenceError,
} from './prize-rank';
export type { PrizeRankError } from './prize-rank';
