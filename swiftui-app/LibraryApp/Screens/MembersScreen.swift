import SwiftUI

struct MembersScreen: View {
  @EnvironmentObject private var store: LibraryStore

  var body: some View {
    ScrollView {
      VStack(spacing: 10) {
        if store.members.isEmpty {
          EmptyStateView(message: "No members available.")
            .padding(.top, 8)
        } else {
          LazyVStack(spacing: 10) {
            ForEach(store.members) { member in
              MemberRow(member: member, store: store)
            }
          }
          .padding(.horizontal, 16)
        }
      }
    }
    .navigationTitle("Members")
    .navigationBarTitleDisplayMode(.inline)
    .onAppear {
      store.setActiveTab(.members)
    }
  }
}

private struct MemberRow: View {
  let member: Member
  @ObservedObject var store: LibraryStore

  private var activeCheckouts: [Checkout] {
    store.activeCheckouts(for: member.id)
  }

  private var activeTitles: [String] {
    activeCheckouts.compactMap { active in
      store.book(id: active.bookId)?.title
    }
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(member.name)
        .font(.headline)

      Text("\(member.memberId) · \(member.email)")
        .font(.caption)
        .foregroundColor(.secondary)

      Text("Active checkouts: \(activeCheckouts.count)")
        .font(.footnote)
        .foregroundColor(.primary)

      if activeTitles.isEmpty {
        Text("No active checkouts.")
          .font(.footnote)
          .foregroundColor(.secondary)
      } else {
        Text("Checked out:")
          .font(.footnote)
          .foregroundColor(.secondary)
        ForEach(activeTitles, id: \.self) { title in
          Text("• \(title)")
            .font(.footnote)
            .foregroundColor(.secondary)
        }
      }
    }
    .padding(12)
    .background(Color(.secondarySystemBackground))
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}
