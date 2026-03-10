import SwiftUI

struct CenteredModalCard<Content: View>: View {
  let content: Content

  init(@ViewBuilder content: () -> Content) {
    self.content = content()
  }

  var body: some View {
    ZStack {
      Color.black.opacity(0.35)
        .ignoresSafeArea()
      content
        .padding(20)
        .frame(maxWidth: 560)
        .background(
          RoundedRectangle(cornerRadius: 16)
            .fill(Color(UIColor.systemBackground)),
        )
        .padding(.horizontal, 24)
        .shadow(color: .black.opacity(0.24), radius: 10, x: 0, y: 5)
    }
    .transition(.opacity)
  }
}
