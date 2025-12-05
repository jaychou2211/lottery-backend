import type { Kysely } from 'kysely';

import type { Database } from '../database.types';

const DEPARTMENTS = ['工程部', '產品部', '設計部', '行銷部', '人資部', '財務部', '業務部', '客服部'];

const SURNAMES = ['王', '李', '張', '劉', '陳', '楊', '黃', '吳', '趙', '周', '徐', '孫', '馬', '朱', '胡', '林', '郭', '何', '高', '羅'];
const GIVEN_NAMES = [
	'小明', '小華', '大偉', '美玲', '志強', '小芳', '建國', '雅婷', '文傑', '怡君',
	'俊宏', '淑惠', '家豪', '雅雯', '宗翰', '佳蓉', '冠宇', '詩涵', '承恩', '筱婷',
	'柏翰', '雨潔', '宇軒', '欣怡', '彥廷', '婉婷', '品睿', '思妤', '宥廷', '羽彤',
];

function generateEmployees(count: number) {
	const employees: { staff_number: string; name: string; department: string; role: 'SENIOR' | 'JUNIOR' }[] = [];

	for (let i = 1; i <= count; i++) {
		const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
		const givenName = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
		const department = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
		// 約 60% SENIOR, 40% JUNIOR
		const role = Math.random() < 0.6 ? 'SENIOR' : 'JUNIOR';

		employees.push({
			staff_number: `EMP${String(i).padStart(3, '0')}`,
			name: `${surname}${givenName}`,
			department,
			role,
		});
	}

	return employees;
}

export async function seed(db: Kysely<Database>): Promise<void> {
	const employees = generateEmployees(200);

	await db
		.insertInto('employee')
		.values(employees)
		.execute();
}
