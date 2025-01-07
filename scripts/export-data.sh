#!/bin/bash

# 获取当前时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# 导出数据库结构
echo "Exporting database schema..."
docker exec alignoscope-db pg_dump -U alignoscope -d alignoscope --schema-only > $BACKUP_DIR/schema_$TIMESTAMP.sql

# 导出数据
echo "Exporting database data..."
docker exec alignoscope-db pg_dump -U alignoscope -d alignoscope --data-only > $BACKUP_DIR/data_$TIMESTAMP.sql

# 合并为单个文件
echo "Merging files..."
cat $BACKUP_DIR/schema_$TIMESTAMP.sql $BACKUP_DIR/data_$TIMESTAMP.sql > $BACKUP_DIR/full_backup_$TIMESTAMP.sql

echo "Backup completed: $BACKUP_DIR/full_backup_$TIMESTAMP.sql" 