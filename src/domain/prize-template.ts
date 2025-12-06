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
	/**
	 * Rank in format "{level}-{sequence}" where level is 1-5.
	 * Level corresponds to prize tier:
	 *   1 = 小獎, 2 = 中獎, 3 = 大獎, 4 = 特大獎, 5 = 頭獎
	 */
	readonly rank: string;
	readonly imageUrl: string;
	/** Number of senior winners for this prize */
	readonly senior: number;
	/** Number of junior winners for this prize */
	readonly junior: number;
}
