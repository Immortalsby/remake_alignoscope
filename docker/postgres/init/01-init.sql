-- 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建文本表
CREATE TABLE texts (
    id SERIAL PRIMARY KEY,
    lang0 TEXT NOT NULL,  -- 法语原文
    lang1 TEXT NOT NULL,  -- 中文译文
    volume INTEGER,       -- 卷号
    position INTEGER,     -- 在卷中的位置
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX texts_volume_position_idx ON texts(volume, position);
CREATE INDEX texts_lang0_gin_idx ON texts USING gin(to_tsvector('french', lang0));
CREATE INDEX texts_lang1_gin_idx ON texts USING gin(to_tsvector('simple', lang1));

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_texts_updated_at
    BEFORE UPDATE ON texts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
