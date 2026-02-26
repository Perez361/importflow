# Fix notification dropdown mobile positioning
$content = Get-Content 'components/layout/header.tsx' -Raw
$old = 'className="absolute right-2 mt-2 w-[calc(100vw-16px)] sm:w-80 bg-card rounded-xl shadow-soft-lg border border-border py-2 z-50 animate-scale-in"'
$new = 'className="absolute right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 mt-2 w-[calc(100vw-16px)] sm:w-80 max-w-[360px] bg-card rounded-xl shadow-soft-lg border border-border py-2 z-50 animate-scale-in"'
$content = $content -replace $old, $new
$content | Set-Content 'components/layout/header.tsx' -NoNewline
Write-Host "Fixed notification dropdown"
