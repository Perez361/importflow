$content = Get-Content 'app/page.tsx' -Raw
$content = $content -replace [regex]::Escape('className="badge-primary text-xs"'), 'className="badge-pro badge-pro-glow"'
Set-Content 'app/page.tsx' -Value $content
Write-Host "Done"
