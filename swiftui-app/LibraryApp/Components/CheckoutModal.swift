import SwiftUI

struct CheckoutModal: View {
  let bookTitle: String
  let members: [Member]
  @Binding var selectedMemberId: String?
  let onCancel: () -> Void
  let onConfirm: () -> Void
  let isEnabled: Bool
  let message: String?

  init(
    bookTitle: String,
    members: [Member],
    selectedMemberId: Binding<String?>,
    isEnabled: Bool = true,
    message: String? = nil,
    onCancel: @escaping () -> Void,
    onConfirm: @escaping () -> Void
  ) {
    self.bookTitle = bookTitle
    self.members = members
    self._selectedMemberId = selectedMemberId
    self.isEnabled = isEnabled
    self.message = message
    self.onCancel = onCancel
    self.onConfirm = onConfirm
  }

  var body: some View {
    CenteredModalCard {
      VStack(alignment: .leading, spacing: 12) {
        Text("Checkout Book")
          .font(.headline)

        Text("Book: \(bookTitle)")
          .font(.subheadline)
          .foregroundColor(.secondary)

        if let message = message {
          Text(message)
            .font(.footnote)
            .foregroundColor(.secondary)
        }

        Divider()

        Text("Select member")
          .font(.subheadline)
          .fontWeight(.semibold)

        ScrollView {
          LazyVStack(alignment: .leading, spacing: 8) {
            ForEach(members) { member in
              Button(action: {
                if selectedMemberId == member.id {
                  selectedMemberId = nil
                } else {
                  selectedMemberId = member.id
                }
              }) {
                HStack {
                  VStack(alignment: .leading) {
                    Text(member.name)
                      .font(.body)
                      .foregroundColor(.primary)
                    Text("\(member.memberId) • \(member.email)")
                      .font(.caption)
                      .foregroundColor(.secondary)
                  }

                  Spacer()

                  if selectedMemberId == member.id {
                    Image(systemName: "checkmark.circle.fill")
                      .foregroundColor(.blue)
                  }
                }
                .padding(12)
                .background(
                  RoundedRectangle(cornerRadius: 10)
                    .stroke(selectedMemberId == member.id ? Color.blue : Color(UIColor.separator)),
                )
              }
            }
          }
        }
        .frame(maxHeight: 220)

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
            Text("Confirm checkout")
              .frame(maxWidth: .infinity)
              .padding(.vertical, 10)
              .foregroundColor(.white)
              .background(selectedMemberId == nil || !isEnabled ? Color.gray : Color.blue)
              .clipShape(RoundedRectangle(cornerRadius: 10))
          }
          .disabled(selectedMemberId == nil || !isEnabled)
          .buttonStyle(.plain)
        }
      }
    }
  }
}

struct CheckoutModal_Previews: PreviewProvider {
  static var previews: some View {
    CheckoutModal(
      bookTitle: "Dune",
      members: [
        Member(id: "m-1", name: "Ari Patel", memberId: "LB-1001", email: "ari.patel@example.com"),
      ],
      selectedMemberId: .constant("m-1"),
      onCancel: {},
      onConfirm: {},
    )
  }
}

