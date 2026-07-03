import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { useApp, uid } from '../store'
import { convert } from '../exchange'
import { colorFromName, ICONS, COLORS } from '../colors'
import type { Trip, SubBudget } from '../types'

const CURRENCIES = ['ILS','USD','GBP','EUR','JPY','AUD','CAD','CHF','SGD','HKD','THB','MXN','BRL','INR','KRW','TRY','ZAR','AED','SEK','NOK','DKK','PLN','CZK','HUF','RON','BGN','HRK','RUB','UAH','SAR','QAR','KWD','BHD','OMR','JOD','EGP','MAD','TND','NGN','KES','GHS','PKR','BDT','LKR','NPR','MMK','VND','IDR','MYR','PHP','TWD','CNY','NZD']

const DEFAULT_SUGGESTIONS = [
  { name: 'Food', icon: 'fork.knife', color: 'orange', fraction: 0.3 },
  { name: 'Transport', icon: 'car', color: 'blue', fraction: 0.15 },
  { name: 'Activities', icon: 'star', color: 'purple', fraction: 0.2 },
  { name: 'Shopping', icon: 'bag', color: 'pink', fraction: 0.15 },
  { name: 'Accommodation', icon: 'house', color: 'teal', fraction: 0.15 },
  { name: 'Emergency', icon: 'cross', color: 'red', fraction: 0, isCapped: false },
]

interface Props { onClose: () => void }

export default function NewTripSheet({ onClose }: Props) {
  const { addTrip } = useApp()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [homeCurrency, setHomeCurrency] = useState(() => Intl.NumberFormat().resolvedOptions().locale ? guessHomeCurrency() : 'ILS')
  const [foreignCurrency, setForeignCurrency] = useState('GBP')
  const [budgetText, setBudgetText] = useState('')
  const [categories, setCategories] = useState<SubBudget[]>([])

  function goToStep2() {
    const budget = parseFloat(budgetText) || 0
    const suggested: SubBudget[] = DEFAULT_SUGGESTIONS.map((s, i) => ({
      id: uid(),
      name: s.name,
      iconName: s.icon,
      colorName: s.color,
      allocatedAmount: s.fraction > 0 ? Math.round(budget * s.fraction) : 0,
      isCapped: s.isCapped !== false,
      sortOrder: i,
    }))
    setCategories(suggested)
    setStep(2)
  }

  function createTrip() {
    const trip: Trip = {
      id: uid(),
      name,
      homeCurrency,
      foreignCurrency,
      totalBudget: parseFloat(budgetText) || 0,
      startDate,
      endDate,
      expenses: [],
      subBudgets: categories,
    }
    addTrip(trip)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-[#f2f2f7] w-full max-h-[92svh] rounded-t-3xl overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {step === 1
          ? <Step1
              name={name} setName={setName}
              startDate={startDate} setStartDate={setStartDate}
              endDate={endDate} setEndDate={setEndDate}
              homeCurrency={homeCurrency} setHomeCurrency={setHomeCurrency}
              foreignCurrency={foreignCurrency} setForeignCurrency={setForeignCurrency}
              budgetText={budgetText} setBudgetText={setBudgetText}
              onClose={onClose} onNext={goToStep2}
            />
          : <Step2
              categories={categories} setCategories={setCategories}
              homeCurrency={homeCurrency} foreignCurrency={foreignCurrency}
              totalBudget={parseFloat(budgetText) || 0}
              onBack={() => setStep(1)} onCreate={createTrip}
            />
        }
      </div>
    </div>
  )
}

