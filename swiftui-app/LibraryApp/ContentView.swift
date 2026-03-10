import SwiftUI

struct ContentView: View {
  @EnvironmentObject private var store: LibraryStore

  var body: some View {
    TabView(selection: $store.ui.activeTab) {
      NavigationStack {
        BooksScreen()
      }
      .tabItem {
        Label("Books", systemImage: "books.vertical.fill")
      }
      .tag(ActiveTab.books)

      NavigationStack {
        OverdueScreen()
      }
      .tabItem {
        Label("Overdue", systemImage: "exclamationmark.circle.fill")
      }
      .badge(store.uncontactedOverdueCount)
      .tag(ActiveTab.overdue)

      NavigationStack {
        MembersScreen()
      }
      .tabItem {
        Label("Members", systemImage: "person.3.fill")
      }
      .tag(ActiveTab.members)
    }
    .overlay {
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
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color(.systemBackground).ignoresSafeArea())
  }
}

struct ContentView_Previews: PreviewProvider {
  static var previews: some View {
    ContentView()
      .environmentObject(LibraryStore())
  }
}
