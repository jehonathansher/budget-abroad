export const COLORS: Record<string, string> = {
  blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', purple: '#a855f7',
  pink: '#ec4899', rose: '#f43f5e', red: '#ef4444', coral: '#f97066',
  orange: '#f97316', amber: '#f59e0b', yellow: '#eab308', lime: '#84cc16',
  green: '#22c55e', teal: '#14b8a6', cyan: '#06b6d4', mint: '#10d9a0',
  sky: '#0ea5e9', slate: '#64748b', brown: '#92400e',
}

export const ICONS = [
  'fork.knife','cart','bag','creditcard','house','car','airplane','train.side.front.car',
  'bus','bicycle','figure.walk','map','mappin','star','heart','music.note',
  'camera','photo','film','gamecontroller','dumbbell','figure.hiking','beach.umbrella',
  'sun.max','moon','cloud','umbrella','snowflake','flame','drop','leaf',
  'pills','stethoscope','bandage','cross','briefcase','doc','book','graduation.cap',
  'wifi','phone','laptopcomputer','tv','headphones','gift','party.popper',
  'cup.and.saucer','wineglass','mug',
]

export function colorFromName(name: string): string {
  return COLORS[name] ?? '#3b82f6'
}
