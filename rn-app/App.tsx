import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { Provider } from 'react-redux'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { store } from './src/store'
import { initializeLibrary, setActiveTab } from './src/store/librarySlice'
import { selectUncontactedOverdueCheckouts } from './src/store/selectors'
import { seedData } from './src/data'
import { BooksScreen } from './src/screens/BooksScreen'
import { OverdueScreen } from './src/screens/OverdueScreen'
import { MembersScreen } from './src/screens/MembersScreen'
import { useAppDispatch, useAppSelector } from './src/store/hooks'
import type { TabName } from './src/types'

const Tabs = createBottomTabNavigator()

function tabIcon(name: TabName, color: string, size: number) {
  if (name === 'books') {
    return <Ionicons name="library-outline" size={size} color={color} />
  }
  if (name === 'overdue') {
    return <Ionicons name="alert-circle-outline" size={size} color={color} />
  }
  return <Ionicons name="people-outline" size={size} color={color} />
}

function LibraryRoot() {
  const dispatch = useAppDispatch()
  const activeTab = useAppSelector((state) => state.library.ui.activeTab)
  const overdueUncontactedCount = useAppSelector((state) => selectUncontactedOverdueCheckouts(state).length)
  const initialized = useAppSelector((state) => state.library.books.length > 0)

  useEffect(() => {
    if (!initialized) {
      dispatch(initializeLibrary(seedData))
    }
  }, [dispatch, initialized])

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#f3f4f6" />
        <Tabs.Navigator
          initialRouteName={activeTab}
          screenOptions={({ route }) => ({
            headerShown: true,
            headerStyle: { backgroundColor: '#f8fafc' },
            headerTintColor: '#0f172a',
            headerTitleStyle: { fontWeight: '600' },
            tabBarActiveTintColor: '#1d4ed8',
            tabBarInactiveTintColor: '#64748b',
            tabBarIcon: ({ color, size }) => tabIcon(route.name as TabName, color, size),
          })}
        >
          <Tabs.Screen
            name="books"
            component={BooksScreen}
            listeners={{
              focus: () => {
                dispatch(setActiveTab('books'))
              },
            }}
            options={{
              title: 'Books',
              tabBarLabel: 'Books',
            }}
          />
          <Tabs.Screen
            name="overdue"
            component={OverdueScreen}
            listeners={{
              focus: () => {
                dispatch(setActiveTab('overdue'))
              },
            }}
            options={{
              title: 'Overdue',
              tabBarLabel: 'Overdue',
              tabBarBadge: overdueUncontactedCount || undefined,
            }}
          />
          <Tabs.Screen
            name="members"
            component={MembersScreen}
            listeners={{
              focus: () => {
                dispatch(setActiveTab('members'))
              },
            }}
            options={{
              title: 'Members',
              tabBarLabel: 'Members',
            }}
          />
        </Tabs.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <LibraryRoot />
    </Provider>
  )
}

export {}
