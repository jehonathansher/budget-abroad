import { useState, useRef } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import {
  useApp, tripTotalSpentHome, tripRemainingBudget, tripFreePool,
  tripFreePoolRemaining, tripUncappedSpent, spentForSubBudget, tripOutsideBudgetTotal, uid
} from '../store'
import { colorFromName } from '../colors'
import type { Trip, Expense, SubBudget } from '../types'
import QuickAddSheet from '../components/QuickAddSheet'
import ExpenseEditorSheet from '../components/ExpenseEditorSheet'
import CategoryEditorSheet from '../components/CategoryEditorSheet'

interface Props { trip: Trip; onBack: () => void }

export default function TripDetail({ trip, onBack }: Props) {
  const { updateTrip } = useApp()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingCategory, setEditingCategory] = useState<SubBudget | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)

  const sorted = [...trip.subBudgets].sort((a, b) => a.sortOrder - b.sortOrder)
  const capped = sorted.filter(s => s.isCapped)
  const uncapped = sorted.filter(s => !s.isCapped)
  const outsideExpenses = trip.expenses.filter(e => e.isOutsideBudget)
  const budgetExpenses = trip.expenses.filter(e => !e.isOutsideBudget).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const spent = tripTotalSpentHome(trip)
  const remaining = tripRemainingBudget(trip)
  const progress = trip.totalBudget > 0 ? Math.min(spent / trip.totalBudget, 1) : 0
  const isOver = remaining < 0
  const freePool = tripFreePool(trip)
  const freePoolRemaining = tripFreePoolRemaining(trip)
  const outsideTotal = tripOutsideBudgetTotal(trip)

  function saveExpense(expense: Expense) {
    const updated = { ...trip, expenses: trip.expenses.map(e => e.id === expense.id ? expense : e) }
    updateTrip(updated)
    setEditingExpense(null)
  }

  function deleteExpense(id: string) {
    updateTrip({ ...trip, expenses: trip.expenses.filter(e => e.id !== id) })
    setEditingExpense(null)
  }

  function addExpense(expense: Expense) {
    updateTrip({ ...trip, expenses: [...trip.expenses, expense] })
    setShowQuickAdd(false)
  }

  function saveCategory(cat: SubBudget) {
    const updated = { ...trip, subBudgets: trip.subBudgets.map(s => s.id === cat.id ? cat : s) }
    updateTrip(updated)
    setEditingCategory(null)
    setShowAddCategory(false)
  }

  function deleteCategory(id: string) {
    updateTrip({ ...trip, subBudgets: trip.subBudgets.filter(s => s.id !== id) })
    setEditingCategory(null)
  }

  function addCategory(cat: SubBudget) {
    const withOrder = { ...cat, sortOrder: trip.subBudgets.length }
    updateTrip({ ...trip, subBudgets: [...trip.subBudgets, withOrder] })
    setShowAddCategory(false)
  }

  // Swipe to delete state
  const [swipedExpenseId, setSwipedExpenseId] = useState<string | null>(null)

  return (
    <div className="min-h-svh bg-[#f2f2f7] pb-28">
      {/* Nav */}
      <div className="flex items-center gap-2 px-4 pt-14 pb-2">
        <button onClick={onBack} className="flex items-center text-blue-500 font-medium">
          <ChevronLeft size={20} /><span>Trips</span>
        </button>
      </div>

      {/* Header card */}
      <div className="mx-4 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 p-5 text-white mb-4">
        <h1 className="font-bold text-xl mb-0.5">{trip.name}</h1>
        <p className="text-blue-100 text-sm mb-4">{trip.foreignCurrency} · {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}</p>
        <div className="flex gap-4 mb-3">
          <div>
            <p className="text-blue-200 text-xs">Budget</p>
            <p className="font-bold text-lg">{trip.homeCurrency} {fmt(trip.totalBudget)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Spent</p>
            <p className="font-bold text-lg">{trip.homeCurrency} {fmt(spent)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">{isOver ? 'Over' : 'Remaining'}</p>
            <p className={`font-bold text-lg ${isOver ? 'text-red-300' : ''}`}>{trip.homeCurrency} {fmt(Math.abs(remaining))}</p>
          </div>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isOver ? 'bg-red-400' : 'bg-white'}`} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Categories */}
      <div className="mx-4 mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</p>
          <button onClick={() => setShowAddCategory(true)} className="text-blue-500 text-sm font-medium">+ Add</button>
        </div>

        <div className="flex flex-col gap-2">
          {capped.map(cat => (
            <CappedCategoryRow key={cat.id} cat={cat} trip={trip} onClick={() => setEditingCategory(cat)} />
          ))}

          {uncapped.length > 0 && (
            <FlexibleCard uncapped={uncapped} trip={trip} freePool={freePool} freePoolRemaining={freePoolRemaining} onTap={setEditingCategory} />
          )}
        </div>
      </div>

      {/* Outside budget */}
      {outsideExpenses.length > 0 && (
        <div className="mx-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Outside Budget</p>
          <div className="bg-white rounded-2xl divide-y divide-gray-100">
            {outsideExpenses.map(e => (
              <ExpenseRow key={e.id} expense={e} trip={trip} onClick={() => setEditingExpense(e)} swipedId={swipedExpenseId} setSwipedId={setSwipedExpenseId} onDelete={() => deleteExpense(e.id)} />
            ))}
          </div>
          <p className="text-xs text-gray-400 text-right px-2 mt-1">Total: {trip.homeCurrency} {fmt(outsideTotal)}</p>
        </div>
      )}

      {/* Expenses */}
      <div className="mx-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Expenses</p>
        {budgetExpenses.length === 0
          ? <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm">No expenses yet</div>
          : <div className="bg-white rounded-2xl divide-y divide-gray-100 overflow-hidden">
              {budgetExpenses.map(e => (
                <ExpenseRow key={e.id} expense={e} trip={trip} onClick={() => setEditingExpense(e)} swipedId={swipedExpenseId} setSwipedId={setSwipedExpenseId} onDelete={() => deleteExpense(e.id)} />
              ))}
            </div>
        }
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-14 h-14 bg-blue-500 rounded-full shadow-xl flex items-center justify-center"
      >
        <Plus size={28} className="text-white" />
      </button>

      {showQuickAdd && <QuickAddSheet trip={trip} onAdd={addExpense} onClose={() => setShowQuickAdd(false)} />}
      {editingExpense && <ExpenseEditorSheet expense={editingExpense} trip={trip} onSave={saveExpense} onDelete={() => deleteExpense(editingExpense.id)} onClose={() => setEditingExpense(null)} />}
      {editingCategory && <CategoryEditorSheet cat={editingCategory} trip={trip} onSave={saveCategory} onDelete={() => deleteCategory(editingCategory.id)} onClose={() => setEditingCategory(null)} />}
      {showAddCategory && (
        <CategoryEditorSheet
          cat={{ id: uid(), name: '', iconName: 'star', colorName: 'blue', allocatedAmount: 0, isCapped: true, sortOrder: trip.subBudgets.length }}
          trip={trip}
          onSave={addCategory}
          onDelete={() => setShowAddCategory(false)}
          onClose={() => setShowAddCategory(false)}
          isNew
        />
      )}
    </div>
  )
}

function CappedCategoryRow({ cat, trip, onClick }: { cat: SubBudget; trip: Trip; onClick: () => void }) {
  const spent = spentForSubBudget(trip, cat)
  const remaining = cat.allocatedAmount - spent
  const progress = cat.allocatedAmount > 0 ? Math.min(spent / cat.allocatedAmount, 1) : 0
  const isOver = remaining < 0
  const color = colorFromName(cat.colorName)

  return (
    <button onClick={onClick} className="bg-white rounded-2xl p-4 text-left w-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          <span>{emojiIcon(cat.iconName)}</span>
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{cat.name}</p>
          <p className="text-xs text-gray-400">{trip.homeCurrency} {fmt(cat.allocatedAmount)} cap</p>
        </div>
        <div className="text-right">
          <p className={`font-semibold text-sm ${isOver ? 'text-red-500' : ''}`}>{trip.homeCurrency} {fmt(Math.abs(remaining))}</p>
          <p className="text-xs text-gray-400">{isOver ? 'over' : 'left'}</p>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: color + '20' }}>
        <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: isOver ? '#ef4444' : color }} />
      </div>
    </button>
  )
}

function FlexibleCard({ uncapped, trip, freePool, freePoolRemaining, onTap }: { uncapped: SubBudget[]; trip: Trip; freePool: number; freePoolRemaining: number; onTap: (cat: SubBudget) => void }) {
  const isLow = freePool > 0 && freePoolRemaining / freePool < 0.2
  const totalUncappedSpent = tripUncappedSpent(trip)

  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-gray-400">{trip.homeCurrency}</span>
            <span className={`text-xl font-bold ${isLow ? 'text-orange-500' : 'text-gray-900'}`}>{fmt(Math.max(freePoolRemaining, 0))}</span>
          </div>
          <p className="text-xs text-gray-400">available</p>
        </div>
        {totalUncappedSpent > 0 && <p className="text-xs text-gray-400">{trip.homeCurrency} {fmt(totalUncappedSpent)} spent</p>}
      </div>

      {/* Segmented bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex mb-3">
        {uncapped.map(sub => {
          const spent = spentForSubBudget(trip, sub)
          const w = freePool > 0 ? (spent / freePool) * 100 : 0
          return w > 0 ? <div key={sub.id} style={{ width: `${w}%`, background: colorFromName(sub.colorName) }} /> : null
        })}
      </div>

      <div className="divide-y divide-gray-100">
        {uncapped.map(sub => {
          const spent = spentForSubBudget(trip, sub)
          const color = colorFromName(sub.colorName)
          const barW = freePool > 0 ? Math.min(spent / freePool, 1) : 0
          return (
            <button key={sub.id} onClick={() => onTap(sub)} className="flex items-center gap-3 py-2.5 w-full text-left">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: color + '20' }}>
                <span>{emojiIcon(sub.iconName)}</span>
              </div>
              <span className="flex-1 text-sm">{sub.name}</span>
              <span className="text-sm font-medium" style={{ color }}>{spent > 0 ? `${trip.homeCurrency} ${fmt(spent)}` : '–'}</span>
              <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${barW * 100}%`, background: color }} />
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6" /></svg>
}

