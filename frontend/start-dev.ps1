# Kill any existing processes on port 3000
$processes = netstat -ano | findstr :3000 | ForEach-Object { ($_ -split '\s+')[4] } | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
foreach ($pid in $processes) {
    if ($pid -and $pid -ne "0") {
        Write-Host "Killing process $pid on port 3000"
        taskkill /PID $pid /F 2>$null
    }
}

# Clear Next.js cache
Write-Host "Clearing Next.js cache..."
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Start development server
Write-Host "Starting development server on port 3000..."
npm run dev