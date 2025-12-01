import type { Kysely } from 'kysely';

import type { Database } from '../database.types';

export async function seed(db: Kysely<Database>): Promise<void> {
	await db
		.insertInto('employee')
		.values([
			{ staff_number: 'EMP001', name: '王小明', department: '工程部', role: 'SENIOR' },
			{ staff_number: 'EMP002', name: '李小華', department: '工程部', role: 'SENIOR' },
			{ staff_number: 'EMP003', name: '張大偉', department: '產品部', role: 'SENIOR' },
			{ staff_number: 'EMP004', name: '陳美玲', department: '設計部', role: 'SENIOR' },
			{ staff_number: 'EMP005', name: '林志強', department: '行銷部', role: 'SENIOR' },
			{ staff_number: 'EMP006', name: '黃小芳', department: '工程部', role: 'JUNIOR' },
			{ staff_number: 'EMP007', name: '吳建國', department: '產品部', role: 'JUNIOR' },
			{ staff_number: 'EMP008', name: '周雅婷', department: '設計部', role: 'JUNIOR' },
			{ staff_number: 'EMP009', name: '鄭文傑', department: '行銷部', role: 'JUNIOR' },
			{ staff_number: 'EMP010', name: '劉怡君', department: '人資部', role: 'JUNIOR' },
		])
		.execute();
}
