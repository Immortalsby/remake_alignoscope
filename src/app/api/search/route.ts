import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { headers } from 'next/headers';

// 使用 Node.js 的压缩
import { gzip } from 'zlib';
import { promisify } from 'util';
const gzipAsync = promisify(gzip);

// 简单的内存缓存
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export async function POST(request: Request) {
  try {
    const acceptEncoding = request.headers.get('accept-encoding')?.toLowerCase() || '';

    // 检查缓存是否有效
    if (cachedData && (Date.now() - cacheTime) < CACHE_DURATION) {
      console.log('Using cached data');
      return createResponse(cachedData, acceptEncoding);
    }

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

    // 更新缓存
    cachedData = response;
    cacheTime = Date.now();

    return createResponse(response, acceptEncoding);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function createResponse(data: any, acceptEncoding: string) {
  const jsonData = JSON.stringify(data);

  // 如果客户端支持gzip压缩，则使用压缩
  if (acceptEncoding.includes('gzip')) {
    const compressedData = await gzipAsync(Buffer.from(jsonData));
    return new NextResponse(compressedData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'Cache-Control': 'public, max-age=300',
        'Vary': 'Accept-Encoding'
      }
    });
  }

  // 不支持压缩的情况
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Vary': 'Accept-Encoding'
    }
  });
}