function Step1({ name, setName, startDate, setStartDate, endDate, setEndDate, homeCurrency, setHomeCurrency, foreignCurrency, setForeignCurrency, budgetText, setBudgetText, onClose, onNext }: any) {
  const canNext = name.trim() && budgetText && parseFloat(budgetText) > 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={onClose} className="text-blue-500 font-medium">Cancel</button>
        <h2 className="font-semibold text-base">New Trip</h2>
        <button onClick={onNext} disabled={!canNext} className="text-blue-500 font-semibold disabled:text-gray-300">Next</button>
      </div>

      <div className="overflow-y-auto flex-1 px-4 pb-8 flex flex-col gap-3">
        <Field label="Trip Name">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. London Summer 2026" className="w-full bg-transparent text-sm py-1" />
        </Field>

        <div className="flex gap-3">
          <Field label="Start" className="flex-1">
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value) }} className="w-full bg-transparent text-sm py-1" />
          </Field>
          <Field label="End" className="flex-1">
            <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-transparent text-sm py-1" />
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="Home Currency" className="flex-1">
            <select value={homeCurrency} onChange={e => setHomeCurrency(e.target.value)} className="w-full bg-transparent text-sm py-1">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Trip Currency" className="flex-1">
            <select value={foreignCurrency} onChange={e => setForeignCurrency(e.target.value)} className="w-full bg-transparent text-sm py-1">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <Field label={`Total Budget (${homeCurrency})`}>
          <input type="number" value={budgetText} onChange={e => setBudgetText(e.target.value)} placeholder="0" className="w-full bg-transparent text-sm py-1" inputMode="decimal" />
        </Field>
      </div>
    </div>
  )
}

