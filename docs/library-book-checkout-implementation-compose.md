# Library Book Checkout — Android Compose Implementation Specification

## 1) Scope
Defines Android Kotlin Compose implementation details for the same behavior contract as RN/SwiftUI, including the overdue contact gate and tab badge.

## 2) Assumptions
- No authentication implementation in v1.
- Seed data loaded from bundled JSON asset.
- Member management read-only.
- Bottom navigation with three tabs: Books, Overdue, Members.
- Checkout and return flows are modal bottom sheets/dialogs.

## 3) Data model
- `data class Book(id, title, author, isbn, genre, year, coverImageUrl, isAvailable, currentCheckoutId)`
- `data class Member(id, name, memberId, email)`
- `data class Checkout(id, bookId, memberId, checkoutDate, dueDate, returnedDate, notes, contacted, contactedAt)`
- `UiState`:
  - `activeTab`
  - `searchQuery`
  - `activeFilter`
  - `openCheckoutBookId`
  - `openReturnCheckoutId`
  - `showContactAck` + `pendingCheckoutBookId` + `pendingCheckoutMemberId`

Invariants:
- Checked out iff `currentCheckoutId != null` and checkout with same id exists with `returnedDate == null`.
- Overdue computed from dueDate < today.

## 4) Screen behavior

### 4.1 Books screen
- Shows counts and filter/search controls.
  - Search/filter panel is toggled from top bar action and should scroll to top when shown.
- Card actions:
  - Checkout (available)
  - Return (checked out)
- Opens checkout modal for available books.
- Empty states:
  - No books in catalog
  - No books match search
  - No books in this filter

### 4.2 Checkout modal
- Select member and confirm checkout.
- Render checkout as centered dialog/modal (non-bottom-sheet) per UI expectation.
- Confirm path:
  - Guard target book is still available
  - Check uncontacted overdue via selector
  - If overdue, open confirmation prompt
  - Else perform checkout directly

### 4.3 Contact acknowledgement modal
- Message: `This member has overdue book(s). Please confirm you have informed them.`
- Single confirm action `Confirmed - Member Contacted`
- On confirm:
  - update all active uncontacted overdue rows for that member
  - resume pending checkout

### 4.4 Return modal
- Confirm return updates `returnedDate`, clears book availability.

### 4.5 Overdue screen
- List active overdue checkouts sorted by oldest overdue first.
- Show status label contacted/uncontacted and overdue days.
- Buttons:
  - Return
  - Contact Member when uncontacted
- Empty states:
  - No overdue books
  - No uncontacted overdue books

### 4.6 Members screen
- Read-only list only.
- Each member row includes active checkout summary:
  - count of active checked-out books
  - active titles list
- Empty state if empty list.

### 4.7 Bottom nav
- `Overdue` tab badge uses derived uncontacted overdue count.

## 5) Architecture
- `LibraryViewModel` (single source of truth)
  - holds `MutableStateFlow<LibraryUiState>`
  - public `StateFlow` exposed to UI
- State mutation methods:
  - `initializeLibrary(seed)`
  - `setSearchQuery`
  - `setFilter`
  - `setActiveTab`
  - `openCheckoutModal(bookId)`
  - `openReturnModal(checkoutId)`
  - `closeModals()`
  - `submitCheckout(bookId, memberId)`
  - `confirmContactAndContinueCheckout()`
  - `returnBook(checkoutId)`
  - `contactCheckout(checkoutId)`
  - `contactMemberOverdue(memberId)`

## 6) Derived selectors (computed properties)
- `overdueCheckouts`
- `uncontactedOverdueCheckouts`
- `overdueUncontactedCount`
- `activeOverdueByMember(memberId)`
- `memberHasUncontactedOverdue(memberId)`

## 7) Gate flow pseudocode
```
onCheckoutConfirm(bookId, memberId):
  if !book.isAvailable -> show error
  if memberHasUncontactedOverdue(memberId):
    store pending checkout intent
    showContactAck = true
    return
  createCheckout(bookId, memberId)

onContactAckConfirm():
  contactMemberOverdue(memberId)
  if pending checkout intent valid and book still available:
     createCheckout(pendingBookId, pendingMemberId)
  clear pending intent
  showContactAck = false
```

## 8) Empty-state/error handling
- Guard against stale ids.
- Never crash if orphaned ids exist; show fallback `Unknown book/member`.
- If availability changes during modal flow, show an error and close or reset checkout intent.

## 9) Suggested file structure
- `data/SeedDataLoader.kt`
- `data/models.kt`
- `ui/viewmodel/LibraryViewModel.kt`
- `ui/state/LibraryUiState.kt`
- `ui/navigation/MainActivity.kt` or `App.kt` with nav host
- `ui/screens/BooksScreen.kt`, `OverdueScreen.kt`, `MembersScreen.kt`
- `ui/components/CheckoutSheet.kt`, `ReturnSheet.kt`, `ContactAckSheet.kt`, `BookRow.kt`, `BottomTabs.kt`, `EmptyState.kt`
- `assets/sci-fi-library-mock-data.json`

## 10) Acceptance criteria
- Checkout gate blocks and confirms when needed.
- Contact confirm updates overdue rows and badge.
- Checkout continues automatically after confirmation.
- Badge and empty states remain accurate after return/contact/checkout.
