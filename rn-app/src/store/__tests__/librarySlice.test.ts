import {
  addDaysISO,
  todayISO,
} from '../../utils/date'
import libraryReducer, {
  checkoutBook,
  closeModal,
  contactCheckout,
  contactMemberOverdueCheckouts,
  initializeLibrary,
  openCheckoutModal,
  openContactAcknowledgement,
  openReturnModal,
  returnBook,
} from '../librarySlice'
import {
  activeOverdueByMember,
  memberHasUncontactedOverdue,
  selectBookCounts,
  selectOverdueCheckouts,
  selectUncontactedOverdueCheckouts,
  selectBooksBySearchAndFilter,
} from '../selectors'
import type { LibraryState } from '../../types'
import type { RootState } from '../index'

const buildBaseState = (): LibraryState => {
  const now = todayISO()

  return {
    books: [
      {
        id: 'book-1',
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: 'isbn-1',
        genre: 'Sci-Fi',
        year: 1965,
        isAvailable: true,
        currentCheckoutId: null,
      },
      {
        id: 'book-2',
        title: 'Enders Game',
        author: 'Orson Scott Card',
        isbn: 'isbn-2',
        genre: 'Sci-Fi',
        year: 1985,
        isAvailable: false,
        currentCheckoutId: 'co-overdue-uncontacted',
      },
      {
        id: 'book-3',
        title: 'Foundation',
        author: 'Isaac Asimov',
        isbn: 'isbn-3',
        genre: 'Classic',
        year: 1951,
        isAvailable: false,
        currentCheckoutId: 'co-overdue-contacted',
      },
      {
        id: 'book-4',
        title: 'Ringworld',
        author: 'Larry Niven',
        isbn: 'isbn-4',
        genre: 'Sci-Fi',
        year: 1970,
        isAvailable: false,
        currentCheckoutId: 'co-future',
      },
      {
        id: 'book-5',
        title: 'Neuromancer',
        author: 'William Gibson',
        isbn: 'isbn-5',
        genre: 'Cyberpunk',
        year: 1984,
        isAvailable: true,
        currentCheckoutId: null,
      },
      {
        id: 'book-6',
        title: 'The Long Way',
        author: 'Unknown',
        isbn: 'isbn-6',
        genre: 'Sci-Fi',
        year: 1991,
        isAvailable: true,
        currentCheckoutId: null,
      },
    ],
    members: [
      { id: 'm-1', name: 'Ari Vega', memberId: 'M-100', email: 'ari@example.com' },
      { id: 'm-2', name: 'Noah Park', memberId: 'M-200', email: 'noah@example.com' },
      { id: 'm-3', name: 'Iris Song', memberId: 'M-300', email: 'iris@example.com' },
    ],
    checkouts: [
      {
        id: 'co-overdue-uncontacted',
        bookId: 'book-2',
        memberId: 'm-1',
        checkoutDate: addDaysISO(now, -12),
        dueDate: addDaysISO(now, -10),
        returnedDate: null,
        contacted: false,
        contactedAt: null,
      },
      {
        id: 'co-overdue-contacted',
        bookId: 'book-3',
        memberId: 'm-1',
        checkoutDate: addDaysISO(now, -5),
        dueDate: addDaysISO(now, -2),
        returnedDate: null,
        contacted: true,
        contactedAt: addDaysISO(now, -1),
      },
      {
        id: 'co-future',
        bookId: 'book-4',
        memberId: 'm-2',
        checkoutDate: addDaysISO(now, -1),
        dueDate: addDaysISO(now, 5),
        returnedDate: null,
        contacted: false,
        contactedAt: null,
      },
      {
        id: 'co-returned',
        bookId: 'book-6',
        memberId: 'm-1',
        checkoutDate: addDaysISO(now, -20),
        dueDate: addDaysISO(now, -12),
        returnedDate: addDaysISO(now, -7),
        contacted: false,
        contactedAt: null,
      },
    ],
    ui: {
      activeTab: 'books',
      searchQuery: '',
      activeFilter: 'all',
      checkoutModalBookId: null,
      returnCheckoutId: null,
      contactAckBookId: null,
      contactAckMemberId: null,
    },
  }
}

const toRoot = (state: LibraryState): RootState =>
  ({ library: state } as RootState)

