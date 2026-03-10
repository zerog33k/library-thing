import Foundation

@MainActor
final class LibraryStore: ObservableObject {
  private enum SeedLoadError: Error {
    case missingBundleResource
  }

  @Published var books: [Book] = []
  @Published var members: [Member] = []
  @Published var checkouts: [Checkout] = []
  @Published var ui = LibraryUiState()

  func loadSeedDataIfNeeded() {
    guard books.isEmpty else {
      return
    }
    do {
      let raw = try Self.loadSeedJSONData()
      let decoded = try JSONDecoder().decode(LibrarySeed.self, from: raw)
      books = decoded.books
      members = decoded.members
      checkouts = decoded.checkouts
    } catch {
      print("Unable to load seed data: \(error)")
    }
  }

  private static func loadSeedJSONData() throws -> Data {
    guard let url = Bundle.main.url(forResource: "sci-fi-library-mock-data", withExtension: "json") else {
      throw SeedLoadError.missingBundleResource
    }
    return try Data(contentsOf: url)
  }

  func setActiveTab(_ tab: ActiveTab) {
    ui.activeTab = tab
  }

  func setSearchQuery(_ value: String) {
    ui.searchQuery = value
  }

  func setActiveFilter(_ filter: FilterType) {
    ui.activeFilter = filter
  }

  func openCheckoutModal(for bookId: String) {
    ui.checkoutModalBookId = bookId
    ui.returnCheckoutId = nil
    ui.contactAckBookId = nil
    ui.contactAckMemberId = nil
  }

  func openReturnModal(for checkoutId: String) {
    ui.returnCheckoutId = checkoutId
    ui.checkoutModalBookId = nil
    ui.contactAckBookId = nil
    ui.contactAckMemberId = nil
  }

  func openContactAcknowledgement(bookId: String, memberId: String) {
    ui.contactAckBookId = bookId
    ui.contactAckMemberId = memberId
    ui.checkoutModalBookId = nil
    ui.returnCheckoutId = nil
  }

  func closeModals() {
    ui.checkoutModalBookId = nil
    ui.returnCheckoutId = nil
    ui.contactAckBookId = nil
    ui.contactAckMemberId = nil
  }

  var filteredBooks: [Book] {
    let query = ui.searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

    var result = books
    if !query.isEmpty {
      result = result.filter { $0.title.lowercased().contains(query) }
    }

    switch ui.activeFilter {
    case .all:
      break
    case .available:
      result = result.filter(\.isAvailable)
    case .checkedOut:
      result = result.filter { book in
        guard let checkoutId = book.currentCheckoutId else {
          return !book.isAvailable
        }
        return checkoutById(checkoutId).map(isCheckoutActive) ?? !book.isAvailable
      }
    case .overdue:
      result = result.filter { isBookOverdue($0) }
    }

    return result.sorted { lhs, rhs in
      lhs.title.localizedCaseInsensitiveCompare(rhs.title) == .orderedAscending
    }
  }

  var bookCounts: BookCounts {
    let availableCount = books.filter(\.isAvailable).count
    let checkedOutCount = books.filter { !$0.isAvailable }.count
    let overdueCount = overdueCheckouts.count
    let uncontacted = uncontactedOverdueCheckouts.count
    return BookCounts(
      all: books.count,
      available: availableCount,
      checkedOut: checkedOutCount,
      overdue: overdueCount,
      uncontactedOverdue: uncontacted,
    )
  }

  var overdueCheckouts: [Checkout] {
    checkouts
      .filter(isOverdueActive)
      .sorted {
        let left = LibraryDate.parse($0.dueDate) ?? Date.distantPast
        let right = LibraryDate.parse($1.dueDate) ?? Date.distantPast
        return left < right
      }
  }

  var uncontactedOverdueCheckouts: [Checkout] {
    overdueCheckouts.filter { !$0.contacted }
  }

  var uncontactedOverdueCount: Int {
    uncontactedOverdueCheckouts.count
  }

  var returnCheckout: Checkout? {
    guard let id = ui.returnCheckoutId else {
      return nil
    }
    return checkoutById(id)
  }

  func checkoutByBookId(_ bookId: String) -> Checkout? {
    guard let checkoutId = books.first(where: { $0.id == bookId })?.currentCheckoutId else {
      return nil
    }
    return checkoutById(checkoutId)
  }

  func activeCheckouts(for memberId: String) -> [Checkout] {
    checkouts
      .filter { $0.memberId == memberId && isCheckoutActive($0) }
      .sorted {
        let left = LibraryDate.parse($0.checkoutDate) ?? Date.distantPast
        let right = LibraryDate.parse($1.checkoutDate) ?? Date.distantPast
        return left > right
      }
  }

  func memberHasUncontactedOverdue(_ memberId: String) -> Bool {
    return activeOverdueByMember(memberId)
      .contains(where: { !$0.contacted })
  }

