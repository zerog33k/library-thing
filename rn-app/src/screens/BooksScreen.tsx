import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  setSearchQuery,
  setActiveFilter,
  openCheckoutModal,
  openReturnModal,
  closeModal,
  checkoutBook,
  returnBook,
  contactMemberOverdueCheckouts,
  openContactAcknowledgement,
} from '../store/librarySlice'
import {
  selectBookCounts,
  selectBooksBySearchAndFilter,
  memberHasUncontactedOverdue,
} from '../store/selectors'
import { addDaysISO, todayISO } from '../utils/date'
import { BookCard } from '../components/BookCard'
import { EmptyState } from '../components/EmptyState'
import { CheckoutModal } from '../components/CheckoutModal'
import { ReturnModal } from '../components/ReturnModal'
import { ContactAcknowledgeModal } from '../components/ContactAcknowledgeModal'
import type { FilterType } from '../types'
import type { Checkout } from '../types'

const filterLabels: Array<{ label: string; value: FilterType }> = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Checked out', value: 'checked_out' },
  { label: 'Overdue', value: 'overdue' },
]

type BooksListHeaderProps = {
  counts: { all: number; available: number; checkedOut: number }
  showSearchPanel: boolean
  activeFilter: FilterType
  search: string
  onSearchChange: (value: string) => void
  onFilterChange: (value: FilterType) => void
}

