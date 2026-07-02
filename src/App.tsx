import { useState } from 'react'
import { AppContext, loadTrips, saveTrips } from './store'
import type { Trip } from './types'
import Dashboard from './views/Dashboard'
import TripDetail from './views/TripDetail'

export default function App() {
  const [trips, setTripsState] = useState<Trip[]>(loadTrips)
  const [currentTripId, setCurrentTripId] = useState<string | null>(null)

  function setTrips(t: Trip[]) { setTripsState(t); saveTrips(t) }
  function addTrip(trip: Trip) { setTrips([...trips, trip]) }
  function updateTrip(trip: Trip) { setTrips(trips.map(t => t.id === trip.id ? trip : t)) }
  function deleteTrip(id: string) { setTrips(trips.filter(t => t.id !== id)) }

  const currentTrip = trips.find(t => t.id === currentTripId) ?? null

  return (
    <AppContext.Provider value={{ trips, setTrips, addTrip, updateTrip, deleteTrip }}>
      <div className="max-w-lg mx-auto min-h-svh">
        {currentTrip
          ? <TripDetail trip={currentTrip} onBack={() => setCurrentTripId(null)} />
          : <Dashboard onSelectTrip={setCurrentTripId} />
        }
      </div>
    </AppContext.Provider>
  )
}
