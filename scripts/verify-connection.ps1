$ErrorActionPreference = "Stop"

function Test-Port {
    param($Port)
    try {
        $tcp = New-Object Net.Sockets.TcpClient
        $tcp.Connect("localhost", $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

Write-Host "Verifying AxonRH Connection..." -ForegroundColor Cyan

# 1. Check Frontend Port (3000)
if (Test-Port 3000) {
    Write-Host "[OK] Frontend is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend is NOT reachable on port 3000" -ForegroundColor Red
}

# 2. Check Backend Gateway Port (8080)
if (Test-Port 8080) {
    Write-Host "[OK] Backend API Gateway is running on port 8080" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend API Gateway is NOT reachable on port 8080" -ForegroundColor Red
}

# 3. Check Health Endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Backend Health Endpoint is reachable (200 OK)" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] Backend Health Endpoint returned $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Could not connect to Backend Health Endpoint: $($_.Exception.Message)" -ForegroundColor Red
}
