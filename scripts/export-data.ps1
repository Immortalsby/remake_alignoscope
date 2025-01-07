# 获取当前时间戳
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# 创建备份目录
$backupDir = "./backups"
New-Item -ItemType Directory -Force -Path $backupDir

# 导出数据库结构
Write-Host "Exporting database schema..."
docker exec alignoscope-db pg_dump -U alignoscope -d alignoscope --schema-only | Out-File -Encoding UTF8 "$backupDir/schema_$timestamp.sql"

# 导出数据
Write-Host "Exporting database data..."
docker exec alignoscope-db pg_dump -U alignoscope -d alignoscope --data-only | Out-File -Encoding UTF8 "$backupDir/data_$timestamp.sql"

# 合并为单个文件
Write-Host "Merging files..."
Get-Content "$backupDir/schema_$timestamp.sql", "$backupDir/data_$timestamp.sql" | Set-Content -Encoding UTF8 "$backupDir/full_backup_$timestamp.sql"

Write-Host "Backup completed: $backupDir/full_backup_$timestamp.sql" 