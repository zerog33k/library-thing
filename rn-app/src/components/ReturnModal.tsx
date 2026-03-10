import React from 'react'
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native'
import type { Checkout, Book, Member } from '../types'

type Props = {
  visible: boolean
  checkout: Checkout | null
  book: Book | null
  member: Member | null
  onCancel: () => void
  onConfirm: () => void
}

export function ReturnModal({ visible, checkout, book, member, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <Text style={styles.title}>Return Book</Text>
              <Text style={styles.rowText}>Book: {book?.title ?? 'Unknown'}</Text>
              <Text style={styles.rowText}>Borrower: {member?.name ?? 'Unknown'}</Text>
              <Text style={styles.rowText}>Checkout: {checkout?.checkoutDate ?? ''}</Text>
              <Text style={styles.rowText}>Due: {checkout?.dueDate ?? ''}</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={onConfirm}>
                  <Text style={styles.primaryButtonText}>Confirm return</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: '700' },
  rowText: { marginTop: 8, color: '#4b5563' },
  actions: { marginTop: 14, flexDirection: 'row', gap: 8 },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: { color: '#111827', fontWeight: '700' },
})
