import { useState, useEffect, useRef } from 'react'
import { AppContext, loadTrips, saveTrips } from './store'
import type { Trip } from './types'
import Dashboard from './views/Dashboard'
import TripDetail from './views/TripDetail'
import SyncSheet from './components/SyncSheet'
import {
  getSyncCode, setSyncCode, clearSyncCode,
  generateSyncCode, pushTrips, pullTrips, subscribeToTrips,
  type SyncStatus
} from './cloudSync'

const FIREBASE_CONFIGURED = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
)

export default function App() {
  const [trips, setTripsState] = useState<Trip[]>(loadTrips)
  const [currentTripId, setCurrentTripId] = useState<string | null>(null)
  const [syncCode, setSyncCodeState] = useState<string | null>(getSyncCode)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [showSync, setShowSync] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)
  const skipNextPush = useRef(false)

  function setTrips(t: Trip[], push = true) {
    setTripsState(t)
    saveTrips(t)
    if (FIREBASE_CONFIGURED && push && syncCode && !skipNextPush.current) {
      setSyncStatus('syncing')
      pushTrips(syncCode, t)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'))
    }
    skipNextPush.current = false
  }

  // Subscribe to real-time updates when sync code is set
  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !syncCode) return
    unsubRef.current?.()
    unsubRef.current = subscribeToTrips(syncCode, (remote) => {
      skipNextPush.current = true
      setTripsState(remote)
      saveTrips(remote)
      setSyncStatus('synced')
    })
    return () => { unsubRef.current?.(); unsubRef.current = null }
  }, [syncCode])

  async function activateCode(code: string) {
    setSyncStatus('syncing')
    setSyncCode(code)
    setSyncCodeState(code)
    try {
      const remote = await pullTrips(code)
      if (remote && remote.length > 0) {
        skipNextPush.current = true
        setTripsState(remote)
        saveTrips(remote)
      } else {
        // New code — push local data up
        await pushTrips(code, trips)
      }
      setSyncStatus('synced')
    } catch {
      setSyncStatus('error')
    }
  }

  async function createNewCode() {
    const code = generateSyncCode()
    await activateCode(code)
    return code
  }

  function disconnectSync() {
    unsubRef.current?.()
    clearSyncCode()
    setSyncCodeState(null)
    setSyncStatus('idle')
  }

  function addTrip(trip: Trip) { setTrips([...trips, trip]) }
  function updateTrip(trip: Trip) { setTrips(trips.map(t => t.id === trip.id ? trip : t)) }
  function deleteTrip(id: string) { setTrips(trips.filter(t => t.id !== id)) }

  const currentTrip = trips.find(t => t.id === currentTripId) ?? null

  return (
    <AppContext.Provider value={{ trips, setTrips, addTrip, updateTrip, deleteTrip }}>
      <div className="max-w-lg mx-auto min-h-svh">
        {currentTrip
          ? <TripDetail trip={currentTrip} onBack={() => setCurrentTripId(null)} />
          : <Dashboard
              onSelectTrip={setCurrentTripId}
              onOpenSync={() => setShowSync(true)}
              syncStatus={syncStatus}
              syncEnabled={FIREBASE_CONFIGURED && !!syncCode}
            />
        }
      </div>
      {showSync && (
        <SyncSheet
          currentCode={syncCode}
          syncStatus={syncStatus}
          firebaseConfigured={FIREBASE_CONFIGURED}
          onCreateCode={createNewCode}
          onJoinCode={activateCode}
          onDisconnect={disconnectSync}
          onClose={() => setShowSync(false)}
        />
      )}
    </AppContext.Provider>
  )
}