describe('librarySlice reducers', () => {
  it('initializes domain state from seed data and keeps UI shell fields', () => {
    const state = buildBaseState()
    const withSeed = libraryReducer(state, initializeLibrary({
      books: [],
      members: [],
      checkouts: [],
    }))

    expect(withSeed.books).toHaveLength(0)
    expect(withSeed.members).toHaveLength(0)
    expect(withSeed.checkouts).toHaveLength(0)
    expect(withSeed.ui).toMatchObject(state.ui)
  })

  it('checks out an available book and sets checkout ownership on the book record', () => {
    const state = buildBaseState()
    const checked = libraryReducer(
      state,
      checkoutBook({
        bookId: 'book-1',
        memberId: 'm-3',
        checkoutDate: todayISO(),
        dueDate: addDaysISO(todayISO(), 14),
        id: 'co-new',
      }),
    )

    expect(checked.checkouts).toHaveLength(5)
    expect(checked.books.find((book) => book.id === 'book-1')).toMatchObject({
      isAvailable: false,
      currentCheckoutId: 'co-new',
    })
    expect(checked.checkouts.find((entry) => entry.id === 'co-new')).toMatchObject({
      bookId: 'book-1',
      memberId: 'm-3',
      contacted: false,
      contactedAt: null,
    })
  })

  it('guards checkout against already checked out book', () => {
    const state = buildBaseState()
    const afterFailedCheckout = libraryReducer(
      state,
      checkoutBook({
        bookId: 'book-2',
        memberId: 'm-3',
        checkoutDate: todayISO(),
        dueDate: addDaysISO(todayISO(), 14),
        id: 'co-blocked',
      }),
    )

    expect(afterFailedCheckout.checkouts).toHaveLength(4)
    expect(afterFailedCheckout.checkouts.find((entry) => entry.id === 'co-blocked')).toBeUndefined()
    expect(afterFailedCheckout.books.find((book) => book.id === 'book-2')?.currentCheckoutId).toBe(
      'co-overdue-uncontacted',
    )
  })

  it('returns an active checkout and marks the book available', () => {
    const state = buildBaseState()
    const returned = libraryReducer(state, returnBook('co-future'))

    expect(returned.checkouts.find((entry) => entry.id === 'co-future')?.returnedDate).toBe(todayISO())
    expect(returned.books.find((book) => book.id === 'book-4')).toMatchObject({
      currentCheckoutId: null,
      isAvailable: true,
    })
  })

  it('is no-op when return is called for already returned checkout', () => {
    const state = buildBaseState()
    const afterNoOp = libraryReducer(state, returnBook('co-returned'))

    expect(afterNoOp.checkouts).toHaveLength(4)
    expect(afterNoOp.checkouts.find((entry) => entry.id === 'co-returned')?.returnedDate).toBe(
      addDaysISO(todayISO(), -7),
    )
  })

  it('marks all active uncontacted overdue items for a member and is idempotent', () => {
    const state = buildBaseState()
    const contacted = libraryReducer(state, contactMemberOverdueCheckouts('m-1'))
    const updatedOverdue = contacted.checkouts.find((entry) => entry.id === 'co-overdue-uncontacted')
    const unchangedOverdue = contacted.checkouts.find((entry) => entry.id === 'co-overdue-contacted')
    const futureCheckout = contacted.checkouts.find((entry) => entry.id === 'co-future')
    const returnedCheckout = contacted.checkouts.find((entry) => entry.id === 'co-returned')

    expect(updatedOverdue?.contacted).toBe(true)
    expect(updatedOverdue?.contactedAt).toBe(todayISO())
    expect(unchangedOverdue).toMatchObject({
      contacted: true,
      contactedAt: addDaysISO(todayISO(), -1),
    })
    expect(futureCheckout?.contacted).toBe(false)
    expect(returnedCheckout?.contacted).toBe(false)

    const secondContact = libraryReducer(contacted, contactMemberOverdueCheckouts('m-1'))
    expect(secondContact.checkouts.find((entry) => entry.id === 'co-overdue-uncontacted')?.contactedAt).toBe(
      todayISO(),
    )
  })

  it('can contact a single overdue checkout by id and ignore invalid/no-op cases', () => {
    const state = buildBaseState()
    const single = libraryReducer(state, contactCheckout('co-overdue-uncontacted'))
    expect(single.checkouts.find((entry) => entry.id === 'co-overdue-uncontacted')).toMatchObject({
      contacted: true,
      contactedAt: todayISO(),
    })

    const futureNoOp = libraryReducer(single, contactCheckout('co-future'))
    expect(futureNoOp.checkouts.find((entry) => entry.id === 'co-future')?.contacted).toBe(false)

    const returnedNoOp = libraryReducer(single, contactCheckout('co-returned'))
    expect(returnedNoOp.checkouts.find((entry) => entry.id === 'co-returned')?.contacted).toBe(false)
  })

  it('opens and resets modal ids consistently', () => {
    let state = buildBaseState()
    state = libraryReducer(state, openCheckoutModal('book-1'))
    expect(state.ui.checkoutModalBookId).toBe('book-1')

    state = libraryReducer(state, openReturnModal('co-future'))
    expect(state.ui).toMatchObject({
      checkoutModalBookId: null,
      returnCheckoutId: 'co-future',
    })

    state = libraryReducer(
      state,
      openContactAcknowledgement({ bookId: 'book-1', memberId: 'm-1' }),
    )
    expect(state.ui).toMatchObject({
      contactAckBookId: 'book-1',
      contactAckMemberId: 'm-1',
      checkoutModalBookId: null,
      returnCheckoutId: null,
    })

    state = libraryReducer(state, closeModal())
    expect(state.ui).toMatchObject({
      contactAckBookId: null,
      contactAckMemberId: null,
      checkoutModalBookId: null,
      returnCheckoutId: null,
    })
  })
})

  describe('library selectors', () => {
  it('computes dashboard counts including uncontacted overdue badge total', () => {
    const state = buildBaseState()
    expect(selectBookCounts(toRoot(state))).toEqual({
      all: 6,
      available: 3,
      checkedOut: 3,
      overdue: 1,
    })
  })

  it('returns active overdue checkouts sorted oldest-first (lexicographically by due date)', () => {
    const state = buildBaseState()
    expect(selectOverdueCheckouts(toRoot(state)).map((item) => item.id)).toEqual([
      'co-overdue-uncontacted',
      'co-overdue-contacted',
    ])
  })

  it('supports search + filters for books', () => {
    const state = buildBaseState()

    expect(selectBooksBySearchAndFilter(toRoot(state), 'eNdEr', 'all').map((item) => item.id)).toEqual([
      'book-2',
    ])

    expect(selectBooksBySearchAndFilter(toRoot(state), '', 'available').map((item) => item.id)).toEqual([
      'book-1',
      'book-5',
      'book-6',
    ])

    expect(selectBooksBySearchAndFilter(toRoot(state), '', 'checked_out').map((item) => item.id)).toEqual([
      'book-2',
      'book-3',
      'book-4',
    ])

    expect(selectBooksBySearchAndFilter(toRoot(state), '', 'overdue').map((item) => item.id)).toEqual([
      'book-2',
      'book-3',
    ])
  })

  it('maps overdue member selectors to active/uncontacted-overdue behavior', () => {
    const state = buildBaseState()
    const root = toRoot(state)
    expect(memberHasUncontactedOverdue(root, 'm-1')).toBe(true)
    expect(memberHasUncontactedOverdue(root, 'm-2')).toBe(false)

    expect(activeOverdueByMember(root, 'm-1').map((entry) => entry.id)).toEqual([
      'co-overdue-uncontacted',
      'co-overdue-contacted',
    ])
    expect(selectUncontactedOverdueCheckouts(root).map((entry) => entry.id)).toEqual([
      'co-overdue-uncontacted',
    ])
  })

  it('validates empty-state logic for selected filters via selector output', () => {
    const state = buildBaseState()
    state.checkouts.push({
      id: 'co-contacted-all',
      bookId: 'book-5',
      memberId: 'm-2',
      checkoutDate: addDaysISO(todayISO(), -30),
      dueDate: addDaysISO(todayISO(), -30),
      returnedDate: null,
      contacted: true,
      contactedAt: addDaysISO(todayISO(), -29),
    })
    state.books.find((book) => book.id === 'book-5')!.currentCheckoutId = 'co-contacted-all'
    state.books.find((book) => book.id === 'book-5')!.isAvailable = false

    const noSearch = selectBooksBySearchAndFilter(toRoot(state), 'not-there', 'all')
    const noMatch = selectBooksBySearchAndFilter(toRoot(state), 'not-there', 'overdue')

    expect(noSearch).toHaveLength(0)
    expect(noMatch).toHaveLength(0)
  })
})

