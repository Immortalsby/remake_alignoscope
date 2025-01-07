# 获取当前时间戳
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# 创建备份目录
$backupDir = "./backups"
New-Item -ItemType Directory -Force -Path $backupDir

# 导出完整的数据库备份（包含模式和数据）
Write-Host "Exporting complete database backup..."
docker exec alignoscope-db pg_dump -U alignoscope -d alignoscope `
    --clean `                    # 添加删除已存在对象的命令
    --if-exists `               # 添加 IF EXISTS 检查
    --create `                  # 包含创建数据库的命令
    --format=p `                # 使用纯文本格式
    --inserts `                 # 使用 INSERT 命令而不是 COPY
    --quote-all-identifiers `   # 给所有标识符加引号
    --encoding=UTF8 | Out-File -Encoding UTF8 "$backupDir/full_backup_$timestamp.sql"

Write-Host "Backup completed: $backupDir/full_backup_$timestamp.sql" 