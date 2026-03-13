@echo off
echo Running dashboard performance optimization migration...

REM Check if supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Supabase CLI not found. Please install it first:
    echo npm install -g supabase
    pause
    exit /b 1
)

REM Run the migration
supabase db push --db-url "postgresql://postgres:your_password@db.awkmzllzstmphnzlygzu.supabase.co:5432/postgres"

echo Migration completed!
pause
