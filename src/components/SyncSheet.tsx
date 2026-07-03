import { useState } from 'react'
import { Cloud, CloudOff, Copy, Check } from 'lucide-react'
import type { SyncStatus } from '../cloudSync'

interface Props {
  currentCode: string | null
  syncStatus: SyncStatus
  firebaseConfigured: boolean
  onCreateCode: () => Promise<string>
  onJoinCode: (code: string) => Promise<void>
  onDisconnect: () => void
  onClose: () => void
}

export default function SyncSheet({ currentCode, syncStatus, firebaseConfigured, onCreateCode, onJoinCode, onDisconnect, onClose }: Props) {
  const [inputCode, setInputCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [newCode, setNewCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setLoading(true); setError('')
    try { const code = await onCreateCode(); setNewCode(code) }
    catch { setError('Failed to create sync. Try again.') }
    finally { setLoading(false) }
  }

  async function handleJoin() {
    const code = inputCode.trim().toUpperCase()
    if (code.length < 6) { setError('Enter a valid sync code'); return }
    setLoading(true); setError('')
    try { await onJoinCode(code) }
    catch { setError('Code not found or connection failed.') }
    finally { setLoading(false) }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  if (!firebaseConfigured) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl p-6 pb-10">
          <div className="flex justify-center mb-1"><div className="w-9 h-1 bg-gray-300 rounded-full" /></div>
          <div className="flex items-center gap-3 mt-4 mb-3">
            <CloudOff className="text-gray-400" size={28} />
            <h2 className="font-bold text-lg">Sync Not Configured</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            To enable cross-device sync, the app needs a Firebase project. Follow the setup guide at the GitHub repo, or ask Claude to set it up for you.
          </p>
          <button onClick={onClose} className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl pb-10 overflow-hidden">
        <div className="flex justify-center pt-3 pb-2"><div className="w-9 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="font-bold text-lg">Sync Across Devices</h2>
          <button onClick={onClose} className="text-blue-500 font-medium">Done</button>
        </div>

        <div className="px-5 flex flex-col gap-4">
          {currentCode ? (
            // Already synced
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-green-600 font-medium">
                  {syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'error' ? 'Sync error' : 'Synced'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-3">
                <p className="text-xs text-gray-400 mb-1">Your sync code</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold tracking-widest text-gray-900">{currentCode}</p>
                  <button onClick={() => copyCode(currentCode)} className="flex items-center gap-1 text-blue-500 text-sm font-medium">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Open the app on any device, tap Sync, and enter this code to access your data.
              </p>

              <button onClick={onDisconnect} className="w-full bg-gray-100 text-red-500 font-semibold py-3 rounded-xl text-sm">
                Disconnect Sync
              </button>
            </div>
          ) : newCode ? (
            // Just created a code
            <div>
              <p className="text-sm text-gray-500 mb-3">Your data is now synced. Use this code on other devices:</p>
              <div className="bg-blue-50 rounded-2xl p-4 mb-3">
                <p className="text-xs text-blue-400 mb-1">Sync code</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold tracking-widest text-blue-700">{newCode}</p>
                  <button onClick={() => copyCode(newCode)} className="flex items-center gap-1 text-blue-500 text-sm font-medium">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">Write it down or copy it — you'll need it to sync other devices.</p>
            </div>
          ) : (
            // Not synced yet
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-blue-50 rounded-2xl p-4">
                <Cloud className="text-blue-400 flex-shrink-0" size={24} />
                <p className="text-sm text-gray-600">Sync your data across all your devices with a simple code.</p>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-blue-500 text-white font-semibold py-3.5 rounded-2xl disabled:opacity-50"
              >
                {loading ? 'Setting up…' : 'Start Syncing (new code)'}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <p className="text-xs text-gray-400">or join existing</p>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="flex gap-2">
                <input
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Enter sync code"
                  maxLength={10}
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm font-mono tracking-widest"
                />
                <button
                  onClick={handleJoin}
                  disabled={loading || !inputCode.trim()}
                  className="bg-gray-800 text-white font-semibold px-5 py-3 rounded-xl disabled:opacity-40"
                >
                  Join
                </button>
              </div>

              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
