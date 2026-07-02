import { createContext, useContext } from 'react'
import type { Trip, SubBudget } from './types'

const STORAGE_KEY = 'budget-abroad-v1'

export function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveTrips(trips: Trip[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
}

export function uid(): string {
  return crypto.randomUUID()
}

// Trip helpers
export function tripTotalSpentHome(trip: Trip): number {
  return trip.expenses
    .filter(e => !e.isOutsideBudget)
    .reduce((s, e) => s + e.amountInHome, 0)
}

export function tripRemainingBudget(trip: Trip): number {
  return trip.totalBudget - tripTotalSpentHome(trip)
}

export function tripOutsideBudgetTotal(trip: Trip): number {
  return trip.expenses
    .filter(e => e.isOutsideBudget)
    .reduce((s, e) => s + e.amountInHome, 0)
}

export function tripActualCost(trip: Trip): number {
  return trip.expenses.reduce((s, e) => s + e.amountInHome, 0)
}

export function tripCappedAllocations(trip: Trip): number {
  return trip.subBudgets.filter(s => s.isCapped).reduce((sum, s) => sum + s.allocatedAmount, 0)
}

export function tripFreePool(trip: Trip): number {
  return Math.max(trip.totalBudget - tripCappedAllocations(trip), 0)
}

export function spentForSubBudget(trip: Trip, sub: SubBudget): number {
  return trip.expenses
    .filter(e => !e.isOutsideBudget && e.subBudgetId === sub.id)
    .reduce((s, e) => s + e.amountInHome, 0)
}

export function tripUncappedSpent(trip: Trip): number {
  const uncapped = trip.subBudgets.filter(s => !s.isCapped)
  return uncapped.reduce((s, sub) => s + spentForSubBudget(trip, sub), 0)
}

export function tripFreePoolRemaining(trip: Trip): number {
  return tripFreePool(trip) - tripUncappedSpent(trip)
}

// Context
export interface AppContextType {
  trips: Trip[]
  setTrips: (trips: Trip[]) => void
  addTrip: (trip: Trip) => void
  updateTrip: (trip: Trip) => void
  deleteTrip: (id: string) => void
}

export const AppContext = createContext<AppContextType>(null!)
export const useApp = () => useContext(AppContext)
