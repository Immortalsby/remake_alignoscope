import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // 获取所有记录
    const { rows: results } = await query(
      'SELECT id, lang0, lang1, volume, position FROM texts ORDER BY volume, position'
    );
    console.log('Total records:', results.length);

    // 获取卷的数量
    const maxVolume = Math.max(...results.map(row => row.volume));

    const response = {
      total_blocks: results.length,
      total_volumes: maxVolume || 0,
      results
    };
    console.log('Response stats:', {
      total_blocks: response.total_blocks,
      total_volumes: response.total_volumes,
      results_count: response.results.length
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
