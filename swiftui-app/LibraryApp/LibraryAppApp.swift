import SwiftUI
import UIKit

@main
struct LibraryAppApp: App {
  @StateObject private var store = {
    let store = LibraryStore()
    store.loadSeedDataIfNeeded()
    return store
  }()

  init() {
    configureSystemBarAppearance()
  }

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(store)
        .onAppear {
          store.loadSeedDataIfNeeded()
      }
    }
  }

  private func configureSystemBarAppearance() {
    let navAppearance = UINavigationBarAppearance()
    navAppearance.configureWithOpaqueBackground()
    navAppearance.backgroundColor = .systemBackground

    let navBar = UINavigationBar.appearance()
    navBar.prefersLargeTitles = false
    navBar.standardAppearance = navAppearance
    navBar.compactAppearance = navAppearance
    navBar.scrollEdgeAppearance = navAppearance

    let tabAppearance = UITabBarAppearance()
    tabAppearance.configureWithOpaqueBackground()
    tabAppearance.backgroundColor = .systemBackground

    let tabBar = UITabBar.appearance()
    tabBar.isTranslucent = false
    tabBar.standardAppearance = tabAppearance
    tabBar.scrollEdgeAppearance = tabAppearance
  }
}
