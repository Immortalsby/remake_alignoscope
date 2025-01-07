#!/bin/bash

# 检查参数
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE=$1

# 检查文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file $BACKUP_FILE does not exist"
    exit 1
fi

# 导入数据
echo "Importing database backup..."
docker exec -i alignoscope-db psql -U alignoscope -d alignoscope < $BACKUP_FILE

echo "Import completed" 