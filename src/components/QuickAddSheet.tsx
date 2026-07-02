import { useState, useEffect, useRef } from 'react'
import { convert } from '../exchange'
import { uid } from '../store'
import { emojiIcon } from '../views/TripDetail'
import { colorFromName } from '../colors'
import type { Trip, Expense, SubBudget } from '../types'

interface Props { trip: Trip; onAdd: (e: Expense) => void; onClose: () => void }

export default function QuickAddSheet({ trip, onAdd, onClose }: Props) {
  const [amountText, setAmountText] = useState('')
  const [note, setNote] = useState('')
  const [useHome, setUseHome] = useState(false)
  const [selectedCat, setSelectedCat] = useState<SubBudget | null>(null)
  const [isOutside, setIsOutside] = useState(false)
  const [converted, setConverted] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sorted = [...trip.subBudgets].sort((a, b) => a.sortOrder - b.sortOrder)
  const amount = parseFloat(amountText) || 0

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  useEffect(() => {
    if (useHome || !amount) { setConverted(null); return }
    convert(amount, trip.foreignCurrency, trip.homeCurrency).then(setConverted)
  }, [amountText, useHome])

  function add() {
    if (!amount) return
    const homeAmount = useHome ? amount : (converted ?? amount)
    onAdd({
      id: uid(), amount, currency: useHome ? trip.homeCurrency : trip.foreignCurrency,
      amountInHome: homeAmount, note, date: new Date().toISOString(),
      subBudgetId: selectedCat?.id, isOutsideBudget: isOutside,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full rounded-t-3xl overflow-hidden flex flex-col" style={{ maxHeight: '80svh' }}>
        <div className="flex justify-center pt-3 pb-2"><div className="w-9 h-1 bg-gray-300 rounded-full" /></div>
        <div className="px-5 pb-2"><p className="font-semibold text-base">Add Expense</p></div>

        <div className="overflow-y-auto flex-1 px-5 pb-safe flex flex-col gap-3">
          {/* Amount row */}
          <div className="flex gap-2 items-stretch">
            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="text-gray-400 font-medium text-sm">{useHome ? trip.homeCurrency : trip.foreignCurrency}</span>
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amountText}
                onChange={e => setAmountText(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-bold text-gray-900 min-w-0"
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setUseHome(false)}
                className={`flex-1 px-3 rounded-xl text-xs font-semibold transition-colors ${!useHome ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
              >{trip.foreignCurrency}</button>
              <button
                onClick={() => setUseHome(true)}
                className={`flex-1 px-3 rounded-xl text-xs font-semibold transition-colors ${useHome ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
              >{trip.homeCurrency}</button>
            </div>
          </div>

          {!useHome && converted !== null && amount > 0 && (
            <p className="text-xs text-gray-400 -mt-1 px-1">≈ {trip.homeCurrency} {Math.round(converted)}</p>
          )}

          {/* Note */}
          <input
            type="text"
            placeholder="What was this? (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="bg-gray-100 rounded-2xl px-4 py-3 text-sm"
          />

          {/* Outside budget */}
          <div
            onClick={() => { setIsOutside(v => !v); if (!isOutside) setSelectedCat(null) }}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer ${isOutside ? 'bg-gray-200' : 'bg-gray-100'}`}
          >
            <div>
              <p className="font-medium text-sm">Outside Budget</p>
              <p className="text-xs text-gray-400">Flight, insurance, visa…</p>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${isOutside ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isOutside ? 'translate-x-5' : ''}`} />
            </div>
          </div>

          {/* Category pills */}
          {!isOutside && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2 px-1">Category</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sorted.map(sub => {
                  const color = colorFromName(sub.colorName)
                  const sel = selectedCat?.id === sub.id
                  return (
                    <button key={sub.id} onClick={() => setSelectedCat(sel ? null : sub)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: sel ? color : color + '20', color: sel ? 'white' : color }}>
                      <span>{emojiIcon(sub.iconName)}</span>
                      {sub.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={add}
            disabled={!amount}
            className="w-full bg-blue-500 disabled:bg-gray-200 text-white disabled:text-gray-400 font-semibold py-4 rounded-2xl text-base mb-4"
          >Add</button>
        </div>
      </div>
    </div>
  )
}
