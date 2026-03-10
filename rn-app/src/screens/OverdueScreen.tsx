import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectUncontactedOverdueCheckouts, selectOverdueCheckouts } from '../store/selectors'
import { daysOverdue, todayISO } from '../utils/date'
import { openReturnModal, contactCheckout } from '../store/librarySlice'
import { EmptyState } from '../components/EmptyState'
import type { Checkout } from '../types'

export function OverdueScreen() {
  const dispatch = useAppDispatch()
  const state = useAppSelector((s) => s.library)
  const overdue = useAppSelector(selectOverdueCheckouts)
  const uncontacted = useAppSelector(selectUncontactedOverdueCheckouts)
  const today = todayISO()

  const getBookTitle = (bookId: string) =>
    state.books.find((book) => book.id === bookId)?.title ?? 'Unknown book'

  const getMemberName = (memberId: string) =>
    state.members.find((member) => member.id === memberId)?.name ?? 'Unknown member'

  const renderItem = ({ item }: { item: Checkout }) => {
    const overdueDays = daysOverdue(item.dueDate, today)
    const contactLabel = item.contacted ? 'Contacted' : 'Uncontacted'

    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{getBookTitle(item.bookId)}</Text>
          <Text style={styles.meta}>Member: {getMemberName(item.memberId)}</Text>
          <Text style={styles.meta}>Due: {item.dueDate} · {overdueDays} days overdue</Text>
          <Text style={[styles.meta, { color: item.contacted ? '#15803d' : '#b91c1c' }]}> {contactLabel}</Text>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => dispatch(openReturnModal(item.id))}
          >
            <Text style={styles.secondaryButtonText}>Return</Text>
          </TouchableOpacity>
          {!item.contacted ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => dispatch(contactCheckout(item.id))}
            >
              <Text style={styles.primaryButtonText}>Contact Member</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    )
  }

  const emptyMessage =
    overdue.length === 0
      ? 'No overdue books.'
      : uncontacted.length === 0
        ? 'No uncontacted overdue books.'
        : null

  return (
    <View style={styles.container}>
      <FlatList
        data={overdue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          emptyMessage ? <EmptyState message={emptyMessage} /> : null
        }
      />
      {__DEV__ ? (
        <Text style={styles.footerText}>Uncontacted overdue count: {uncontacted.length}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 12 },
  list: { paddingBottom: 20 },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#4b5563', marginTop: 4 },
  row: { alignItems: 'flex-end' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  secondaryButtonText: { fontWeight: '600' },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  footerText: { textAlign: 'center', color: '#6b7280', marginTop: 8 },
})
