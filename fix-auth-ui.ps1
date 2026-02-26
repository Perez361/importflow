# Fix auth UI - enhance login/register forms

# Update auth layout with enhanced background
$authLayout = Get-Content 'app/(auth)/layout.tsx' -Raw

# Replace the background effects with enhanced version
$authLayout = $authLayout -replace 'className="min-h-screen flex relative overflow-hidden"', 'className="min-h-screen flex relative overflow-hidden bg-background"'
$authLayout = $authLayout -replace '<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-cyan-500/5" />', '<div className="absolute inset-0 mesh-gradient-light" />'

$authLayout | Set-Content 'app/(auth)/layout.tsx' -NoNewline
Write-Host "Updated auth layout"

# Update login form with enhanced styling
$loginForm = Get-Content 'app/(auth)/login/page.tsx' -Raw

# Update card styling
$loginForm = $loginForm -replace 'className="card p-8 shadow-soft-xl animate-scale-in"', 'className="glass-gradient p-8 rounded-2xl shadow-soft-xl animate-scale-in"'

# Update form input styling  
$loginForm = $loginForm -replace 'className="input-with-icon"', 'className="input-with-icon bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"'

# Update primary button styling
$loginForm = $loginForm -replace 'className="btn btn-primary w-full group"', 'className="btn btn-primary btn-lg w-full group shine-effect"'

$loginForm | Set-Content 'app/(auth)/login/page.tsx' -NoNewline
Write-Host "Updated login form"

Write-Host "Auth UI enhancements applied!"
