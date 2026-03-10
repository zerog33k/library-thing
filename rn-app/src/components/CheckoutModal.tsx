import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
} from 'react-native'
import type { Member } from '../types'

type Props = {
  visible: boolean
  bookTitle: string
  members: Member[]
  selectedMemberId: string | null
  onSelectMember: (id: string) => void
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
}

export function CheckoutModal({
  visible,
  bookTitle,
  members,
  selectedMemberId,
  onSelectMember,
  onCancel,
  onConfirm,
  confirmLabel,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <Text style={styles.title}>Checkout</Text>
              <Text style={styles.subtitle}>Book: {bookTitle || 'Unknown'}</Text>
              <Text style={styles.label}>Select member</Text>

              <FlatList
                data={members}
                keyExtractor={(member) => member.id}
                style={styles.memberList}
                renderItem={({ item }) => {
                  const active = item.id === selectedMemberId
                  return (
                    <TouchableOpacity
                      onPress={() => onSelectMember(item.id)}
                      style={[styles.memberRow, active && styles.memberRowActive]}
                    >
                      <Text style={styles.memberText}>{item.name}</Text>
                      <Text style={styles.memberMeta}>{item.memberId}</Text>
                    </TouchableOpacity>
                  )
                }}
                ListEmptyComponent={<Text style={styles.memberMeta}>No members available.</Text>}
              />

              <View style={styles.row}>
                <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, !selectedMemberId && styles.disabledButton]}
                  onPress={onConfirm}
                  disabled={!selectedMemberId}
                >
                  <Text style={styles.primaryButtonText}>{confirmLabel || 'Confirm checkout'}</Text>
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
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 560,
    borderRadius: 14,
    padding: 16,
    minHeight: 350,
    maxHeight: '84%',
  },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { marginTop: 6, color: '#4b5563' },
  label: { marginTop: 12, marginBottom: 4, fontWeight: '600' },
  memberList: { maxHeight: 170, marginBottom: 8 },
  memberRow: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  memberRowActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  memberText: { fontWeight: '600' },
  memberMeta: { color: '#6b7280', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButtonText: { color: '#111827', fontWeight: '700' },
  disabledButton: {
    opacity: 0.4,
  },
})
