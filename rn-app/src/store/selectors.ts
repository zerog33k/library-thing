import type { RootState } from './index'
import { isOverdue } from '../utils/date'
import type { FilterType } from '../types'
import { todayISO } from '../utils/date'

export const selectBookById = (state: RootState, bookId: string | null) => {
  return state.library.books.find((book) => book.id === bookId) ?? null
}

export const selectMemberById = (state: RootState, memberId: string | null) => {
  return state.library.members.find((member) => member.id === memberId) ?? null
}

export const selectCheckoutById = (state: RootState, checkoutId: string | null) => {
  return state.library.checkouts.find((checkout) => checkout.id === checkoutId) ?? null
}

export const selectCurrentCheckoutByBookId = (state: RootState, bookId: string | null) => {
  const book = selectBookById(state, bookId)
  if (!book || !book.currentCheckoutId) {
    return null
  }
  return state.library.checkouts.find((item) => item.id === book.currentCheckoutId) ?? null
}

export const selectActiveCheckouts = (state: RootState) => {
  return state.library.checkouts.filter((item) => !item.returnedDate)
}

export const selectOverdueCheckouts = (state: RootState) => {
  const today = todayISO()
  return selectActiveCheckouts(state)
    .filter((item) => isOverdue(item.dueDate, today))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export const selectUncontactedOverdueCheckouts = (state: RootState) => {
  return selectOverdueCheckouts(state).filter((item) => !item.contacted)
}

export const selectBookCounts = (state: RootState) => {
  const all = state.library.books.length
  const available = state.library.books.filter((book) => !book.currentCheckoutId).length
  const checkedOut = all - available
  const overdue = selectUncontactedOverdueCheckouts(state).length
  return { all, available, checkedOut, overdue }
}

export const selectOverdueByMember = (state: RootState, memberId: string) => {
  const today = todayISO()
  return selectActiveCheckouts(state)
    .filter((item) => item.memberId === memberId)
    .filter((item) => isOverdue(item.dueDate, today))
}

export const activeOverdueByMember = (state: RootState, memberId: string) => {
  return selectOverdueByMember(state, memberId)
}

export const selectUncontactedOverdueByMember = (state: RootState, memberId: string) => {
  return selectOverdueByMember(state, memberId).filter((item) => !item.contacted)
}

export const selectMemberHasUncontactedOverdue = (state: RootState, memberId: string | null) => {
  if (!memberId) {
    return false
  }
  return selectUncontactedOverdueByMember(state, memberId).length > 0
}

export const memberHasUncontactedOverdue = (state: RootState, memberId: string | null) => {
  return selectMemberHasUncontactedOverdue(state, memberId)
}

export const selectBooksBySearchAndFilter = (state: RootState, search: string, filter: FilterType) => {
  const normalizedSearch = search.trim().toLowerCase()
  const today = todayISO()

  const byId = Object.fromEntries(
    state.library.checkouts
      .filter((checkout) => !checkout.returnedDate)
      .map((checkout) => [checkout.bookId, checkout]),
  ) as Record<string, typeof state.library.checkouts[0]>

  const all = state.library.books.filter((book) => {
    const matchesSearch = !normalizedSearch || book.title.toLowerCase().includes(normalizedSearch)
    const checkout = byId[book.id]
    const isCheckedOut = Boolean(checkout)
    const isOverdueBook = Boolean(checkout && isOverdue(checkout.dueDate, today))

    if (filter === 'available') {
      return matchesSearch && !isCheckedOut
    }
    if (filter === 'checked_out') {
      return matchesSearch && isCheckedOut
    }
    if (filter === 'overdue') {
      return matchesSearch && isOverdueBook
    }
    return matchesSearch
  })

  return all
}