const BooksListHeader = React.memo(function BooksListHeader({
  counts,
  showSearchPanel,
  search,
  activeFilter,
  onSearchChange,
  onFilterChange,
}: BooksListHeaderProps) {
  return (
    <View>
      <Text style={styles.counts}>
        Overview • Total: {counts.all} · Available: {counts.available} · Checked out: {counts.checkedOut}
      </Text>
      {showSearchPanel ? (
        <View style={styles.searchPanel}>
          <View style={styles.searchField}>
            <Ionicons name="search-outline" size={18} color="#64748b" style={styles.inlineIcon} />
            <TextInput
              value={search}
              onChangeText={onSearchChange}
              placeholder="Search by title"
              style={styles.search}
              clearButtonMode="while-editing"
            />
          </View>

          <View style={styles.filterRow}>
            {filterLabels.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.filterChip, activeFilter === item.value && styles.filterChipActive]}
                onPress={() => onFilterChange(item.value)}
              >
                <Text style={[styles.filterText, activeFilter === item.value && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
})

export function BooksScreen() {
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  const search = useAppSelector((state) => state.library.ui.searchQuery)
  const activeFilter = useAppSelector((state) => state.library.ui.activeFilter)
  const books = useAppSelector((state) => state.library.books)
  const members = useAppSelector((state) => state.library.members)
  const checkouts = useAppSelector((state) => state.library.checkouts)
  const { checkoutModalBookId, returnCheckoutId, contactAckBookId, contactAckMemberId } = useAppSelector(
    (state) => state.library.ui,
  )
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const booksListRef = useRef<FlatList>(null)

  const counts = useAppSelector(selectBookCounts)

  const filteredBooks = useAppSelector((state) => selectBooksBySearchAndFilter(state, search, activeFilter))
  const hasUncontactedOverdueForSelectedMember = useAppSelector((state) =>
    memberHasUncontactedOverdue(state, selectedMemberId),
  )

  const checkoutBookData = checkoutModalBookId
    ? books.find((book) => book.id === checkoutModalBookId)
    : null

  const returnCheckout: Checkout | null = returnCheckoutId
    ? checkouts.find((item) => item.id === returnCheckoutId) || null
    : null

  const returnMember = returnCheckout
    ? members.find((member) => member.id === returnCheckout.memberId) || null
    : null

  const filteredMessage = (() => {
    if (!books.length) {
      return 'No books in catalog.'
    }
    if (!filteredBooks.length && search.trim()) {
      return 'No books match this search.'
    }
    if (!filteredBooks.length) {
      return 'No books in this filter.'
    }
    return null
  })()

  const resetCheckoutFlow = () => {
    setSelectedMemberId(null)
    setCheckoutError(null)
  }

  const executeCheckout = (bookId: string, memberId: string) => {
    const book = books.find((item) => item.id === bookId)
    if (!book || book.currentCheckoutId) {
      setCheckoutError('This book is no longer available.')
      return
    }

    const today = todayISO()
    dispatch(
      checkoutBook({
        bookId,
        memberId,
        checkoutDate: today,
        dueDate: addDaysISO(today, 14),
        id: `co-${Date.now()}`,
      }),
    )
    dispatch(closeModal())
    resetCheckoutFlow()
  }

  const handleCheckoutConfirm = () => {
    if (!checkoutModalBookId || !selectedMemberId) {
      setCheckoutError('Select a member to continue.')
      return
    }

    const targetBook = books.find((book) => book.id === checkoutModalBookId)
    if (!targetBook || targetBook.currentCheckoutId) {
      setCheckoutError('This book is no longer available.')
      return
    }

    if (hasUncontactedOverdueForSelectedMember) {
      dispatch(openContactAcknowledgement({ bookId: checkoutModalBookId, memberId: selectedMemberId }))
      return
    }

    executeCheckout(checkoutModalBookId, selectedMemberId)
  }

  const handleContactAcknowledged = () => {
    if (!contactAckBookId || !contactAckMemberId) {
      dispatch(closeModal())
      return
    }

    dispatch(contactMemberOverdueCheckouts(contactAckMemberId))

    const targetBook = books.find((item) => item.id === contactAckBookId)
    if (!targetBook || targetBook.currentCheckoutId) {
      setCheckoutError('This book is no longer available.')
      dispatch(closeModal())
      return
    }

    executeCheckout(contactAckBookId, contactAckMemberId)
  }

  const returnCheckoutBook = returnCheckout?.bookId != null ? books.find((item) => item.id === returnCheckout.bookId) || null : null

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Books',
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowSearchPanel((value) => !value)}
          style={styles.headerAction}
          accessibilityLabel="Toggle search and filter panel"
        >
          <Ionicons name={showSearchPanel ? 'close' : 'search'} size={20} color="#1d4ed8" />
        </TouchableOpacity>
      ),
    })
  }, [navigation, showSearchPanel])

  React.useEffect(() => {
    if (showSearchPanel) {
      booksListRef.current?.scrollToOffset({ offset: 0, animated: true })
    }
  }, [showSearchPanel])

  return (
    <View style={styles.container}>
      <FlatList
        ref={booksListRef}
        data={filteredBooks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <BooksListHeader
            counts={counts}
            showSearchPanel={showSearchPanel}
            search={search}
            activeFilter={activeFilter}
            onSearchChange={(value) => dispatch(setSearchQuery(value))}
            onFilterChange={(value) => dispatch(setActiveFilter(value))}
          />
        }
        ListEmptyComponent={filteredMessage ? <EmptyState message={filteredMessage} /> : null}
        renderItem={({ item }) => {
          const checkout = item.currentCheckoutId
            ? checkouts.find((entry) => entry.id === item.currentCheckoutId)
            : null
          return (
            <BookCard
              book={item}
              checkout={checkout}
              filter={activeFilter}
              onCheckout={() => {
                setCheckoutError(null)
                setSelectedMemberId(null)
                dispatch(openCheckoutModal(item.id))
              }}
              onReturn={() => {
                if (!item.currentCheckoutId) {
                  return
                }
                dispatch(openReturnModal(item.currentCheckoutId))
              }}
            />
          )
        }}
      />
      
      <CheckoutModal
        visible={Boolean(checkoutModalBookId)}
        bookTitle={checkoutBookData?.title ?? ''}
        members={members}
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
        onCancel={() => {
          dispatch(closeModal())
          resetCheckoutFlow()
        }}
        onConfirm={handleCheckoutConfirm}
      />

      <ContactAcknowledgeModal
        visible={Boolean(contactAckBookId)}
        onConfirm={handleContactAcknowledged}
      />

      <ReturnModal
        visible={Boolean(returnCheckoutId)}
        checkout={returnCheckout}
        book={returnCheckoutBook}
        member={returnMember}
        onCancel={() => dispatch(closeModal())}
        onConfirm={() => {
          if (returnCheckout) {
            dispatch(returnBook(returnCheckout.id))
          }
          dispatch(closeModal())
        }}
      />

      {checkoutError ? <Text style={styles.error}>{checkoutError}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3ee',
  },
  counts: { color: '#4b5563', marginBottom: 8 },
  searchPanel: {
    marginBottom: 8,
    gap: 8,
  },
  searchField: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineIcon: { marginRight: 8 },
  search: {
    flex: 1,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  filterText: { color: '#334155' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 },
  error: {
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 12,
  },
})
