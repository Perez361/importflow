# Update register page styling
$content = Get-Content 'app/(auth)/register/page.tsx' -Raw
$content = $content -replace 'className="card p-8 shadow-soft-xl animate-scale-in"', 'className="glass-gradient p-8 rounded-2xl shadow-soft-xl animate-scale-in"'
$content = $content -replace 'className="input-with-icon"', 'className="input-with-icon bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"'
$content = $content -replace 'className="btn btn-primary w-full group"', 'className="btn btn-primary btn-lg w-full group shine-effect"'
$content | Set-Content 'app/(auth)/register/page.tsx' -NoNewline
Write-Host "Updated register page"