function ExpenseRow({ expense, trip, onClick, swipedId, setSwipedId, onDelete }: {
  expense: Expense; trip: Trip; onClick: () => void
  swipedId: string | null; setSwipedId: (id: string | null) => void; onDelete: () => void
}) {
  const startX = useRef(0)
  const [offset, setOffset] = useState(0)
  const isDragging = useRef(false)
  const THRESHOLD = 80

  const sub = trip.subBudgets.find(s => s.id === expense.subBudgetId)
  const color = sub ? colorFromName(sub.colorName) : '#9ca3af'
  const isSwiped = swipedId === expense.id

  function onTouchStart(e: React.TouchEvent) {
    if (swipedId && swipedId !== expense.id) { setSwipedId(null); return }
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return
    const dx = startX.current - e.touches[0].clientX
    if (dx > 0) setOffset(Math.min(dx, THRESHOLD + 20))
    else if (isSwiped) setOffset(Math.max(THRESHOLD + dx, 0))
  }

  function onTouchEnd() {
    isDragging.current = false
    if (offset > THRESHOLD / 2) { setSwipedId(expense.id); setOffset(THRESHOLD) }
    else { setSwipedId(null); setOffset(0) }
  }

  const currentOffset = isSwiped && offset === 0 ? THRESHOLD : offset

  return (
    <div className="relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
        <button onClick={onDelete} className="text-white text-xs font-semibold px-3 h-full">Delete</button>
      </div>
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white relative"
        style={{ transform: `translateX(-${currentOffset}px)`, transition: isDragging.current ? 'none' : 'transform 0.25s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (currentOffset > 10) { setSwipedId(null); setOffset(0) } else onClick() }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm" style={{ background: color + '20' }}>
          <span>{sub ? emojiIcon(sub.iconName) : '💰'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{expense.note || (sub?.name ?? 'Expense')}</p>
          <p className="text-xs text-gray-400">{fmtDate(expense.date)}{sub ? ` · ${sub.name}` : ''}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-sm">{expense.currency} {fmtDec(expense.amount)}</p>
          {expense.currency !== trip.homeCurrency && <p className="text-xs text-gray-400">{trip.homeCurrency} {fmt(expense.amountInHome)}</p>}
        </div>
      </div>
    </div>
  )
}

function fmt(n: number) { return Math.round(n).toLocaleString() }
function fmtDec(n: number) { return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2) }
function fmtDate(s: string) {
  if (!s) return ''
  return new Date(s).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function emojiIcon(name: string): string {
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
