# Library Book Checkout — SwiftUI Implementation Specification

## 1) Scope
This document defines a concrete SwiftUI implementation of the library checkout app, matching the product requirements and RN behavior.

## 2) Assumptions
- App is local-first with seeded JSON copied into app bundle from shared repo data.
- Librarian is authenticated contextually; no login implementation.
- Member management is read-only.
- Navigation uses `TabView` with bottom tabs.
- Modal flows are sheets or alerts.

## 3) Screens and states

### 3.1 Books tab
- Displays catalog list and search/filter controls:
  - Top navigation search action icon toggles search/filter panel visibility.
  - search by title
  - filter chips: all, available, checked out, overdue
- Overview summary row is in scrollable list content (not duplicated elsewhere).
- When opening the search/filter panel, scroll list to top so the panel is immediately visible.
- Cards show status and action button.
- Checkout action opens member-selection sheet.
- Return action opens return confirmation sheet.
- Empty states:
  - no catalog
  - no search match
  - no matches in selected filter

### 3.2 Checkout modal/sheet
- Shows selected book title and member selector.
- Checkout disabled until member selected.
- Use centered dialog style rather than bottom sheet style.
- On confirm:
  - preflight availability
  - run overdue-contact check
  - if needed, open required contact acknowledgement sheet

### 3.3 Contact acknowledgement sheet
- Text: `This member has overdue book(s).Please confirm you have informed them.`
- Single button: `Confirmed - Member Contacted`
- On confirm:
  - mark all active uncontacted overdue checkouts for member as contacted with current date
  - continue checkout automatically

### 3.4 Return sheet
- Shows borrower + title + checkout date + due date.
- Confirm marks `returnedDate` and clears book availability flags.

### 3.5 Overdue tab
- Shows active overdue list sorted by oldest overdue first.
- Each row:
  - book title, member, due date, overdue days
  - status badge: contacted/uncontacted
  - `Return` button
  - `Contact Member` button if uncontacted
- Empty states:
  - no overdue
  - no uncontacted overdue

### 3.6 Members tab
- Read-only member list used for checkout reference.
- Show active checkout summary per member:
  - count of active checked-out books
  - checked-out titles list
- Empty state when no members.

### 3.7 Tab behavior
- `Overdue` tab icon includes badge with uncontacted overdue count.
- Badge updates via derived store state.

## 4) Domain model
Use value types:
- `Book`, `Member`, `Checkout`, `UiState`
- `Checkout` includes `contacted: Bool`, `contactedAt: Date?`/`String?`
- Derived helpers:
  - is overdue (`dueDate < today`)
  - active if `returnedDate == nil`
  - uncontacted overdue

## 5) LibraryStore structure
- `@MainActor final class LibraryStore: ObservableObject`
- `@Published` state:
  - `books: [Book]`
  - `members: [Member]`
  - `checkouts: [Checkout]`
  - `ui: UiState`

## 6) Computed properties/selectors
- `bookCounts`
- `uncontactedOverdueCount`
- `searchFilteredBooks(searchText:filter:)`
- `memberHasUncontactedOverdue(memberId:)`
- `activeOverdueByMember(memberId:)`
- `overdueCheckouts`

## 7) Checkout gate detail (required)
- In checkout handler:
  1. Resolve book by id and verify not checked out.
  2. Check `memberHasUncontactedOverdue`.
  3. If true, set UI flag `showContactAck = true` and keep pending checkout tuple `(bookId, memberId)`.
  4. On confirm:
     - mutate matching overdue rows for member to `contacted = true`, `contactedAt = today`.
     - then create checkout row and assign book `currentCheckoutId`.
  5. Re-check availability before commit (defensive guard).

## 8) Return flow
- Return handler marks checkout as returned and book availability as available.
- If row is already returned, no-op.

## 9) File map
- `LibraryStore.swift` (state + reducers + selectors)
- `ContentView.swift` (tab host and route switching)
- `Screens/BooksScreen.swift`
- `Screens/OverdueScreen.swift`
- `Screens/MembersScreen.swift`
- `Views/CheckoutSheet.swift`
- `Views/ContactAckSheet.swift`
- `Views/ReturnSheet.swift`
- `Views/BookRow.swift`, `EmptyStateView.swift`
- `Models.swift`
- `scripts/copy-shared-seed-data.sh` (copies root `/data` JSON into bundle resources at build)

## 10) Local seed strategy
- Keep one canonical seed file in repo root: `/data/sci-fi-library-mock-data.json`.
- Copy canonical file to app bundle in a target pre-build script.
- Load `sci-fi-library-mock-data.json` from `Bundle.main` at launch.
- Convert dates consistently; prefer ISO date strings internally to stay aligned with RN data structure.
- Tabs and navigation rely on standard SwiftUI `NavigationStack + TabView` components with inline bar style so safe-area behavior matches OS defaults.

## 11) Acceptance check list
- Gate appears only when member has at least one active uncontacted overdue checkout.
- Confirm action marks overdue rows and proceeds with checkout.
- Badge shows uncontacted overdue count and decrements on contact or return completion.
- No blocking of checkout for non-overdue cases.
