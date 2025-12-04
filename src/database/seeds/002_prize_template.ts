import type { Kysely } from 'kysely';

import type { Database } from '../database.types';

export async function seed(db: Kysely<Database>): Promise<void> {
	// Prize configuration: 5 SENIOR slots, 5 JUNIOR slots (matching seed employees)
	await db
		.insertInto('prize_template')
		.values([
			{ name: 'iPhone 16 Pro Max', prize_level: '特獎', image_url: 'https://example.com/iphone16.jpg', senior: 1, junior: 1 },
			{ name: 'MacBook Pro 14"', prize_level: '頭獎', image_url: 'https://example.com/macbook.jpg', senior: 1, junior: 1 },
			{ name: 'iPad Pro', prize_level: '二獎', image_url: 'https://example.com/ipad.jpg', senior: 1, junior: 1 },
			{ name: 'AirPods Pro', prize_level: '三獎', image_url: 'https://example.com/airpods.jpg', senior: 1, junior: 1 },
			{ name: 'Apple Watch', prize_level: '四獎', image_url: 'https://example.com/watch.jpg', senior: 1, junior: 1 },
		])
		.execute();
}
