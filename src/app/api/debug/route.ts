import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT id, lang0, lang1, volume, position FROM texts WHERE id = 19'
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No data found' });
    }
    
    const row = result.rows[0];
    return NextResponse.json({
      data: row,
      lang0_full: row.lang0,
      lang1_full: row.lang1
    });
  } catch (error) {
    console.error('Debug query error:', error);
    return NextResponse.json({ error: 'Query failed', details: error }, { status: 500 });
  }
} 