function Step2({ categories, setCategories, homeCurrency, foreignCurrency, onBack, onCreate }: any) {
  const [editing, setEditing] = useState<SubBudget | null>(null)

  function updateCat(cat: SubBudget) {
    setCategories((prev: SubBudget[]) => prev.map((c: SubBudget) => c.id === cat.id ? cat : c))
    setEditing(null)
  }

  function removeCat(id: string) {
    setCategories((prev: SubBudget[]) => prev.filter((c: SubBudget) => c.id !== id))
  }

  function addCat() {
    const newCat: SubBudget = { id: uid(), name: 'New', iconName: 'star', colorName: 'blue', allocatedAmount: 0, isCapped: true, sortOrder: categories.length }
    setCategories((prev: SubBudget[]) => [...prev, newCat])
    setEditing(newCat)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={onBack} className="text-blue-500 font-medium">Back</button>
        <h2 className="font-semibold text-base">Categories</h2>
        <button onClick={onCreate} className="text-blue-500 font-semibold">Create</button>
      </div>

      <div className="overflow-y-auto flex-1 px-4 pb-8">
        <div className="bg-white rounded-2xl divide-y divide-gray-100 mb-3">
          {categories.map((cat: SubBudget) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3" onClick={() => setEditing(cat)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: colorFromName(cat.colorName) + '20' }}>
                <span style={{ color: colorFromName(cat.colorName) }} className="text-base">{emojiIcon(cat.iconName)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.isCapped ? `${homeCurrency} ${cat.allocatedAmount} cap` : 'No limit'}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          ))}
        </div>
        <button onClick={addCat} className="w-full bg-white rounded-2xl py-3 text-blue-500 font-medium text-sm">+ Add Category</button>
      </div>

      {editing && (
        <InlineCategoryEditor
          cat={editing}
          homeCurrency={homeCurrency}
          foreignCurrency={foreignCurrency}
          onSave={updateCat}
          onDelete={() => { removeCat(editing.id); setEditing(null) }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function InlineCategoryEditor({ cat, homeCurrency, foreignCurrency, onSave, onDelete, onClose }: any) {
  const [name, setName] = useState(cat.name)
  const [isCapped, setIsCapped] = useState(cat.isCapped)
  const [amount, setAmount] = useState(String(cat.allocatedAmount))
  const [currency, setCurrency] = useState(homeCurrency)
  const [iconName, setIconName] = useState(cat.iconName)
  const [colorName, setColorName] = useState(cat.colorName)
  const [converting, setConverting] = useState(false)
  const [converted, setConverted] = useState<number | null>(null)

  useEffect(() => {
    if (currency !== homeCurrency && parseFloat(amount) > 0) {
      setConverting(true)
      convert(parseFloat(amount), currency, homeCurrency).then(v => { setConverted(v); setConverting(false) })
    } else setConverted(null)
  }, [amount, currency])

  function save() {
    const homeAmount = currency === homeCurrency ? parseFloat(amount) || 0 : (converted ?? parseFloat(amount) ?? 0)
    onSave({ ...cat, name, isCapped, allocatedAmount: homeAmount, iconName, colorName })
  }

  const color = colorFromName(colorName)

  return (
    <div className="fixed inset-0 bg-black/40 z-60 flex items-end">
      <div className="bg-[#f2f2f7] w-full max-h-[85svh] rounded-t-3xl overflow-hidden flex flex-col">
        <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={onClose} className="text-gray-500">Cancel</button>
          <h2 className="font-semibold text-base">Edit Category</h2>
          <button onClick={save} className="text-blue-500 font-semibold">Save</button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-8 flex flex-col gap-3">
          {/* Name + preview combined */}
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
              <span style={{ color }} className="text-lg">{emojiIcon(iconName)}</span>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name" className="flex-1 bg-transparent font-semibold text-base" />
          </div>

          {/* Budget cap */}
          <div className="bg-white rounded-2xl px-4 divide-y divide-gray-100">
            <div className="flex items-center justify-between py-3">
              <span className="font-medium text-sm">Has Budget Cap</span>
              <input type="checkbox" checked={isCapped} onChange={e => setIsCapped(e.target.checked)} className="w-5 h-5 accent-blue-500" />
            </div>
            {isCapped && (
              <>
                <div className="py-3">
                  <p className="text-xs text-gray-400 mb-1">Amount</p>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full text-sm font-medium" inputMode="decimal" />
                </div>
                <div className="py-3">
                  <p className="text-xs text-gray-400 mb-1">Currency</p>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full text-sm">
                    <option>{homeCurrency}</option>
                    {foreignCurrency !== homeCurrency && <option>{foreignCurrency}</option>}
                  </select>
                  {converted !== null && !converting && (
                    <p className="text-xs text-gray-400 mt-1">≈ {homeCurrency} {Math.round(converted)}</p>
                  )}
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
                  className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-base"
                  style={{ background: iconName === icon ? color + '30' : '#f3f4f6', border: iconName === icon ? `2px solid ${color}` : '2px solid transparent' }}>
                  {emojiIcon(icon)}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-2">Color</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Object.entries(COLORS).map(([name, hex]) => (
                <button key={name} onClick={() => setColorName(name)}
                  className="w-8 h-8 flex-shrink-0 rounded-full border-2"
                  style={{ background: hex as string, borderColor: colorName === name ? '#000' : 'transparent' }} />
              ))}
            </div>
          </div>

          <button onClick={onDelete} className="w-full bg-white rounded-2xl py-3 text-red-500 font-medium text-sm">Delete Category</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl px-4 py-3 ${className}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {children}
    </div>
  )
}

function emojiIcon(name: string): string {
  const map: Record<string, string> = {
    'fork.knife': '🍴', 'cart': '🛒', 'bag': '🛍️', 'creditcard': '💳', 'house': '🏠',
    'car': '🚗', 'airplane': '✈️', 'train.side.front.car': '🚆', 'bus': '🚌',
    'bicycle': '🚲', 'figure.walk': '🚶', 'map': '🗺️', 'mappin': '📍',
    'star': '⭐', 'heart': '❤️', 'music.note': '🎵', 'camera': '📷',
    'photo': '🖼️', 'film': '🎬', 'gamecontroller': '🎮', 'dumbbell': '🏋️',
    'figure.hiking': '🥾', 'beach.umbrella': '🏖️', 'sun.max': '☀️', 'moon': '🌙',
    'cloud': '☁️', 'umbrella': '☂️', 'snowflake': '❄️', 'flame': '🔥',
    'drop': '💧', 'leaf': '🌿', 'pills': '💊', 'stethoscope': '🩺',
    'bandage': '🩹', 'cross': '➕', 'briefcase': '💼', 'doc': '📄',
    'book': '📚', 'graduation.cap': '🎓', 'wifi': '📶', 'phone': '📱',
    'laptopcomputer': '💻', 'tv': '📺', 'headphones': '🎧', 'gift': '🎁',
    'party.popper': '🎉', 'cup.and.saucer': '☕', 'wineglass': '🍷', 'mug': '🍺',
  }
  return map[name] ?? '●'
}

function guessHomeCurrency(): string {
  try {
    const locale = navigator.language
    const region = locale.split('-')[1]
    const map: Record<string, string> = { IL: 'ILS', US: 'USD', GB: 'GBP', EU: 'EUR', AU: 'AUD', CA: 'CAD' }
    return map[region] ?? 'USD'
  } catch { return 'USD' }
}
