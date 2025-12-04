/**
 * Entity: PrizeTemplate
 *
 * Reference entity for prize templates.
 * Used to create RafflePrize instances.
 *
 * Note: This is intentionally an interface, not a class.
 * PrizeTemplate has no domain behavior in this bounded context;
 * it serves as reference data for creating raffle prizes.
 * CRUD operations are handled in the Application layer.
 */
export interface PrizeTemplate {
	readonly id: number;
	readonly name: string;
	readonly prizeLevel: string;
	readonly imageUrl: string;
	/** Number of senior winners for this prize */
	readonly senior: number;
	/** Number of junior winners for this prize */
	readonly junior: number;
}
