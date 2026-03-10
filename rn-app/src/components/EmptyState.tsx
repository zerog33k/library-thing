import React from 'react'
import { Text, View, StyleSheet } from 'react-native'

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },
  message: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
})
