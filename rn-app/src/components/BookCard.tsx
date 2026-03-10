import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Book, FilterType } from '../types'
import { isOverdue, todayISO } from '../utils/date'
import type { Checkout } from '../types'

type Props = {
  book: Book
  checkout?: Checkout | null
  onCheckout: () => void
  onReturn: () => void
  filter: FilterType
}

export function BookCard({ book, checkout, onCheckout, onReturn, filter }: Props) {
  const showCheckout = filter === 'available' || !checkout
  const status = checkout
    ? (isOverdue(checkout.dueDate, todayISO()) ? 'Overdue' : 'Checked out')
    : 'Available'

  return (
    <View style={styles.card}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.subtitle}>{book.author}</Text>
        <Text style={styles.meta}>Status: {status}</Text>
        {checkout ? <Text style={styles.meta}>Due: {checkout.dueDate}</Text> : null}
      </View>
      <TouchableOpacity
        style={showCheckout ? styles.checkoutButton : styles.returnButton}
        onPress={showCheckout ? onCheckout : onReturn}
      >
        <Text style={styles.buttonLabel}>{showCheckout ? 'Check out' : 'Return'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#4b5563', marginTop: 4 },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  checkoutButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  returnButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
})
