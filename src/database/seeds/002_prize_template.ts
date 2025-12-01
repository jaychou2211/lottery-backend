import type { Kysely } from 'kysely';

import type { Database } from '../database.types';

export async function seed(db: Kysely<Database>): Promise<void> {
	await db
		.insertInto('prize_template')
		.values([
			{ name: 'iPhone 16 Pro Max', prize_level: '特獎', image_url: 'https://example.com/iphone16.jpg' },
			{ name: 'MacBook Pro 14"', prize_level: '頭獎', image_url: 'https://example.com/macbook.jpg' },
			{ name: 'iPad Pro', prize_level: '二獎', image_url: 'https://example.com/ipad.jpg' },
			{ name: 'AirPods Pro', prize_level: '三獎', image_url: 'https://example.com/airpods.jpg' },
			{ name: 'Apple Watch', prize_level: '四獎', image_url: 'https://example.com/watch.jpg' },
			{ name: '百貨禮券 $5000', prize_level: '五獎', image_url: 'https://example.com/gift5000.jpg' },
			{ name: '百貨禮券 $3000', prize_level: '六獎', image_url: 'https://example.com/gift3000.jpg' },
			{ name: '百貨禮券 $1000', prize_level: '普獎', image_url: 'https://example.com/gift1000.jpg' },
		])
		.execute();
}
