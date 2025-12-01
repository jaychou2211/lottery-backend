/**
 * Raffle lifecycle status
 *
 * DRAFT → READY → IN_PROGRESS → BONUS → COMPLETED
 */
export enum RaffleStatus {
	DRAFT = 'DRAFT',
	READY = 'READY',
	IN_PROGRESS = 'IN_PROGRESS',
	BONUS = 'BONUS',
	COMPLETED = 'COMPLETED',
}
