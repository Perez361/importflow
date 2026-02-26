# Fix the Recent Importers table for mobile
$content = Get-Content 'app/(super-admin)/admin/page.tsx' -Raw

# Replace the Recent Importers section with a fully responsive version
$oldSection = @'
      {/* Recent Importers */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Recent Importers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Business</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Subscription</th>
                <th className="text-left p-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : recentImporters.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    No importers yet
                  </td>
                </tr>
              ) : (
                recentImporters.map((importer) => (
                  <tr key={importer.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[120px] sm:max-w-none">{importer.business_name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[100px]">/{importer.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${importer.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {importer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        importer.subscription_status === 'active' ? 'badge-success' : 
                        importer.subscription_status === 'trial' ? 'badge-warning' : 
                        'badge-danger'
                      }`}>
                        {importer.subscription_status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(importer.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
'@

$newSection = @'
      {/* Recent Importers - Mobile Responsive Card Layout */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Recent Importers</h3>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Business</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Subscription</th>
                <th className="text-left p-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : recentImporters.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    No importers yet
                  </td>
                </tr>
              ) : (
                recentImporters.map((importer) => (
                  <tr key={importer.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{importer.business_name}</p>
                          <p className="text-sm text-muted-foreground">/{importer.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${importer.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {importer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        importer.subscription_status === 'active' ? 'badge-success' : 
                        importer.subscription_status === 'trial' ? 'badge-warning' : 
                        'badge-danger'
                      }`}>
                        {importer.subscription_status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {new Date(importer.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : recentImporters.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No importers yet
            </div>
          ) : (
            recentImporters.map((importer) => (
              <div key={importer.id} className="p-4 hover:bg-muted/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{importer.business_name}</p>
                      <p className="text-sm text-muted-foreground truncate">/{importer.slug}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`badge ${importer.is_active ? 'badge-success' : 'badge-danger'} text-xs`}>
                      {importer.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`badge ${
                      importer.subscription_status === 'active' ? 'badge-success' : 
                      importer.subscription_status === 'trial' ? 'badge-warning' : 
                      'badge-danger'
                    } text-xs`}>
                      {importer.subscription_status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(importer.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
'@

$content = $content -replace [regex]::Escape($oldSection), $newSection
$content | Set-Content 'app/(super-admin)/admin/page.tsx' -NoNewline
Write-Host "Fixed Recent Importers table for mobile"