  func activeOverdueByMember(_ memberId: String) -> [Checkout] {
    checkouts
      .filter { $0.memberId == memberId }
      .filter(isOverdueActive)
      .sorted {
        let left = LibraryDate.parse($0.dueDate) ?? Date.distantPast
        let right = LibraryDate.parse($1.dueDate) ?? Date.distantPast
        return left < right
      }
  }

  func startCheckout(bookId: String, memberId: String) -> CheckoutFlowResult {
    guard let book = book(id: bookId), book.isAvailable else {
      return .unavailable
    }

    if memberHasUncontactedOverdue(memberId) {
      openContactAcknowledgement(bookId: bookId, memberId: memberId)
      return .needsContactAcknowledgement
    }

    return checkoutBook(bookId: bookId, memberId: memberId) ? .completed : .unavailable
  }

  func confirmContactAcknowledgement() -> Bool {
    guard
      let bookId = ui.contactAckBookId,
      let memberId = ui.contactAckMemberId
    else {
      closeModals()
      return false
    }

    contactMemberOverdueCheckouts(memberId)
    let success = checkoutBook(bookId: bookId, memberId: memberId)
    if !success {
      ui.contactAckBookId = nil
      ui.contactAckMemberId = nil
    }
    return success
  }

  @discardableResult
  func checkoutBook(bookId: String, memberId: String) -> Bool {
    guard let bookIndex = books.firstIndex(where: { $0.id == bookId }) else {
      return false
    }
    guard books[bookIndex].isAvailable else {
      return false
    }

    let checkoutId = "co-\(Int(Date().timeIntervalSince1970 * 1000))"
    let today = LibraryDate.todayISO()
    let due = LibraryDate.addDays(today, days: 14)

    let checkout = Checkout(
      id: checkoutId,
      bookId: bookId,
      memberId: memberId,
      checkoutDate: today,
      dueDate: due,
      returnedDate: nil,
      notes: nil,
      contacted: false,
      contactedAt: nil,
    )

    checkouts.append(checkout)
    books[bookIndex].isAvailable = false
    books[bookIndex].currentCheckoutId = checkoutId
    closeModals()
    return true
  }

  @discardableResult
  func returnBook(_ checkoutId: String) -> Bool {
    guard let index = checkouts.firstIndex(where: { $0.id == checkoutId }) else {
      return false
    }
    if checkouts[index].returnedDate != nil {
      return false
    }

    checkouts[index].returnedDate = LibraryDate.todayISO()

    if let bookIndex = books.firstIndex(where: { $0.id == checkouts[index].bookId }) {
      books[bookIndex].isAvailable = true
      if books[bookIndex].currentCheckoutId == checkoutId {
        books[bookIndex].currentCheckoutId = nil
      }
    }

    if ui.returnCheckoutId == checkoutId {
      ui.returnCheckoutId = nil
    }
    return true
  }

  func contactMemberOverdueCheckouts(_ memberId: String) {
    let now = LibraryDate.todayISO()
    for index in checkouts.indices {
      if checkouts[index].memberId == memberId
        && isCheckoutActive(checkouts[index])
        && !checkouts[index].contacted
        && LibraryDate.isOverdue(checkouts[index].dueDate) {
        checkouts[index].contacted = true
        checkouts[index].contactedAt = now
      }
    }
  }

  @discardableResult
  func contactCheckout(_ checkoutId: String) -> Bool {
    guard let index = checkouts.firstIndex(where: { $0.id == checkoutId }) else {
      return false
    }
    if checkouts[index].returnedDate != nil {
      return false
    }
    if checkouts[index].contacted || !LibraryDate.isOverdue(checkouts[index].dueDate) {
      return false
    }

    checkouts[index].contacted = true
    checkouts[index].contactedAt = LibraryDate.todayISO()
    return true
  }

  func book(id: String) -> Book? {
    books.first(where: { $0.id == id })
  }

  func member(id: String) -> Member? {
    members.first(where: { $0.id == id })
  }

  func checkoutById(_ id: String) -> Checkout? {
    checkouts.first(where: { $0.id == id })
  }

  private func isCheckoutActive(_ checkout: Checkout) -> Bool {
    checkout.returnedDate == nil
  }

  private func isCheckoutOverdue(_ checkout: Checkout) -> Bool {
    isCheckoutActive(checkout) && LibraryDate.isOverdue(checkout.dueDate)
  }

  private func isCheckoutActiveAndOverdue(_ checkout: Checkout) -> Bool {
    isCheckoutOverdue(checkout)
  }

  private func isBookOverdue(_ book: Book) -> Bool {
    if let checkout = checkoutByBookId(book.id) {
      return isCheckoutOverdue(checkout)
    }
    return false
  }

  private func isOverdueActive(_ checkout: Checkout) -> Bool {
    isCheckoutActiveAndOverdue(checkout)
  }
}
