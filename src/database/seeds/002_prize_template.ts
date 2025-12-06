import type { Kysely } from 'kysely';

import type { Database } from '../database.types';

export async function seed(db: Kysely<Database>): Promise<void> {
	await db
		.insertInto('prize_template')
		.values([
			// 小獎 (Level 1)
			{ name: "Kiehl's 稀土深層毛孔清潔面膜", rank: '1-1', image_url: 'https://example.com/kiehls.jpg', senior: 2, junior: 1 },
			{ name: '露禾LOHE 磁吸翻蓋折疊購物推車65L', rank: '1-2', image_url: 'https://example.com/lohe.jpg', senior: 3, junior: 2 },
			{ name: 'Laifen WAVE 電動牙刷', rank: '1-3', image_url: 'https://example.com/laifen.jpg', senior: 12, junior: 10 },
			{ name: 'Aesop 季節禮盒(手部及身體保養三重奏)', rank: '1-4', image_url: 'https://example.com/aesop.jpg', senior: 4, junior: 2 },
			{ name: 'R3 mini肩颈按摩仪', rank: '1-5', image_url: 'https://example.com/r3mini.jpg', senior: 6, junior: 4 },
			{ name: '現金獎2000', rank: '1-6', image_url: 'https://example.com/cash2000.jpg', senior: 12, junior: 8 },
			{ name: 'JBL Clip 5 防水藍牙喇叭', rank: '1-7', image_url: 'https://example.com/jbl5.jpg', senior: 8, junior: 2 },
			{ name: 'JBL Clip 4 防水藍牙喇叭', rank: '1-8', image_url: 'https://example.com/jbl4.jpg', senior: 0, junior: 2 },
			{ name: 'JBL GO 4 防水藍牙喇叭', rank: '1-9', image_url: 'https://example.com/jblgo4.jpg', senior: 0, junior: 1 },
			{ name: 'Sabon 沐浴油禮盒', rank: '1-10', image_url: 'https://example.com/sabon.jpg', senior: 4, junior: 2 },
			{ name: '現金獎3600', rank: '1-11', image_url: 'https://example.com/cash3600.jpg', senior: 14, junior: 6 },

			// 中獎 (Level 2)
			{ name: 'AVEDA X Altuzarra 洗護禮盒', rank: '2-1', image_url: 'https://example.com/aveda.jpg', senior: 4, junior: 2 },
			{ name: 'KINUJO 寬版保濕美髮離子夾', rank: '2-2', image_url: 'https://example.com/kinujo.jpg', senior: 0, junior: 1 },
			{ name: 'FUJIFILM 富士 instax mini Evo 拍立得', rank: '2-3', image_url: 'https://example.com/fuji.jpg', senior: 2, junior: 1 },
			{ name: '現金獎6000', rank: '2-4', image_url: 'https://example.com/cash6000.jpg', senior: 8, junior: 4 },
			{ name: 'Beats Solo 4 耳罩式耳機', rank: '2-5', image_url: 'https://example.com/beats.jpg', senior: 3, junior: 3 },
			{ name: 'MONTBLANC 萬寶龍男士精品皮夾(大班系列)', rank: '2-6', image_url: 'https://example.com/montblanc1.jpg', senior: 1, junior: 0 },
			{ name: 'MONTBLANC 萬寶龍男士精品皮夾(匠心系列)', rank: '2-7', image_url: 'https://example.com/montblanc2.jpg', senior: 0, junior: 1 },
			{ name: '價值8000電子閱讀器兌換券', rank: '2-8', image_url: 'https://example.com/ereader.jpg', senior: 1, junior: 2 },
			{ name: '現金獎8000', rank: '2-9', image_url: 'https://example.com/cash8000.jpg', senior: 6, junior: 2 },

			// 大獎 (Level 3)
			{ name: 'Dyson 吹風機 Supersonic HD17 日本限定款', rank: '3-1', image_url: 'https://example.com/dyson-hair.jpg', senior: 1, junior: 1 },
			{ name: 'Insta360 GO 3S 拇指運動相機', rank: '3-2', image_url: 'https://example.com/insta360.jpg', senior: 1, junior: 0 },
			{ name: 'Sony WH-1000XM4 Wireless 耳機', rank: '3-3', image_url: 'https://example.com/sony.jpg', senior: 3, junior: 1 },
			{ name: 'AMIRO S2 大師級黃金點陣美容導入儀', rank: '3-4', image_url: 'https://example.com/amiro.jpg', senior: 1, junior: 1 },
			{ name: '現金獎10000', rank: '3-5', image_url: 'https://example.com/cash10000.jpg', senior: 3, junior: 2 },
			{ name: 'BRAUN PL7387 Skin i-expert 雷射除毛儀', rank: '3-6', image_url: 'https://example.com/braun.jpg', senior: 1, junior: 1 },
			{ name: '坚果N1 Air高亮版投影機', rank: '3-7', image_url: 'https://example.com/jmgo.jpg', senior: 3, junior: 1 },
			{ name: '星宇九州來回機票', rank: '3-8', image_url: 'https://example.com/starlux-kyushu.jpg', senior: 2, junior: 0 },

			// 特大獎 (Level 4)
			{ name: 'Dyson V11 Fluffy 智慧無線吸塵器', rank: '4-1', image_url: 'https://example.com/dyson-v11.jpg', senior: 1, junior: 1 },
			{ name: 'Roborock Qrevo Pro 掃地機器人', rank: '4-2', image_url: 'https://example.com/roborock.jpg', senior: 3, junior: 1 },
			{ name: '星宇北海道來回機票', rank: '4-3', image_url: 'https://example.com/starlux-hokkaido.jpg', senior: 1, junior: 1 },
			{ name: 'iPhone 16 256GB', rank: '4-4', image_url: 'https://example.com/iphone16.jpg', senior: 0, junior: 2 },
			{ name: 'iPhone 16 Pro 256GB', rank: '4-5', image_url: 'https://example.com/iphone16pro.jpg', senior: 2, junior: 0 },

			// 頭獎 (Level 5)
			{ name: '純金999金塊 5錢', rank: '5-1', image_url: 'https://example.com/gold.jpg', senior: 1, junior: 1 },
		])
		.execute();
}