describe('checkout-contact flow requirements as state transitions', () => {
  it('implements the overdue-member gate decision inputs and post-confirm update', () => {
    const state = buildBaseState()
    const root = toRoot(state)
    expect(memberHasUncontactedOverdue(root, 'm-1')).toBe(true)
    expect(memberHasUncontactedOverdue(root, 'm-2')).toBe(false)

    const afterContact = libraryReducer(state, contactMemberOverdueCheckouts('m-1'))
    expect(memberHasUncontactedOverdue(toRoot(afterContact), 'm-1')).toBe(false)
    expect(selectUncontactedOverdueCheckouts(toRoot(afterContact))).toHaveLength(0)

    const checkout = libraryReducer(
      afterContact,
      checkoutBook({
        bookId: 'book-1',
        memberId: 'm-1',
        checkoutDate: todayISO(),
        dueDate: addDaysISO(todayISO(), 14),
        id: 'co-after-contact',
      }),
    )
    expect(checkout.books.find((book) => book.id === 'book-1')?.isAvailable).toBe(false)
    expect(checkout.checkouts.find((entry) => entry.id === 'co-after-contact')).toBeDefined()
  })

  it('allows checkout without gate for member with no uncontacted overdue items', () => {
    const state = buildBaseState()
    const checkout = libraryReducer(
      state,
      checkoutBook({
        bookId: 'book-1',
        memberId: 'm-2',
        checkoutDate: todayISO(),
        dueDate: addDaysISO(todayISO(), 14),
        id: 'co-clean-member',
      }),
    )
    expect(checkout.checkouts.find((entry) => entry.id === 'co-clean-member')).toBeDefined()
    expect(memberHasUncontactedOverdue(toRoot(checkout), 'm-2')).toBe(false)
  })
})
