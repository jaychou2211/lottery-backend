import { DrawnGroup, EmployeeRole } from '../shared';

export interface ParticipantEligibility {
	readonly id: number;
	readonly role: EmployeeRole;
}

export class EligibilityPool {
	private constructor(
		private readonly seniors: ReadonlyMap<number, ParticipantEligibility>,
		private readonly juniors: ReadonlyMap<number, ParticipantEligibility>,
		private readonly _wonIds: ReadonlySet<number>,
	) {}

	static create(
		participants: readonly ParticipantEligibility[],
		wonIds: ReadonlySet<number> = new Set(),
	): EligibilityPool {
		const seniors = new Map<number, ParticipantEligibility>();
		const juniors = new Map<number, ParticipantEligibility>();

		for (const p of participants) {
			if (p.role === EmployeeRole.SENIOR) {
				seniors.set(p.id, p);
			} else {
				juniors.set(p.id, p);
			}
		}

		return new EligibilityPool(seniors, juniors, wonIds);
	}

	get totalCount(): number {
		return this.seniors.size + this.juniors.size;
	}

	get seniorCount(): number {
		return this.seniors.size;
	}

	get juniorCount(): number {
		return this.juniors.size;
	}

	get remainingSeniorCount(): number {
		let count = 0;
		for (const id of this.seniors.keys()) {
			if (!this._wonIds.has(id)) count++;
		}
		return count;
	}

	get remainingJuniorCount(): number {
		let count = 0;
		for (const id of this.juniors.keys()) {
			if (!this._wonIds.has(id)) count++;
		}
		return count;
	}

	get remainingTotalCount(): number {
		return this.remainingSeniorCount + this.remainingJuniorCount;
	}

	get wonIds(): ReadonlySet<number> {
		return this._wonIds;
	}

	hasWon(participantId: number): boolean {
		return this._wonIds.has(participantId);
	}

	getEligibleIds(group: DrawnGroup): readonly number[] {
		const result: number[] = [];

		if (group === DrawnGroup.SENIOR || group === DrawnGroup.ALL) {
			for (const id of this.seniors.keys()) {
				if (!this._wonIds.has(id)) result.push(id);
			}
		}

		if (group === DrawnGroup.JUNIOR || group === DrawnGroup.ALL) {
			for (const id of this.juniors.keys()) {
				if (!this._wonIds.has(id)) result.push(id);
			}
		}

		return result;
	}

	getRole(participantId: number): EmployeeRole | undefined {
		const senior = this.seniors.get(participantId);
		if (senior) return senior.role;

		const junior = this.juniors.get(participantId);
		if (junior) return junior.role;

		return undefined;
	}

	markAsWon(participantId: number): EligibilityPool {
		const newWonIds = new Set(this._wonIds);
		newWonIds.add(participantId);
		return new EligibilityPool(this.seniors, this.juniors, newWonIds);
	}

	markManyAsWon(participantIds: readonly number[]): EligibilityPool {
		const newWonIds = new Set(this._wonIds);
		for (const id of participantIds) {
			newWonIds.add(id);
		}
		return new EligibilityPool(this.seniors, this.juniors, newWonIds);
	}
}
