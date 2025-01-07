-- 添加唯一约束
ALTER TABLE texts ADD CONSTRAINT texts_volume_position_unique UNIQUE (volume, position);

-- 添加检查约束
ALTER TABLE texts ADD CONSTRAINT texts_volume_check CHECK (volume >= 0);
ALTER TABLE texts ADD CONSTRAINT texts_position_check CHECK (position >= 0);

-- 添加注释
COMMENT ON TABLE texts IS '存储《约翰·克利斯朵夫》的中法对照文本';
COMMENT ON COLUMN texts.lang0 IS '法语原文';
COMMENT ON COLUMN texts.lang1 IS '中文译文';
COMMENT ON COLUMN texts.volume IS '卷号';
COMMENT ON COLUMN texts.position IS '在卷中的位置';
COMMENT ON COLUMN texts.metadata IS '额外元数据，如注释、标签等';
