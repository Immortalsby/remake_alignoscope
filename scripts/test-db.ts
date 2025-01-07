import { config } from 'dotenv';
import { query } from '../src/lib/db';

// 加载环境变量
config();

async function testConnection() {
  try {
    // 测试数据库连接
    const result = await query('SELECT NOW()');
    console.log('数据库连接成功！当前时间:', result.rows[0].now);

    // 测试texts表是否存在
    const tablesResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'texts'
      );
    `);
    
    if (tablesResult.rows[0].exists) {
      console.log('texts表已创建');
      
      // 检查表结构
      const columnsResult = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'texts';
      `);
      
      console.log('\n表结构:');
      columnsResult.rows.forEach((col: any) => {
        console.log(`${col.column_name}: ${col.data_type}`);
      });
      
      // 检查索引
      const indexesResult = await query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'texts';
      `);
      
      console.log('\n索引:');
      indexesResult.rows.forEach((idx: any) => {
        console.log(`${idx.indexname}:\n${idx.indexdef}\n`);
      });
    } else {
      console.log('警告: texts表不存在！');
    }
  } catch (error) {
    console.error('数据库测试失败:', error);
  } finally {
    // 关闭连接池
    process.exit(0);
  }
}

testConnection();
