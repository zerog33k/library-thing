export const todayISO = (): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return isoFromDate(today)
}

export const isoFromDate = (value: Date): string => value.toISOString().slice(0, 10)

export const addDaysISO = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() + days)
  return isoFromDate(date)
}

export const isOverdue = (dueDateISO: string, nowISO: string): boolean => {
  return dueDateISO < nowISO
}

export const daysOverdue = (dueDateISO: string, nowISO: string): number => {
  const due = new Date(`${dueDateISO}T00:00:00`).getTime()
  const now = new Date(`${nowISO}T00:00:00`).getTime()
  return Math.max(0, Math.floor((now - due) / 86400000))
}
