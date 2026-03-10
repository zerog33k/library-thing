import Foundation

struct LibrarySeed: Codable {
  let generatedAt: String
  let books: [Book]
  let members: [Member]
  let checkouts: [Checkout]
}

struct Book: Identifiable, Codable, Equatable {
  let id: String
  let title: String
  let author: String
  let isbn: String
  let genre: String
  let year: Int
  let coverImageUrl: String?
  var isAvailable: Bool
  var currentCheckoutId: String?
}

struct Member: Identifiable, Codable, Equatable {
  let id: String
  let name: String
  let memberId: String
  let email: String
}

struct Checkout: Identifiable, Codable, Equatable {
  let id: String
  let bookId: String
  let memberId: String
  let checkoutDate: String
  let dueDate: String
  var returnedDate: String?
  let notes: String?
  var contacted: Bool
  var contactedAt: String?
}

struct BookCounts {
  let all: Int
  let available: Int
  let checkedOut: Int
  let overdue: Int
  let uncontactedOverdue: Int
}

struct LibraryUiState {
  var activeTab: ActiveTab = .books
  var searchQuery: String = ""
  var activeFilter: FilterType = .all
  var checkoutModalBookId: String?
  var returnCheckoutId: String?
  var contactAckBookId: String?
  var contactAckMemberId: String?
}

enum ActiveTab: String, Codable, CaseIterable, Identifiable {
  case books
  case overdue
  case members

  var id: String { rawValue }
}

enum FilterType: String, CaseIterable, Identifiable, Codable {
  case all
  case available
  case checkedOut = "checked_out"
  case overdue

  var id: String { rawValue }

  var label: String {
    switch self {
    case .all:
      "All"
    case .available:
      "Available"
    case .checkedOut:
      "Checked out"
    case .overdue:
      "Overdue"
    }
  }
}

enum CheckoutFlowResult {
  case completed
  case needsContactAcknowledgement
  case unavailable
}

