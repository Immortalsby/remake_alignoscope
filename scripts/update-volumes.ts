import { config } from 'dotenv';
import { query } from '../src/lib/db';

// 加载环境变量
config();

// 定义卷的分界点
const VOLUME_BOUNDARIES = [460, 932, 1817, 2933, 3725, 4001, 4677, 5521, 6266];

async function updateVolumes() {
  try {
    console.log('开始更新卷号...');

    // 对每个position，确定它属于哪一卷
    for (let i = 0; i <= VOLUME_BOUNDARIES.length; i++) {
      const startPosition = i === 0 ? 1 : VOLUME_BOUNDARIES[i - 1] + 1;
      const endPosition = i === VOLUME_BOUNDARIES.length ? 999999 : VOLUME_BOUNDARIES[i];
      
      // 更新这个范围内的记录
      const result = await query(
        `UPDATE texts 
         SET volume = $1 
         WHERE position >= $2 AND position <= $3`,
        [i + 1, startPosition, endPosition]
      );

      console.log(`已更新第 ${i + 1} 卷 (${startPosition} - ${endPosition})`);
    }

    // 验证更新结果
    const { rows: volumeCounts } = await query(
      `SELECT volume, COUNT(*) as count 
       FROM texts 
       GROUP BY volume 
       ORDER BY volume`
    );

    console.log('\n各卷记录数:');
    volumeCounts.forEach(({ volume, count }) => {
      console.log(`第 ${volume} 卷: ${count} 条记录`);
    });

    // 检查是否有遗漏的记录
    const { rows: [{ count: nullCount }] } = await query(
      'SELECT COUNT(*) as count FROM texts WHERE volume IS NULL'
    );

    if (nullCount > 0) {
      console.log(`\n警告: 还有 ${nullCount} 条记录没有设置卷号`);
    } else {
      console.log('\n✅ 所有记录都已设置卷号');
    }

  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    process.exit(0);
  }
}

updateVolumes();
