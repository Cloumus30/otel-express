Write-Host "Sending API requests..."

$res1 = Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get
Write-Host "GET / :" ($res1 | ConvertTo-Json -Compress)

$res2 = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Get
Write-Host "GET /api/users :" ($res2 | ConvertTo-Json -Compress)

$rnd = Get-Random
$body = @{
    name = "Alice Zipkin"
    username = "alice_$rnd"
    email = "alice_$rnd@example.com"
    password = "password123"
} | ConvertTo-Json

$res3 = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Post -Body $body -ContentType "application/json"
Write-Host "POST /api/users :" ($res3 | ConvertTo-Json -Compress)

try {
    Invoke-RestMethod -Uri "http://localhost:3000/test-error" -Method Get
} catch {
    Write-Host "GET /test-error (Expected 500 error recorded)"
}

Start-Sleep -Seconds 2

Write-Host "`n--- Checking Zipkin Services ---"
$services = Invoke-RestMethod -Uri "http://localhost:9411/api/v2/services" -Method Get
Write-Host "Zipkin Services:" ($services | ConvertTo-Json)

Write-Host "`n--- Checking Zipkin Traces for user-crud-service ---"
$traces = Invoke-RestMethod -Uri "http://localhost:9411/api/v2/traces?serviceName=user-crud-service&limit=5" -Method Get
Write-Host "Found Traces Count:" $traces.Count
$traces | ConvertTo-Json -Depth 3
