import { useState } from 'react'
import { Plus, Plane, Trash2, Cloud, CloudOff } from 'lucide-react'
import { useApp, tripRemainingBudget, tripTotalSpentHome } from '../store'
import type { Trip } from '../types'
import type { SyncStatus } from '../cloudSync'
import NewTripSheet from '../components/NewTripSheet'

interface Props {
  onSelectTrip: (id: string) => void
  onOpenSync: () => void
  syncStatus: SyncStatus
  syncEnabled: boolean
}

export default function Dashboard({ onSelectTrip, onOpenSync, syncStatus, syncEnabled }: Props) {
  const { trips, deleteTrip } = useApp()
  const [showNew, setShowNew] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  return (
    <div className="min-h-svh bg-[#f2f2f7]">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
        <button onClick={onOpenSync} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-sm text-sm font-medium">
          {syncEnabled
            ? <><Cloud size={15} className={syncStatus === 'syncing' ? 'text-blue-400 animate-pulse' : 'text-green-500'} /> Sync</>
            : <><CloudOff size={15} className="text-gray-400" /> Sync</>
          }
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 gap-4 px-6">
          <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center">
            <Plane className="text-blue-500" size={36} />
          </div>
          <p className="text-gray-500 text-center text-base">No trips yet. Create one to start tracking your budget.</p>
          <button
            onClick={() => setShowNew(true)}
            className="mt-2 bg-blue-500 text-white font-semibold px-8 py-3 rounded-2xl text-base"
          >
            Create Trip
          </button>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3 pb-24">
          {trips.map(trip => <TripCard key={trip.id} trip={trip} onSelect={onSelectTrip} onDelete={() => setDeletingId(trip.id)} />)}
        </div>
      )}

      {/* FAB */}
      {trips.length > 0 && (
        <button
          onClick={() => setShowNew(true)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-full shadow-lg flex items-center gap-2 text-base"
        >
          <Plus size={20} />
          New Trip
        </button>
      )}

      {showNew && <NewTripSheet onClose={() => setShowNew(false)} />}

      {deletingId && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-8">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-semibold text-lg text-center mb-1">Delete Trip?</h3>
            <p className="text-gray-500 text-sm text-center mb-5">This will delete all expenses and cannot be undone.</p>
            <button
              onClick={() => { deleteTrip(deletingId!); setDeletingId(null) }}
              className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl mb-2"
            >Delete</button>
            <button
              onClick={() => setDeletingId(null)}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl"
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TripCard({ trip, onSelect, onDelete }: { trip: Trip; onSelect: (id: string) => void; onDelete: () => void }) {
  const spent = tripTotalSpentHome(trip)
  const remaining = tripRemainingBudget(trip)
  const progress = trip.totalBudget > 0 ? Math.min(spent / trip.totalBudget, 1) : 0
  const isOver = remaining < 0

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" onClick={() => onSelect(trip.id)}>
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-5 pt-4 pb-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{trip.name}</h2>
            <p className="text-blue-100 text-sm mt-0.5">{trip.foreignCurrency} · {formatDate(trip.startDate)} – {formatDate(trip.endDate)}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <Trash2 size={14} className="text-white" />
          </button>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-blue-100 mb-1">
            <span>{trip.homeCurrency} {fmt(spent)} spent</span>
            <span className={isOver ? 'text-red-300 font-bold' : ''}>
              {isOver ? `${trip.homeCurrency} ${fmt(Math.abs(remaining))} over` : `${trip.homeCurrency} ${fmt(remaining)} left`}
            </span>
          </div>
          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isOver ? 'bg-red-400' : 'bg-white'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function fmt(n: number) { return Math.round(n).toLocaleString() }
function formatDate(s: string) {
  if (!s) return ''
  const d = new Date(s)
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
