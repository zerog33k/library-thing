import SwiftUI

struct ContentView: View {
  @EnvironmentObject private var store: LibraryStore

  var body: some View {
    ZStack {
      TabView(selection: $store.ui.activeTab) {
        NavigationStack {
          BooksScreen()
            .navigationTitle("Books")
            .onAppear { store.setActiveTab(.books) }
        }
        .tabItem {
          Label("Books", systemImage: "books.vertical.fill")
        }
        .tag(ActiveTab.books)

        NavigationStack {
          OverdueScreen()
            .navigationTitle("Overdue")
            .onAppear { store.setActiveTab(.overdue) }
        }
        .tabItem {
          Label("Overdue", systemImage: "exclamationmark.circle.fill")
        }
        .badge(store.uncontactedOverdueCount)
        .tag(ActiveTab.overdue)

        NavigationStack {
          MembersScreen()
            .navigationTitle("Members")
            .onAppear { store.setActiveTab(.members) }
        }
        .tabItem {
          Label("Members", systemImage: "person.3.fill")
        }
        .tag(ActiveTab.members)
      }

      if let returnCheckout = store.returnCheckout {
        ReturnModal(
          checkout: returnCheckout,
          book: store.book(id: returnCheckout.bookId),
          member: store.member(id: returnCheckout.memberId),
          onCancel: {
            store.closeModals()
          },
          onConfirm: {
            store.returnBook(returnCheckout.id)
            store.closeModals()
          },
        )
      }
    }
  }
}

struct ContentView_Previews: PreviewProvider {
  static var previews: some View {
    ContentView()
      .environmentObject(LibraryStore())
  }
}
