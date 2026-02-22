#!/bin/bash

# Supabase Database Backup Script
# This script creates automated backups of the Supabase database
# and manages backup retention

set -e  # Exit on error

# Configuration
PROJECT_REF="${SUPABASE_PROJECT_REF:-your-project-ref}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fitness_app_backup_$DATE.sql"
LOG_FILE="$BACKUP_DIR/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI is not installed. Please install it first:"
    log_error "npm install -g supabase"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Start backup process
log "Starting database backup..."
log "Project: $PROJECT_REF"
log "Backup file: $BACKUP_FILE"

# Perform backup
if supabase db dump -f "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Database dump completed successfully"
    
    # Check if backup file exists and has content
    if [ -f "$BACKUP_FILE" ]; then
        FILE_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
        
        if [ "$FILE_SIZE" -lt 1000 ]; then
            log_error "Backup file is suspiciously small ($FILE_SIZE bytes)"
            exit 1
        fi
        
        log "Backup file size: $(numfmt --to=iec-i --suffix=B $FILE_SIZE 2>/dev/null || echo "$FILE_SIZE bytes")"
        
        # Compress backup
        log "Compressing backup..."
        if gzip "$BACKUP_FILE"; then
            log_success "Backup compressed: $BACKUP_FILE.gz"
            COMPRESSED_SIZE=$(stat -f%z "$BACKUP_FILE.gz" 2>/dev/null || stat -c%s "$BACKUP_FILE.gz" 2>/dev/null)
            log "Compressed size: $(numfmt --to=iec-i --suffix=B $COMPRESSED_SIZE 2>/dev/null || echo "$COMPRESSED_SIZE bytes")"
        else
            log_error "Compression failed"
            exit 1
        fi
        
        # Verify backup integrity
        log "Verifying backup integrity..."
        if gunzip -t "$BACKUP_FILE.gz" 2>&1 | tee -a "$LOG_FILE"; then
            log_success "Backup integrity verified"
        else
            log_error "Backup integrity check failed"
            exit 1
        fi
        
        # Clean up old backups
        log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
        DELETED_COUNT=$(find "$BACKUP_DIR" -name "fitness_app_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
        
        if [ "$DELETED_COUNT" -gt 0 ]; then
            log "Deleted $DELETED_COUNT old backup(s)"
        else
            log "No old backups to delete"
        fi
        
        # List current backups
        log "Current backups:"
        find "$BACKUP_DIR" -name "fitness_app_backup_*.sql.gz" -type f -exec ls -lh {} \; | tee -a "$LOG_FILE"
        
        log_success "Backup process completed successfully"
        
        # Send success notification (optional)
        if [ -n "$WEBHOOK_URL" ]; then
            curl -X POST "$WEBHOOK_URL" \
                -H "Content-Type: application/json" \
                -d "{\"status\":\"success\",\"backup\":\"$BACKUP_FILE.gz\",\"size\":$COMPRESSED_SIZE}" \
                2>&1 | tee -a "$LOG_FILE"
        fi
        
        exit 0
    else
        log_error "Backup file was not created"
        exit 1
    fi
else
    log_error "Database dump failed"
    
    # Send failure notification (optional)
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"failed\",\"error\":\"Database dump failed\"}" \
            2>&1 | tee -a "$LOG_FILE"
    fi
    
    exit 1
fi
