export type FilterType = 'all' | 'available' | 'checked_out' | 'overdue'

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  genre: string
  year: number
  coverImageUrl?: string
  isAvailable: boolean
  currentCheckoutId: string | null
}

export interface Member {
  id: string
  name: string
  memberId: string
  email: string
}

export interface Checkout {
  id: string
  bookId: string
  memberId: string
  checkoutDate: string
  dueDate: string
  returnedDate: string | null
  notes?: string
  contacted: boolean
  contactedAt: string | null
}

export interface SeedData {
  generatedAt: string
  books: Book[]
  members: Member[]
  checkouts: Checkout[]
}

export type TabName = 'books' | 'overdue' | 'members'

export interface UiState {
  activeTab: TabName
  searchQuery: string
  activeFilter: FilterType
  checkoutModalBookId: string | null
  returnCheckoutId: string | null
  contactAckBookId: string | null
  contactAckMemberId: string | null
}

export interface LibraryState {
  books: Book[]
  members: Member[]
  checkouts: Checkout[]
  ui: UiState
}

export interface CheckoutPayload {
  bookId: string
  memberId: string
  checkoutDate: string
  dueDate: string
  notes?: string
  id?: string
}
