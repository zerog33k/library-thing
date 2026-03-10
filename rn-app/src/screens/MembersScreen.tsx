import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { useAppSelector } from '../store/hooks'
import { EmptyState } from '../components/EmptyState'

export function MembersScreen() {
  const members = useAppSelector((state) => state.library.members)
  const checkouts = useAppSelector((state) => state.library.checkouts)
  const books = useAppSelector((state) => state.library.books)

  const membersWithCheckoutSummary = members.map((member) => {
    const activeCheckouts = checkouts.filter((checkout) => checkout.memberId === member.id && checkout.returnedDate === null)
    const checkedOutTitles = activeCheckouts
      .map((checkout) => books.find((book) => book.id === checkout.bookId)?.title ?? 'Unknown book')
      .filter(Boolean)

    return {
      ...member,
      checkedOutCount: activeCheckouts.length,
      checkedOutTitles,
    }
  })

  return (
    <View style={styles.container}>
      <FlatList
        data={membersWithCheckoutSummary}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const summaryText =
            item.checkedOutCount === 0
              ? 'No checked-out books'
              : `${item.checkedOutCount} checked-out book${item.checkedOutCount === 1 ? '' : 's'}`

          return (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>ID: {item.memberId}</Text>
              <Text style={styles.meta}>Email: {item.email}</Text>
              <Text style={styles.meta}>Active checkouts: {summaryText}</Text>
              {item.checkedOutTitles.length > 0 ? (
                <Text style={styles.summary}>{item.checkedOutTitles.join(', ')}</Text>
              ) : null}
            </View>
          )
        }}
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
  summary: { color: '#334155', marginTop: 6, fontSize: 12 },
})
