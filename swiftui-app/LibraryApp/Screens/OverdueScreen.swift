import SwiftUI

struct OverdueScreen: View {
  @EnvironmentObject private var store: LibraryStore

  private var overdue: [Checkout] {
    store.overdueCheckouts
  }

  var body: some View {
    ScrollView {
      VStack(spacing: 10) {
        if overdue.isEmpty {
          EmptyStateView(message: "No overdue books.")
            .padding(.top, 8)
        } else {
          if store.uncontactedOverdueCheckouts.isEmpty {
            Text("No uncontacted overdue books.")
              .font(.subheadline)
              .foregroundColor(.secondary)
              .frame(maxWidth: .infinity, alignment: .leading)
              .padding(.horizontal, 8)
          }

          LazyVStack(spacing: 10) {
            ForEach(overdue) { checkout in
              OverdueRow(checkout: checkout, store: store)
            }
          }
          .padding(.horizontal, 16)
        }
      }
    }
    .navigationTitle("Overdue")
    .navigationBarTitleDisplayMode(.inline)
    .onAppear {
      store.setActiveTab(.overdue)
    }
  }
}

private struct OverdueRow: View {
  let checkout: Checkout
  @ObservedObject var store: LibraryStore

  private var memberName: String {
    store.members.first(where: { $0.id == checkout.memberId })?.name ?? "Unknown member"
  }

  private var bookTitle: String {
    store.books.first(where: { $0.id == checkout.bookId })?.title ?? "Unknown book"
  }

  private var overdueDays: Int {
    LibraryDate.overdueDays(for: checkout.dueDate)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      VStack(alignment: .leading, spacing: 4) {
        Text(bookTitle)
          .font(.headline)
        Text("Member: \(memberName)")
          .foregroundColor(.secondary)
        Text("Due: \(LibraryDate.display(checkout.dueDate)) · \(overdueDays) days overdue")
          .font(.caption)
          .foregroundColor(.secondary)

        Text(checkout.contacted ? "Contacted" : "Uncontacted")
          .font(.caption)
          .fontWeight(.semibold)
          .foregroundColor(checkout.contacted ? .green : .red)
      }

      HStack {
        Button("Return") {
          store.openReturnModal(for: checkout.id)
        }
        .buttonStyle(.bordered)

        if !checkout.contacted {
          Button("Contact Member") {
            _ = store.contactCheckout(checkout.id)
          }
          .buttonStyle(.borderedProminent)
        }
      }
    }
    .padding(12)
    .background(Color(.secondarySystemBackground))
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}
