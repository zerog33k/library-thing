import SwiftUI

struct ReturnModal: View {
  let checkout: Checkout
  let book: Book?
  let member: Member?
  let onCancel: () -> Void
  let onConfirm: () -> Void

  var body: some View {
    CenteredModalCard {
      VStack(alignment: .leading, spacing: 12) {
        Text("Return Book")
          .font(.headline)

        Text("Book: \(book?.title ?? "Unknown")")
          .font(.body)
        Text("Borrower: \(member?.name ?? "Unknown")")
          .font(.body)
          .foregroundColor(.secondary)
        Text("Checkout: \(checkout.checkoutDate)")
          .font(.caption)
          .foregroundColor(.secondary)
        Text("Due: \(checkout.dueDate)")
          .font(.caption)
          .foregroundColor(.secondary)

        HStack(spacing: 10) {
          Button(action: onCancel) {
            Text("Cancel")
              .frame(maxWidth: .infinity)
              .padding(.vertical, 10)
              .foregroundColor(.primary)
              .overlay(
                RoundedRectangle(cornerRadius: 10)
                  .stroke(Color(UIColor.separator)),
              )
          }
          .buttonStyle(.plain)

          Button(action: onConfirm) {
            Text("Confirm return")
              .frame(maxWidth: .infinity)
              .padding(.vertical, 10)
              .foregroundColor(.white)
              .background(Color.black)
              .clipShape(RoundedRectangle(cornerRadius: 10))
          }
          .buttonStyle(.plain)
        }
      }
    }
  }
}

