import { config } from 'dotenv';
import { query } from '../src/lib/db';
import mysql from 'mysql2/promise';

// 加载环境变量
config();

interface TextEntry {
  id: number;
  lang0: string;
  lang1: string;
}

async function migrateFromMySQL() {
  // 创建MySQL连接
  const mysqlConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'alignoscope'
  });

  try {
    console.log('连接到MySQL数据库...');
    
    // 获取总记录数
    const [countResult] = await mysqlConnection.execute('SELECT COUNT(*) as total FROM jeanchristophe');
    const total = (countResult as any)[0].total;
    console.log(`找到 ${total} 条记录`);

    // 分批获取数据
    const batchSize = 100;
    let offset = 0;

    while (offset < total) {
      // 使用字符串拼接而不是参数化查询来处理LIMIT
      const [rows] = await mysqlConnection.query(
        `SELECT id, lang0, lang1 FROM jeanchristophe LIMIT ${offset}, ${batchSize}`
      );
      
      if ((rows as TextEntry[]).length === 0) {
        break;
      }

      // 准备PostgreSQL插入语句
      const values = (rows as TextEntry[]).map((_, index) => {
        const paramOffset = index * 3;
        return `($${paramOffset + 1}, $${paramOffset + 2}, $${paramOffset + 3})`;
      }).join(', ');

      const params = (rows as TextEntry[]).flatMap(row => [
        row.lang0,
        row.lang1,
        row.id  // 使用原始ID作为position
      ]);

      // 插入到PostgreSQL
      const sql = `
        INSERT INTO texts (lang0, lang1, position)
        VALUES ${values}
        ON CONFLICT (volume, position) DO UPDATE 
        SET lang0 = EXCLUDED.lang0,
            lang1 = EXCLUDED.lang1;
      `;

      await query(sql, params);
      
      offset += (rows as TextEntry[]).length;
      console.log(`已处理 ${offset}/${total} 条记录`);
    }

    console.log('数据迁移完成！');

    // 验证迁移结果
    const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM texts');
    console.log(`PostgreSQL数据库中共有 ${count} 条记录`);

  } catch (error) {
    console.error('数据迁移失败:', error);
    throw error;
  } finally {
    await mysqlConnection.end();
    process.exit(0);
  }
}

migrateFromMySQL();
