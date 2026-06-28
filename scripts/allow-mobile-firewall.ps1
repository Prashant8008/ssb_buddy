# Run as Administrator: right-click → "Run with PowerShell" (or run in an elevated terminal).
# Allows your phone on the same Wi‑Fi to reach the Vite + Django dev servers.

$ErrorActionPreference = 'Stop'

$rules = @(
    @{ Name = 'SSB Connect Vite 5173'; Port = 5173 },
    @{ Name = 'SSB Connect Django 8001'; Port = 8001 }
)

foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Rule already exists: $($r.Name)"
        continue
    }
    New-NetFirewallRule `
        -DisplayName $r.Name `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $r.Port `
        -Profile Private `
        | Out-Null
    Write-Host "Added firewall rule: $($r.Name) (TCP $($r.Port), Private network)"
}

$wifiIp = (
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -match '^192\.168\.' -or $_.IPAddress -match '^10\.'
    } |
    Select-Object -First 1
).IPAddress

Write-Host ''
Write-Host 'On your phone (same Wi‑Fi, not mobile data), open:'
if ($wifiIp) {
    Write-Host "  http://${wifiIp}:5173/"
} else {
    Write-Host '  http://<your-pc-wifi-ip>:5173/'
    Write-Host '  (Run ipconfig and use the 192.168.x.x address)'
}
Write-Host ''
Write-Host 'Press Enter to close.'
Read-Host
