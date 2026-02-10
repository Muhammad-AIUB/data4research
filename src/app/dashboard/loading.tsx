export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-6 animate-pulse">
      <div className="max-w-5xl mx-auto">
        <div className="h-8 bg-slate-200 rounded-lg w-48 mb-6" />
        <div className="bg-white/90 rounded-2xl shadow-lg border border-blue-100 p-6 mb-6">
          <div className="h-12 bg-slate-200 rounded-xl w-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/95 rounded-2xl shadow-md border border-blue-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-40" />
                  <div className="h-4 bg-slate-100 rounded w-64" />
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-24 bg-slate-200 rounded-lg" />
                  <div className="h-9 w-9 bg-slate-200 rounded-lg" />
                  <div className="h-9 w-9 bg-slate-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
