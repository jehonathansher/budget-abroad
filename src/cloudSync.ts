import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { Trip } from './types'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

const SYNC_CODE_KEY = 'budget-sync-code'

export function getSyncCode(): string | null {
  return localStorage.getItem(SYNC_CODE_KEY)
}

export function setSyncCode(code: string) {
  localStorage.setItem(SYNC_CODE_KEY, code)
}

export function clearSyncCode() {
  localStorage.removeItem(SYNC_CODE_KEY)
}

export function generateSyncCode(): string {
  // 6 uppercase letters + 2 digits, easy to type
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // no I, O to avoid confusion
  const digits = '23456789' // no 0, 1
  let code = ''
  for (let i = 0; i < 6; i++) code += letters[Math.floor(Math.random() * letters.length)]
  for (let i = 0; i < 2; i++) code += digits[Math.floor(Math.random() * digits.length)]
  return code
}

export async function pushTrips(code: string, trips: Trip[]): Promise<void> {
  await setDoc(doc(db, 'sync', code), { trips, updatedAt: Date.now() })
}

export async function pullTrips(code: string): Promise<Trip[] | null> {
  const snap = await getDoc(doc(db, 'sync', code))
  if (!snap.exists()) return null
  return snap.data().trips ?? []
}

export function subscribeToTrips(code: string, onUpdate: (trips: Trip[]) => void): Unsubscribe {
  return onSnapshot(doc(db, 'sync', code), (snap) => {
    if (snap.exists()) onUpdate(snap.data().trips ?? [])
  })
}
