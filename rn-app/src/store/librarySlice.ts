import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { LibraryState, CheckoutPayload, FilterType, TabName, Checkout } from '../types'
import { todayISO, addDaysISO, isOverdue } from '../utils/date'

const initialUi = {
  activeTab: 'books' as TabName,
  searchQuery: '',
  activeFilter: 'all' as FilterType,
  checkoutModalBookId: null as string | null,
  returnCheckoutId: null as string | null,
  contactAckBookId: null as string | null,
  contactAckMemberId: null as string | null,
}

const initialState: LibraryState = {
  books: [],
  members: [],
  checkouts: [],
  ui: initialUi,
}

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    initializeLibrary: (state, action: PayloadAction<Omit<LibraryState, 'ui'>>) => {
      state.books = action.payload.books
      state.members = action.payload.members
      state.checkouts = action.payload.checkouts
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.ui.searchQuery = action.payload
    },
    setActiveFilter: (state, action: PayloadAction<FilterType>) => {
      state.ui.activeFilter = action.payload
    },
    setActiveTab: (state, action: PayloadAction<TabName>) => {
      state.ui.activeTab = action.payload
    },
    openCheckoutModal: (state, action: PayloadAction<string>) => {
      state.ui.checkoutModalBookId = action.payload
      state.ui.returnCheckoutId = null
      state.ui.contactAckBookId = null
      state.ui.contactAckMemberId = null
    },
    openReturnModal: (state, action: PayloadAction<string>) => {
      state.ui.returnCheckoutId = action.payload
      state.ui.checkoutModalBookId = null
      state.ui.contactAckBookId = null
      state.ui.contactAckMemberId = null
    },
    openContactAcknowledgement: (
      state,
      action: PayloadAction<{ bookId: string; memberId: string }>,
    ) => {
      state.ui.contactAckBookId = action.payload.bookId
      state.ui.contactAckMemberId = action.payload.memberId
      state.ui.checkoutModalBookId = null
      state.ui.returnCheckoutId = null
    },
    closeModal: (state) => {
      state.ui.checkoutModalBookId = null
      state.ui.returnCheckoutId = null
      state.ui.contactAckBookId = null
      state.ui.contactAckMemberId = null
    },
    checkoutBook: (state, action: PayloadAction<CheckoutPayload>) => {
      const { bookId, memberId, checkoutDate, dueDate, notes, id } = action.payload
      const book = state.books.find((item) => item.id === bookId)
      if (!book || book.currentCheckoutId) {
        return
      }
      const checkoutId = id ?? `co-${Date.now()}`
      const checkout: Checkout = {
        id: checkoutId,
        bookId,
        memberId,
        checkoutDate,
        dueDate: dueDate || addDaysISO(checkoutDate, 14),
        returnedDate: null,
        notes,
        contacted: false,
        contactedAt: null,
      }
      state.checkouts.push(checkout)
      book.currentCheckoutId = checkoutId
      book.isAvailable = false
    },
    returnBook: (state, action: PayloadAction<string>) => {
      const checkoutId = action.payload
      const checkout = state.checkouts.find((item) => item.id === checkoutId)
      if (!checkout || checkout.returnedDate) {
        return
      }
      checkout.returnedDate = todayISO()
      const book = state.books.find((item) => item.id === checkout.bookId)
      if (book) {
        book.currentCheckoutId = null
        book.isAvailable = true
      }
    },
    contactMemberOverdueCheckouts: (state, action: PayloadAction<string>) => {
      const memberId = action.payload
      const now = todayISO()
      state.checkouts.forEach((checkout) => {
        if (
          checkout.memberId === memberId &&
          !checkout.returnedDate &&
          !checkout.contacted &&
          isOverdue(checkout.dueDate, now)
        ) {
          checkout.contacted = true
          checkout.contactedAt = now
        }
      })
    },
    contactCheckout: (state, action: PayloadAction<string>) => {
      const checkoutId = action.payload
      const checkout = state.checkouts.find((item) => item.id === checkoutId)
      if (!checkout || checkout.returnedDate || checkout.contacted || !isOverdue(checkout.dueDate, todayISO())) {
        return
      }
      checkout.contacted = true
      checkout.contactedAt = todayISO()
    },
  },
})

export const {
  initializeLibrary,
  setSearchQuery,
  setActiveFilter,
  setActiveTab,
  openCheckoutModal,
  openReturnModal,
  openContactAcknowledgement,
  closeModal,
  checkoutBook,
  returnBook,
  contactMemberOverdueCheckouts,
  contactCheckout,
} = librarySlice.actions

export default librarySlice.reducer
