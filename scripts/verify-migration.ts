import { config } from 'dotenv';
import { query } from '../src/lib/db';
import mysql from 'mysql2/promise';

// 加载环境变量
config();

interface MySQLText {
  id: number;
  lang0: string;
  lang1: string;
}

interface PostgreSQLText {
  id: number;
  lang0: string;
  lang1: string;
  volume: number | null;
  position: number;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

async function verifyMigration() {
  // 创建MySQL连接
  const mysqlConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'alignoscope'
  });

  try {
    console.log('开始验证数据迁移...\n');

    // 1. 验证记录总数
    const [mysqlCount] = await mysqlConnection.query('SELECT COUNT(*) as count FROM jeanchristophe');
    const { rows: [pgCount] } = await query('SELECT COUNT(*) as count FROM texts');
    
    console.log('记录总数比较:');
    console.log(`MySQL: ${(mysqlCount as any)[0].count} 条记录`);
    console.log(`PostgreSQL: ${pgCount.count} 条记录`);
    console.log('总数是否匹配:', (mysqlCount as any)[0].count === parseInt(pgCount.count) ? '✅ 是' : '❌ 否');
    console.log();

    // 2. 验证数据样本
    console.log('验证数据样本...');
    const sampleSize = 5;
    const [mysqlSamples] = await mysqlConnection.query(
      `SELECT * FROM jeanchristophe ORDER BY RAND() LIMIT ${sampleSize}`
    );

    for (const mysqlRecord of mysqlSamples as MySQLText[]) {
      const { rows: [pgRecord] } = await query(
        'SELECT * FROM texts WHERE position = $1',
        [mysqlRecord.id]
      );

      if (!pgRecord) {
        console.log(`❌ 记录 ${mysqlRecord.id} 在PostgreSQL中未找到`);
        continue;
      }

      const contentMatch = 
        mysqlRecord.lang0 === pgRecord.lang0 && 
        mysqlRecord.lang1 === pgRecord.lang1;

      console.log(`\n记录 ${mysqlRecord.id}:`);
      console.log('内容匹配:', contentMatch ? '✅ 是' : '❌ 否');
      
      if (!contentMatch) {
        console.log('\nMySQL record:');
        console.log('lang0:', mysqlRecord.lang0.substring(0, 50) + '...');
        console.log('lang1:', mysqlRecord.lang1.substring(0, 50) + '...');
        console.log('\nPostgreSQL record:');
        console.log('lang0:', pgRecord.lang0.substring(0, 50) + '...');
        console.log('lang1:', pgRecord.lang1.substring(0, 50) + '...');
      }
    }

    // 3. 验证NULL值
    const { rows: [nullCounts] } = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE lang0 IS NULL) as null_lang0,
        COUNT(*) FILTER (WHERE lang1 IS NULL) as null_lang1,
        COUNT(*) FILTER (WHERE position IS NULL) as null_position
      FROM texts
    `);

    console.log('\n空值检查:');
    console.log(`lang0为NULL: ${nullCounts.null_lang0} 条记录`);
    console.log(`lang1为NULL: ${nullCounts.null_lang1} 条记录`);
    console.log(`position为NULL: ${nullCounts.null_position} 条记录`);

    // 4. 验证position的唯一性
    const { rows: [duplicatePositions] } = await query(`
      SELECT position, COUNT(*) as count
      FROM texts
      GROUP BY position
      HAVING COUNT(*) > 1
    `);

    console.log('\nposition重复检查:');
    if (duplicatePositions) {
      console.log(`❌ 发现重复的position值: ${duplicatePositions.position} (出现 ${duplicatePositions.count} 次)`);
    } else {
      console.log('✅ 所有position值都是唯一的');
    }

  } catch (error) {
    console.error('验证失败:', error);
  } finally {
    await mysqlConnection.end();
    process.exit(0);
  }
}

verifyMigration();
