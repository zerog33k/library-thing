import SwiftUI

struct ContactAcknowledgementModal: View {
  let onConfirm: () -> Void

  var body: some View {
    CenteredModalCard {
      VStack(alignment: .leading, spacing: 16) {
        Text("Contact Member")
          .font(.headline)

        Text("This member has overdue book(s). Please confirm you have informed them.")
          .font(.body)

        Button(action: onConfirm) {
          Text("Confirmed - Member Contacted")
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .foregroundColor(.white)
            .background(Color.blue)
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(.plain)
      }
      .padding(.top, 2)
    }
  }
}

