import React from 'react'
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native'

type Props = {
  visible: boolean
  onConfirm: () => void
}

export function ContactAcknowledgeModal({ visible, onConfirm }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableWithoutFeedback onPress={() => undefined}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Contact required</Text>
            <Text style={styles.message}>
              This member has overdue book(s). Please confirm you have informed them.
            </Text>
            <TouchableOpacity style={styles.button} onPress={onConfirm}>
              <Text style={styles.buttonText}>Confirmed - Member Contacted</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    width: '100%',
  },
  title: { fontSize: 20, fontWeight: '700' },
  message: {
    marginTop: 8,
    color: '#4b5563',
    marginBottom: 12,
  },
  button: {
    borderRadius: 8,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    paddingVertical: 10,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
})
