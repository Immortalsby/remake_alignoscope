#!/bin/bash

# 获取当前时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# 导出完整的数据库备份（包含模式和数据）
echo "Exporting complete database backup..."
docker exec alignoscope-db pg_dump -U alignoscope -d alignoscope \
    --clean \
    --if-exists \
    --create \
    --format=p \
    --inserts \
    --quote-all-identifiers \
    --encoding=UTF8 > "$BACKUP_DIR/full_backup_$TIMESTAMP.sql"

echo "Backup completed: $BACKUP_DIR/full_backup_$TIMESTAMP.sql" 