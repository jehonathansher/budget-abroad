import { useState, useEffect } from 'react'
import { convert } from '../exchange'
import { colorFromName, ICONS, COLORS } from '../colors'
import { emojiIcon } from '../views/TripDetail'
import type { Trip, SubBudget } from '../types'

interface Props { cat: SubBudget; trip: Trip; onSave: (cat: SubBudget) => void; onDelete: () => void; onClose: () => void; isNew?: boolean }

export default function CategoryEditorSheet({ cat, trip, onSave, onDelete, onClose, isNew }: Props) {
  const [name, setName] = useState(cat.name)
  const [isCapped, setIsCapped] = useState(cat.isCapped)
  const [amountText, setAmountText] = useState(String(cat.allocatedAmount || ''))
  const [currency, setCurrency] = useState(trip.homeCurrency)
  const [iconName, setIconName] = useState(cat.iconName)
  const [colorName, setColorName] = useState(cat.colorName)
  const [converted, setConverted] = useState<number | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const color = colorFromName(colorName)
  const amount = parseFloat(amountText) || 0

  useEffect(() => {
    if (currency === trip.homeCurrency || !amount) { setConverted(null); return }
    convert(amount, currency, trip.homeCurrency).then(setConverted)
  }, [amountText, currency])

  function save() {
    const homeAmount = currency === trip.homeCurrency ? amount : (converted ?? amount)
    onSave({ ...cat, name, isCapped, allocatedAmount: homeAmount, iconName, colorName })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-[#f2f2f7] w-full rounded-t-3xl overflow-hidden flex flex-col" style={{ maxHeight: '90svh' }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={onClose} className="text-gray-500 text-sm">Cancel</button>
          <p className="font-semibold">{isNew ? 'New Category' : 'Edit Category'}</p>
          <button onClick={save} className="text-blue-500 font-semibold text-sm">Save</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-8 flex flex-col gap-3">
          {/* Preview */}
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: color + '20' }}>
              {emojiIcon(iconName)}
            </div>
            <p className="font-semibold">{name || 'Category Name'}</p>
          </div>

          {/* Name */}
          <div className="bg-white rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">Name</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name" className="w-full bg-transparent text-sm font-medium" />
          </div>

          {/* Budget cap */}
          <div className="bg-white rounded-2xl px-4 divide-y divide-gray-100">
            <div className="flex items-center justify-between py-3">
              <p className="font-medium text-sm">Has Budget Cap</p>
              <div onClick={() => setIsCapped(v => !v)} className={`w-12 h-7 rounded-full flex items-center px-1 cursor-pointer ${isCapped ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isCapped ? 'translate-x-5' : ''}`} />
              </div>
            </div>
            {isCapped && (
              <>
                <div className="py-3">
                  <p className="text-xs text-gray-400 mb-1">Amount</p>
                  <input type="number" inputMode="decimal" value={amountText} onChange={e => setAmountText(e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-medium" />
                  {converted !== null && <p className="text-xs text-gray-400 mt-1">≈ {trip.homeCurrency} {Math.round(converted)}</p>}
                </div>
                <div className="py-3">
                  <p className="text-xs text-gray-400 mb-1">Currency</p>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-transparent text-sm">
                    <option>{trip.homeCurrency}</option>
                    {trip.foreignCurrency !== trip.homeCurrency && <option>{trip.foreignCurrency}</option>}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Icons */}
          <div className="bg-white rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-2">Icon</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ICONS.map(icon => (
                <button key={icon} onClick={() => setIconName(icon)}
                  className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: iconName === icon ? color + '30' : '#f3f4f6', border: `2px solid ${iconName === icon ? color : 'transparent'}` }}>
                  {emojiIcon(icon)}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-2">Color</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Object.entries(COLORS).map(([n, hex]) => (
                <button key={n} onClick={() => setColorName(n)}
                  className="w-8 h-8 flex-shrink-0 rounded-full"
                  style={{ background: hex, border: colorName === n ? '3px solid #000' : '3px solid transparent' }} />
              ))}
            </div>
          </div>

          {!isNew && (
            <button onClick={() => setShowDelete(true)} className="w-full bg-white rounded-2xl py-3 text-red-500 font-medium text-sm">
              Delete Category
            </button>
          )}
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-center mb-1">Delete Category?</p>
            <p className="text-sm text-gray-400 text-center mb-4">Expenses linked to this category won't be deleted.</p>
            <button onClick={onDelete} className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl mb-2">Delete</button>
            <button onClick={() => setShowDelete(false)} className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
