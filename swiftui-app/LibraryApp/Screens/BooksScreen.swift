import SwiftUI

struct BooksScreen: View {
  @EnvironmentObject private var store: LibraryStore
  @State private var selectedMemberId: String?
  @State private var checkoutError: String?
  @State private var showSearchPanel = false

  private let columns = [GridItem(.adaptive(minimum: 110), spacing: 8)]

  private var filteredBooks: [Book] {
    store.filteredBooks
  }

  private var checkoutBook: Book? {
    guard let id = store.ui.checkoutModalBookId else {
      return nil
    }
    return store.book(id: id)
  }

  private var emptyMessage: String? {
    if filteredBooks.isEmpty {
      if store.books.isEmpty {
        return "No books in catalog."
      }
      if !store.ui.searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
        return "No books match this search."
      }
      return "No books in this filter."
    }
    return nil
  }

  private var selectedMemberForMessage: String {
    selectedMemberId.flatMap { id in
      store.members.first(where: { $0.id == id })?.name
    } ?? "None selected"
  }

  private var searchBinding: Binding<String> {
    Binding(
      get: { store.ui.searchQuery },
      set: { store.setSearchQuery($0) },
    )
  }

  private func showSearchPanelAction() {
    withAnimation {
      showSearchPanel.toggle()
    }
  }

  var body: some View {
    ScrollViewReader { proxy in
      ScrollView {
        VStack(alignment: .leading, spacing: 12) {
          overviewSection
            .id("books-overview")

          if showSearchPanel {
            searchPanel
          }

          if let message = emptyMessage {
            EmptyStateView(message: message)
              .padding(.horizontal, 8)
          } else {
            LazyVStack(spacing: 10) {
              ForEach(filteredBooks) { book in
                let checkout = book.currentCheckoutId.flatMap(store.checkoutById)
                BookRowView(
                  book: book,
                  checkout: checkout,
                  onCheckout: {
                    checkoutError = nil
                    selectedMemberId = nil
                    store.openCheckoutModal(for: book.id)
                  },
                  onReturn: {
                    if let checkoutId = book.currentCheckoutId {
                      store.openReturnModal(for: checkoutId)
                    }
                  },
                )
              }
            }
          }
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 18)
      }
      .overlay(alignment: .top, content: {
        if let book = checkoutBook {
          CheckoutModal(
            bookTitle: book.title,
            members: store.members,
            selectedMemberId: $selectedMemberId,
            isEnabled: true,
            message: "Selected member: \(selectedMemberForMessage)",
            onCancel: {
              selectedMemberId = nil
              checkoutError = nil
              store.closeModals()
            },
            onConfirm: {
              guard let memberId = selectedMemberId else {
                checkoutError = "Select a member to continue."
                return
              }

              let result = store.startCheckout(bookId: book.id, memberId: memberId)
              switch result {
              case .completed:
                selectedMemberId = nil
                checkoutError = nil
              case .needsContactAcknowledgement:
                checkoutError = nil
              case .unavailable:
                checkoutError = "This book is no longer available."
              }
            },
          )
          .overlay(alignment: .topTrailing) {
            if let error = checkoutError {
              Text(error)
                .padding(6)
                .foregroundColor(.red)
                .font(.caption)
                .background(
                  RoundedRectangle(cornerRadius: 8)
                    .fill(Color.yellow.opacity(0.15)),
                )
                .padding(.top, 6)
                .padding(.trailing, 12)
            }
          }
        } else if store.ui.contactAckBookId != nil {
          ContactAcknowledgementModal {
            let success = store.confirmContactAcknowledgement()
            if !success {
              checkoutError = "This book is no longer available."
            }
            selectedMemberId = nil
          }
        }
      })
      .navigationTitle("Books")
      .toolbar {
        ToolbarItem(placement: .navigationBarTrailing) {
          Button(action: showSearchPanelAction) {
            Image(systemName: showSearchPanel ? "xmark" : "magnifyingglass")
          }
        }
      }
      .onChange(of: showSearchPanel) { shown in
        if shown {
          withAnimation {
            proxy.scrollTo("books-overview", anchor: .top)
          }
        }
      }
    }
  }

  private var overviewSection: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("Overview • Total: \(store.bookCounts.all) · Available: \(store.bookCounts.available) · Checked out: \(store.bookCounts.checkedOut)")
        .font(.subheadline)
        .foregroundColor(.secondary)

      if let error = checkoutError, store.ui.checkoutModalBookId != nil {
        Text(error)
          .font(.caption)
          .foregroundColor(.red)
      }
    }
  }

  private var searchPanel: some View {
    VStack(alignment: .leading, spacing: 10) {
      TextField("Search by title", text: searchBinding)
        .textFieldStyle(.roundedBorder)

      LazyVGrid(columns: columns, alignment: .leading, spacing: 8) {
        ForEach(FilterType.allCases) { filter in
          Button(action: { store.setActiveFilter(filter) }) {
            Text(filter.label)
              .font(.subheadline)
              .fontWeight(store.ui.activeFilter == filter ? .semibold : .regular)
              .foregroundStyle(store.ui.activeFilter == filter ? .white : .primary)
              .padding(.horizontal, 12)
              .padding(.vertical, 8)
              .background(
                RoundedRectangle(cornerRadius: 16)
                  .fill(store.ui.activeFilter == filter ? Color.blue : Color(.secondarySystemBackground)),
              )
              .overlay(
                RoundedRectangle(cornerRadius: 16)
                  .stroke(Color.gray.opacity(0.3)),
              )
          }
          .buttonStyle(.plain)
        }
      }
    }
    .padding(12)
    .background(Color(.secondarySystemBackground))
    .clipShape(RoundedRectangle(cornerRadius: 12))
    .shadow(color: Color.black.opacity(0.06), radius: 4, x: 0, y: 2)
  }
}
