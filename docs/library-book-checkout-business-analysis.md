# Library Book Checkout App — Business Analysis + Cross-Platform Implementation Plan

## 1) Project context and objective
Build a small library checkout app that supports a librarian workflow with local state only.

Core goals:
- Display books and availability.
- Check out available books to a selected member.
- Return checked-out books.
- Show overdue items and actionable contact state.
- Apply a mandatory overdue-contact acknowledgement gate before checkout.
- Seed initial state from local mock data.

## 2) Source constraints
- No backend or external APIs.
- All behavior and state are local.
- Seed data must include books, members, and overdue cases.
- Member management is read-only.
- Librarian is already logged in.
- Checkout/return are modal flows.

## 3) Navigation and global behaviors
- Root uses **bottom tab navigation**:
  - `Books` (default)
  - `Overdue`
  - `Members`
- Checkout and return actions open as modals/sheets.
- `Books` uses a standard top app bar with a magnifier action that toggles a search/filter panel.
- When the search panel opens, the list should scroll to top so the panel is visible.
- Overdue tab badge displays the count of active, uncontacted overdue checkouts.
- Every screen must show clear **empty states**.

## 4) Screens and UX

### Screen A: Books
Purpose: primary checkout/return workflow.

Features:
- Title search input (case-insensitive), revealed/hidden from the top app bar action.
- Filter chips: `All`, `Available`, `Checked out`, `Overdue`.
- Overview line is shown once in scrollable content above book rows (not duplicated elsewhere).
- Book cards show title, author, status, and due/member for checked-out books.
- Action buttons per row:
  - `Check out` for available books
  - `Return` for checked-out books

Empty states:
- `No books in catalog`.
- `No books match search`.
- `No books in this filter`.

Flow:
- `Check out` opens Checkout modal with selected book prefilled.
- `Return` opens Return modal with borrower + dates.
- Checkout modal should be centered dialog style (not bottom-sheet) for standard behavior.

### Screen B: Checkout modal
Features:
- Preselected book shown.
- Member picker (required).
- Checkout date (auto today), due date auto-calculated as +14 days.
- UI style: centered dialog-like modal with dimmed backdrop.

Mandatory gate:
- Before commit, if selected member has any active uncontacted overdue checkouts:
  - open Contact Acknowledgement dialog
  - text: `This member has overdue book(s). Please confirm you have informed them.`
  - single action: `Confirmed - Member Contacted`
- On confirm:
  - set `contacted = true` and `contactedAt = now` for each matching overdue checkout
  - continue checkout
- If no matching overdue items, checkout commits immediately.
- Checkout is blocked with existing availability guard if book becomes unavailable.

### Screen C: Return modal
Features:
- Show book + borrower + checkout and due date.
- Confirm return.

Empty states:
- If checkout no longer active, display warning/close-safe message.

### Screen D: Overdue
Purpose: show overdue checkouts and actions.

Features:
- List overdue active checkouts sorted by oldest overdue first.
- Row actions:
  - `Return`
  - `Contact Member`
- Contact state indicators:
  - `Uncontacted` vs `Contacted`
- Overdue badge on tab uses **uncontacted count only**.

Empty states:
- `No overdue books`.
- `No uncontacted overdue books` when all are contacted.

### Screen E: Members (read-only)
- List seeded members and identifiers.
- Used for checkout member selection and quick reference.
- Each member row includes active checkout summary (count + titles).

Empty state:
- `No members available`.

## 5) Business requirements (functional)
1. Show all books and availability status.
2. Check out available books.
3. Set due date to 14 days from checkout date.
4. Prevent checkout of already checked-out books.
5. Return checked-out books.
6. List active overdue checkouts.
7. Show and maintain overdue contact workflow:
   - `Contact Member` action in overdue screen sets `contacted = true`.
   - Checkout for an overdue member requires acknowledgement dialog.
8. Keep overdue as informative state; no blocking for existing overdue except the checkout gate.
9. Keep member management read-only.

## 6) Data model (domain state)
- `Book`: `id, title, author, isbn, genre, year, coverImageUrl?, isAvailable, currentCheckoutId`
- `Member`: `id, name, memberId, email`
- `Checkout`: `id, bookId, memberId, checkoutDate, dueDate, returnedDate?, notes?, contacted?, contactedAt?`

