import SwiftUI

@main
struct LibraryAppApp: App {
  @StateObject private var store = {
    let store = LibraryStore()
    store.loadSeedDataIfNeeded()
    return store
  }()

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
