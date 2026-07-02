import { useState, useEffect } from 'react'
import { convert } from '../exchange'
import { colorFromName } from '../colors'
import { emojiIcon } from '../views/TripDetail'
import type { Trip, Expense } from '../types'

interface Props { expense: Expense; trip: Trip; onSave: (e: Expense) => void; onDelete: () => void; onClose: () => void }

export default function ExpenseEditorSheet({ expense, trip, onSave, onDelete, onClose }: Props) {
  const [amountText, setAmountText] = useState(String(expense.amount))
  const [note, setNote] = useState(expense.note)
  const [useHome, setUseHome] = useState(expense.currency === trip.homeCurrency)
  const [selectedCatId, setSelectedCatId] = useState<string | undefined>(expense.subBudgetId)
  const [isOutside, setIsOutside] = useState(expense.isOutsideBudget)
  const [date, setDate] = useState(expense.date.split('T')[0])
  const [converted, setConverted] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const sorted = [...trip.subBudgets].sort((a, b) => a.sortOrder - b.sortOrder)
  const amount = parseFloat(amountText) || 0

  useEffect(() => {
    if (useHome || !amount) { setConverted(null); return }
    convert(amount, trip.foreignCurrency, trip.homeCurrency).then(setConverted)
  }, [amountText, useHome])

  function save() {
    const homeAmount = useHome ? amount : (converted ?? amount)
    onSave({
      ...expense, amount, currency: useHome ? trip.homeCurrency : trip.foreignCurrency,
      amountInHome: homeAmount, note, date: new Date(date).toISOString(),
      subBudgetId: selectedCatId, isOutsideBudget: isOutside,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl overflow-hidden flex flex-col" style={{ maxHeight: '85svh' }}>
        <div className="flex justify-center pt-3 pb-2"><div className="w-9 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between px-5 py-2">
          <button onClick={onClose} className="text-gray-500 text-sm">Cancel</button>
          <p className="font-semibold">Edit Expense</p>
          <button onClick={() => setShowDeleteConfirm(true)} className="text-red-500 text-sm">Delete</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-safe flex flex-col gap-3 pt-2">
          <div className="flex gap-2 items-stretch">
            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="text-gray-400 font-medium text-sm">{useHome ? trip.homeCurrency : trip.foreignCurrency}</span>
              <input type="number" inputMode="decimal" value={amountText} onChange={e => setAmountText(e.target.value)} className="flex-1 bg-transparent text-2xl font-bold text-gray-900 min-w-0" />
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => setUseHome(false)} className={`flex-1 px-3 rounded-xl text-xs font-semibold ${!useHome ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{trip.foreignCurrency}</button>
              <button onClick={() => setUseHome(true)} className={`flex-1 px-3 rounded-xl text-xs font-semibold ${useHome ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{trip.homeCurrency}</button>
            </div>
          </div>

          {!useHome && converted !== null && <p className="text-xs text-gray-400 -mt-1 px-1">≈ {trip.homeCurrency} {Math.round(converted)}</p>}

          <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="bg-gray-100 rounded-2xl px-4 py-3 text-sm" />

          <div className="bg-gray-100 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">Date</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-sm w-full" />
          </div>

          <div onClick={() => { setIsOutside(v => !v); if (!isOutside) setSelectedCatId(undefined) }}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer ${isOutside ? 'bg-gray-200' : 'bg-gray-100'}`}>
            <div>
              <p className="font-medium text-sm">Outside Budget</p>
              <p className="text-xs text-gray-400">Won't count against budget</p>
            </div>
            <div className={`w-12 h-7 rounded-full flex items-center px-1 ${isOutside ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isOutside ? 'translate-x-5' : ''}`} />
            </div>
          </div>

          {!isOutside && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2 px-1">Category</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setSelectedCatId(undefined)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${!selectedCatId ? 'bg-gray-400 text-white' : 'bg-gray-100 text-gray-500'}`}>None</button>
                {sorted.map(sub => {
                  const color = colorFromName(sub.colorName)
                  const sel = selectedCatId === sub.id
                  return (
                    <button key={sub.id} onClick={() => setSelectedCatId(sub.id)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: sel ? color : color + '20', color: sel ? 'white' : color }}>
                      <span>{emojiIcon(sub.iconName)}</span>{sub.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button onClick={save} className="w-full bg-blue-500 text-white font-semibold py-4 rounded-2xl text-base mb-4">Save</button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-center mb-1">Delete Expense?</p>
            <p className="text-sm text-gray-400 text-center mb-4">This cannot be undone.</p>
            <button onClick={onDelete} className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl mb-2">Delete</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
