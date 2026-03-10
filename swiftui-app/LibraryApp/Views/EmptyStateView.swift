import SwiftUI

struct EmptyStateView: View {
  let message: String

  var body: some View {
    VStack(spacing: 10) {
      Text(message)
        .font(.subheadline)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 28)
  }
}

