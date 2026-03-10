import SwiftUI

@main
struct LibraryAppApp: App {
  @StateObject private var store = LibraryStore()

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(store)
        .onAppear {
          store.loadSeedDataIfNeeded()
        }
    }
  }
}

