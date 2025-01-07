import { config } from 'dotenv';
import { query } from '../src/lib/db';
import * as fs from 'fs/promises';
import * as path from 'path';

// 加载环境变量
config();

interface TextEntry {
  lang0: string;
  lang1: string;
  volume: number;
  position: number;
}

async function migrateData() {
  try {
    // 检查原始数据文件是否存在
    const dataPath = path.join(process.cwd(), '..', 'flask', 'data', 'texts.json');
    console.log('正在读取数据文件:', dataPath);
    
    const data = JSON.parse(await fs.readFile(dataPath, 'utf8')) as TextEntry[];
    console.log(`找到 ${data.length} 条记录`);

    // 开始批量插入
    console.log('开始数据迁移...');
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values = batch.map((entry, index) => {
        const offset = i + index;
        return `($${offset * 4 + 1}, $${offset * 4 + 2}, $${offset * 4 + 3}, $${offset * 4 + 4})`;
      }).join(', ');

      const params = batch.flatMap(entry => [
        entry.lang0,
        entry.lang1,
        entry.volume,
        entry.position
      ]);

      const sql = `
        INSERT INTO texts (lang0, lang1, volume, position)
        VALUES ${values}
        ON CONFLICT (volume, position) DO UPDATE 
        SET lang0 = EXCLUDED.lang0,
            lang1 = EXCLUDED.lang1;
      `;

      await query(sql, params);
      processed += batch.length;
      console.log(`已处理 ${processed}/${data.length} 条记录`);
    }

    console.log('数据迁移完成！');

    // 验证迁移结果
    const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM texts');
    console.log(`数据库中共有 ${count} 条记录`);

  } catch (error) {
    console.error('数据迁移失败:', error);
  } finally {
    process.exit(0);
  }
}

migrateData();
