import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { useAppSelector } from '../store/hooks'
import { EmptyState } from '../components/EmptyState'

export function MembersScreen() {
  const members = useAppSelector((state) => state.library.members)

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>ID: {item.memberId}</Text>
            <Text style={styles.meta}>Email: {item.email}</Text>
          </View>
        )}
        ListEmptyComponent={<EmptyState message="No members available." />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 12 },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
    padding: 12,
  },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#6b7280', marginTop: 4 },
})
