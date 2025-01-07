// src/lib/db/migrate.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS texts (
        id SERIAL PRIMARY KEY,
        lang0 TEXT NOT NULL,
        lang1 TEXT NOT NULL,
        volume INTEGER,
        position INTEGER,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS texts_volume_position_idx 
        ON texts(volume, position);
        
      CREATE INDEX IF NOT EXISTS texts_lang0_gin_idx 
        ON texts USING gin(to_tsvector('french', lang0));
        
      CREATE INDEX IF NOT EXISTS texts_lang1_gin_idx 
        ON texts USING gin(to_tsvector('simple', lang1));
    `);
  } finally {
    client.release();
  }
}

async function importData(filePath: string) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const item of data) {
      await client.query(
        `INSERT INTO texts (lang0, lang1, volume, position) 
         VALUES ($1, $2, $3, $4)`,
        [item.lang0, item.lang1, item.volume, item.position]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}