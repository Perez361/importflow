# Fix super-admin layout - sidebar mobile
$content = Get-Content 'app/(super-admin)/layout.tsx' -Raw

# Add responsive classes to sidebar
$content = $content -replace 'className=\( `\s*fixed lg:relative z-50 bg-card border-r border-border transition-transform duration-300 h-\[calc\(100vh-64px\)\] top-16\s*w-64', 'className=` fixed lg:relative z-50 bg-card border-r border-border transition-transform duration-300 h-[calc(100vh-64px)] top-16 w-64 md:w-56'

Set-Content 'app/(super-admin)/layout.tsx' -Value $content
Write-Host "Fixed super-admin layout"

# Fix header notifications dropdown alignment
$headerContent = Get-Content 'components/layout/header.tsx' -Raw
$headerContent = $headerContent -replace 'className="absolute right-0 mt-2 w-\[calc\(100vw-32px\)\] sm:w-80 bg-card rounded-xl shadow-soft-lg border border-border py-2 z-50 animate-scale-in"', 'className="absolute right-2 mt-2 w-[calc(100vw-16px)] sm:w-80 bg-card rounded-xl shadow-soft-lg border border-border py-2 z-50 animate-scale-in"'

Set-Content 'components/layout/header.tsx' -Value $headerContent
Write-Host "Fixed header notifications"

# Fix admin dashboard table text overflow
$adminContent = Get-Content 'app/(super-admin)/admin/page.tsx' -Raw
$adminContent = $adminContent -replace '<p className="font-medium">{importer.business_name}</p>', '<p className="font-medium truncate max-w-[120px] sm:max-w-none">{importer.business_name}</p>'
$adminContent = $adminContent -replace '<p className="text-sm text-muted-foreground">/{importer.slug}</p>', '<p className="text-sm text-muted-foreground truncate max-w-[100px]">/{importer.slug}</p>'

Set-Content 'app/(super-admin)/admin/page.tsx' -Value $adminContent
Write-Host "Fixed admin dashboard table"

Write-Host "All fixes applied!"
