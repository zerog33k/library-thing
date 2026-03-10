import SwiftUI

struct BookRowView: View {
  let book: Book
  let checkout: Checkout?
  let onCheckout: () -> Void
  let onReturn: () -> Void

  private var status: String {
    if book.isAvailable {
      return "Available"
    }

    guard let checkout else {
      return "Checked out"
    }

    if LibraryDate.isOverdue(checkout.dueDate) {
      return "Overdue"
    }

    return "Checked out"
  }

  private var statusColor: Color {
    if book.isAvailable {
      return .green
    }
    if LibraryDate.isOverdue(checkout?.dueDate ?? "") {
      return .red
    }
    return .orange
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 4) {
          Text(book.title)
            .font(.headline)
          Text(book.author)
            .foregroundColor(.secondary)
          Text(status)
            .font(.footnote)
            .foregroundColor(statusColor)
            .fontWeight(.semibold)
          if let checkout, !book.isAvailable {
            Text("Due: \(LibraryDate.display(checkout.dueDate))")
              .font(.caption)
              .foregroundColor(.secondary)
          }
        }
        Spacer()
      }

      HStack {
        if book.isAvailable {
          Button("Check out") {
            onCheckout()
          }
          .buttonStyle(.borderedProminent)
        } else {
          Button("Return") {
            onReturn()
          }
          .buttonStyle(.bordered)
        }
      }
    }
    .padding(12)
    .background(Color(.secondarySystemBackground))
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}

