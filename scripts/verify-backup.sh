#!/bin/bash

# Supabase Backup Verification Script
# This script verifies the integrity and completeness of database backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <backup_file>${NC}"
    echo "Example: $0 backups/fitness_app_backup_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

echo "========================================="
echo "Backup Verification Tool"
echo "========================================="
echo ""

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}ERROR: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Backup file exists: $BACKUP_FILE"

# Decompress if needed
VERIFY_FILE=""
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Decompressing backup for verification..."
    gunzip -c "$BACKUP_FILE" > /tmp/backup_verify.sql
    VERIFY_FILE="/tmp/backup_verify.sql"
    echo -e "${GREEN}✓${NC} Backup decompressed successfully"
else
    VERIFY_FILE="$BACKUP_FILE"
fi

# Check file size
FILE_SIZE=$(stat -f%z "$VERIFY_FILE" 2>/dev/null || stat -c%s "$VERIFY_FILE" 2>/dev/null)
FILE_SIZE_HUMAN=$(numfmt --to=iec-i --suffix=B $FILE_SIZE 2>/dev/null || echo "$FILE_SIZE bytes")

echo ""
echo "File Information:"
echo "  Size: $FILE_SIZE_HUMAN"

if [ "$FILE_SIZE" -lt 1000 ]; then
    echo -e "${RED}✗ ERROR: Backup file is too small ($FILE_SIZE bytes)${NC}"
    rm -f /tmp/backup_verify.sql
    exit 1
fi

echo -e "${GREEN}✓${NC} File size is acceptable"

# Check for SQL syntax errors
echo ""
echo "Checking SQL syntax..."
if grep -q "^--" "$VERIFY_FILE" && grep -q "PostgreSQL database dump" "$VERIFY_FILE"; then
    echo -e "${GREEN}✓${NC} Valid PostgreSQL dump format detected"
else
    echo -e "${YELLOW}⚠${NC} Warning: May not be a standard PostgreSQL dump"
fi

# Check for critical tables
echo ""
echo "Verifying critical tables..."
REQUIRED_TABLES=("transformation_plans" "progress_tracking")
MISSING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
    if grep -q "CREATE TABLE.*$table" "$VERIFY_FILE"; then
        echo -e "${GREEN}✓${NC} Table found: $table"
    else
        echo -e "${RED}✗${NC} Table missing: $table"
        MISSING_TABLES+=("$table")
    fi
done

# Check for indexes
echo ""
echo "Verifying indexes..."
if grep -q "CREATE INDEX" "$VERIFY_FILE"; then
    INDEX_COUNT=$(grep -c "CREATE INDEX" "$VERIFY_FILE")
    echo -e "${GREEN}✓${NC} Found $INDEX_COUNT indexes"
else
    echo -e "${YELLOW}⚠${NC} Warning: No indexes found in backup"
fi

# Check for RLS policies
echo ""
echo "Verifying Row Level Security policies..."
if grep -q "CREATE POLICY" "$VERIFY_FILE"; then
    POLICY_COUNT=$(grep -c "CREATE POLICY" "$VERIFY_FILE")
    echo -e "${GREEN}✓${NC} Found $POLICY_COUNT RLS policies"
else
    echo -e "${YELLOW}⚠${NC} Warning: No RLS policies found in backup"
fi

# Check for functions
echo ""
echo "Verifying database functions..."
if grep -q "CREATE FUNCTION" "$VERIFY_FILE" || grep -q "CREATE OR REPLACE FUNCTION" "$VERIFY_FILE"; then
    FUNCTION_COUNT=$(grep -c "CREATE.*FUNCTION" "$VERIFY_FILE")
    echo -e "${GREEN}✓${NC} Found $FUNCTION_COUNT functions"
else
    echo -e "${YELLOW}⚠${NC} Warning: No functions found in backup"
fi

# Check for data
echo ""
echo "Verifying data presence..."
if grep -q "COPY.*FROM stdin" "$VERIFY_FILE" || grep -q "INSERT INTO" "$VERIFY_FILE"; then
    echo -e "${GREEN}✓${NC} Data statements found in backup"
else
    echo -e "${YELLOW}⚠${NC} Warning: No data found in backup (may be schema-only)"
fi

# Cleanup
rm -f /tmp/backup_verify.sql

# Final verdict
echo ""
echo "========================================="
if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ VERIFICATION PASSED${NC}"
    echo "Backup appears to be valid and complete"
    exit 0
else
    echo -e "${RED}✗ VERIFICATION FAILED${NC}"
    echo "Missing tables: ${MISSING_TABLES[*]}"
    exit 1
fi
