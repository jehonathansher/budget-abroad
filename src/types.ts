export interface Expense {
  id: string
  amount: number
  currency: string
  amountInHome: number
  note: string
  date: string
  subBudgetId?: string
  isOutsideBudget: boolean
}

export interface SubBudget {
  id: string
  name: string
  iconName: string
  colorName: string
  allocatedAmount: number
  isCapped: boolean
  sortOrder: number
}

export interface Trip {
  id: string
  name: string
  homeCurrency: string
  foreignCurrency: string
  totalBudget: number
  startDate: string
  endDate: string
  expenses: Expense[]
  subBudgets: SubBudget[]
}
