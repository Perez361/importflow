// Loading skeleton components for better UX

export function TableSkeleton({ 
  rows = 5, 
  columns = 5 
}: { 
  rows?: number 
  columns?: number 
}) {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="flex-1 h-4 bg-muted rounded animate-pulse" />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 p-4 border-b border-border">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={`cell-${rowIndex}-${colIndex}`} 
              className="flex-1 h-4 bg-muted rounded animate-pulse" 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="flex justify-between pt-2 border-t border-border">
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-xl animate-pulse" />
        <div>
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          <div className="h-3 w-20 bg-muted rounded animate-pulse mt-1" />
        </div>
      </div>
    </div>
  )
}

export function FormSkeleton({ 
  fields = 3 
}: { 
  fields?: number 
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
      ))}
      <div className="h-10 w-32 bg-muted rounded animate-pulse" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-3 w-48 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

export function ListSkeleton({ 
  items = 5 
}: { 
  items?: number 
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-8 h-8 bg-muted rounded animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      
      {/* Table */}
      <TableSkeleton rows={8} columns={5} />
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-muted rounded-lg animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSkeleton fields={4} />
        <FormSkeleton fields={4} />
      </div>
    </div>
  )
}