Invariants:
- Book is checked out iff it has an active checkout (`returnedDate == null`).
- Overdue if active checkout and `dueDate < today`.
- `isAvailable` is derived, not manually entered.
- `contacted` applies only to active overdue checkout records.

## 7) Derived selectors and state helpers
- `isOverdue(checkout, today)`
- `isActive(checkout)`
- `activeCheckouts`
- `activeOverdueByMember(memberId)`
- `memberHasUncontactedOverdue(memberId)`
- `selectBookCounts` (total, available, checked out, overdue, uncontacted overdue)
- `selectBooksBySearchAndFilter(query, filter)`
- `selectOverdueUncontactedCount` (for Overdue badge)

## 8) Error and edge-case handling
- Checkout on unavailable book: blocked.
- Contact gate not satisfied: open acknowledgement dialog.
- Return on already returned: no-op with warning.
- Malformed data refs (orphaned checkout IDs): defensive fallback + optional diagnostics.
- Race changes between check and commit: re-validate availability before finalizing.
- Contact action is idempotent (multiple taps do not duplicate)

## 9) RN implementation plan (Redux Toolkit)
- Store structure:
  - `booksSlice`, `membersSlice`, `checkoutsSlice`, `uiSlice`.
- Checkout path:
  1. Resolve selected member and book.
  2. Guard `book availability`.
  3. If `memberHasUncontactedOverdue(memberId)`:
     - open `contactAcknowledgementModal`.
     - on confirm -> dispatch `contactMemberOverdueCheckouts(memberId)`.
  4. Dispatch `checkoutBook`.
- Actions:
  - `initializeLibrary`
  - `checkoutBook`
  - `returnBook`
  - `contactMemberOverdueCheckouts`
  - `setSearchQuery`
  - `setActiveFilter`
  - `openCheckoutModal`, `openReturnModal`, `openContactAcknowledgementModal`, `closeModal`
- UI:
  - Tabs + badge = `selectOverdueUncontactedCount`.
  - Overdue list row actions `Return` + `Contact Member`.
  - Empty state components for all tabs.

## 10) SwiftUI implementation plan
- MVVM with shared source-of-truth `LibraryStore: ObservableObject`.
- Keep same data model and selectors as computed properties.
- Checkout button workflow:
  1. preflight availability check.
  2. evaluate `memberHasUncontactedOverdue`.
  3. if true, present confirmation `sheet`.
  4. on confirm, map active overdue records for member to `contacted = true, contactedAt = now`.
  5. complete checkout.
- TabView with badge support for uncontacted overdue count.
- Overdue row actions: Return and Contact.
- Idempotent contact updates and derived filtering.

## 11) Android/Kotlin (Compose) implementation plan
- `LibraryViewModel` with immutable `LibraryUiState` via `StateFlow`.
- Seed load from local JSON asset.
- Expose selectors as computed getters:
  - `overdueUncontactedCount`
  - `activeOverdueByMember(memberId)`
  - `memberHasUncontactedOverdue(memberId)`
- `onCheckoutRequested(bookId, memberId)`:
  - validate availability,
  - if overdue exists, set `showContactPrompt = true` and store pending checkout intent,
  - on confirm, mark `contacted = true` for matching overdue items and execute pending checkout.
- Overdue screen row has `Return` and `Contact Member` actions.
- Bottom navigation badge binds to uncontacted overdue count.

## 12) Acceptance criteria
1. App loads with seeded 50 books and overdue checkouts.
2. All screens show expected empty states.
3. Search by title and filters behave correctly.
4. Book checkout sets due date to +14 days.
5. Duplicate checkout for checked-out books is blocked.
6. Returns clear active checkout and restore availability.
7. Overdue badge shows uncontacted overdue count and updates after contact, return, or contact via checkout gate.
8. Contact gate appears for members with uncontacted overdue and allows completion after acknowledgment.
9. Contact action in overdue list is idempotent.
10. Search/filter panel always opens/closes from top bar action, and when opened it is visible by scrolling list to top.

## 13) Data file to consume
`/Users/zerogeek/code/library-thing/data/sci-fi-library-mock-data.json`
