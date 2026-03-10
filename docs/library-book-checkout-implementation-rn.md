# Library Book Checkout — RN + Redux Implementation Specification

## 1) Scope
This specification defines a concrete React Native implementation for the library checkout app using Redux Toolkit. It translates the cross-platform business requirements into implementation details: state shape, reducer behavior, UI architecture, navigation, and checkout-contact gate flow.

## 2) Assumptions
- Librarian is already logged in.
- No backend; all data is local and seeded from `data/sci-fi-library-mock-data.json`.
- Member management is read-only and informational.
- Bottom tab navigation with:
  - `Books`
  - `Overdue`
  - `Members`
- Checkout and return actions are modal flows.
- No network calls or persistence required in v1 unless specified later.

## 3) Required screens and behaviors

### 3.1 Books screen
- Primary entry screen.
- Top navigation:
  - Uses the standard React Navigation header on iOS/Android.
  - Header title: `Books`.
  - Right-side header action: magnifier icon that toggles the search/filter panel.
  - Tapping the icon opens/closes the panel; second press hides it.
- Overview row (single source of truth; not duplicated):
  - Total books
  - Available count
  - Checked out count
- Search/filter panel (hidden by default):
  - Search input: case-insensitive title filter.
  - Filter chips: `All`, `Available`, `Checked out`, `Overdue`.
  - Tap the search icon again to dismiss the panel.
- The books overview text appears once in the content area directly below the header and is not duplicated elsewhere.
- Book card:
  - title, author
  - status label: `Available`, `Checked out`, or `Overdue`
  - due date when checked out
  - primary action:
    - `Check out` on available
    - `Return` when checked out
- Empty states:
  - `No books in catalog.`
  - `No books match this search.`
  - `No books in this filter.`

### 3.2 Checkout modal
- Trigger: `Check out` action.
- Fields shown:
  - Book title
  - member picker list (required selection)
- Controls:
  - Cancel
  - Confirm checkout (enabled only with selected member)
- Validation:
  - Must have member selected
  - Target book must still be available at commit
- Overdue gate:
  - Before checkout commit, if member has one or more active overdue checkouts with `contacted = false`, open Contact Acknowledgement modal.

### 3.3 Contact Acknowledgement modal
- Trigger only from checkout flow for overdue-member case.
- Message:
  - `This member has overdue book(s). Please confirm you have informed them.`
- Single action:
  - `Confirmed - Member Contacted`
- On confirm:
  - set matching overdue rows to `contacted = true`, `contactedAt = now`
  - continue checkout automatically

### 3.4 Return modal
- Trigger: Return action from book row.
- Shows:
  - Book title
  - borrower member name
  - checkout date
  - due date
- Confirm applies return.
- If checkout no longer active, close/resolve safely (guard).

### 3.5 Overdue screen
- List active overdue checkouts sorted by oldest overdue first.
- Row shows:
  - Book title and member
  - due date and overdue days
  - `Contacted` / `Uncontacted` state
- Row actions:
  - `Return`
  - `Contact Member` only when `contacted = false`
- Empty states:
  - `No overdue books.`
  - `No uncontacted overdue books.` (when overdue items exist but all are contacted)

### 3.6 Members screen
- Read-only list of members and contact identifiers.
- Used for quick checkout member confirmation.
- Empty state: `No members available.`

### 3.7 Bottom tab behavior
- Persistent tab bar at root.
- `Overdue` tab displays a badge = count of active uncontacted overdue checkouts.
- Use `@react-navigation/bottom-tabs` standard tab bar implementation (`createBottomTabNavigator`) with icon labels and system-typical spacing/interaction.
- Overdue badge uses the tab `tabBarBadge` value for active uncontacted overdue count.
- Badges update when:
  - contacting from overdue list
  - contact confirmation in checkout gate
  - return removes active overdue checkout

## 4) Data model
Use these entities:
- `Book`: `id`, `title`, `author`, `isbn`, `genre`, `year`, `isAvailable`, `currentCheckoutId`
- `Member`: `id`, `name`, `memberId`, `email`
- `Checkout`: `id`, `bookId`, `memberId`, `checkoutDate`, `dueDate`, `returnedDate`, `notes?`, `contacted`, `contactedAt`
- `UiState`: active tab, search query, active filter, active modal ids

Invariant:
- A book is checked out iff it has a non-null `currentCheckoutId` and active checkout row exists with `returnedDate = null`.
- `overdue` computed with `dueDate < todayISO()`.
- `contacted` applies only to active checkouts.

## 5) Redux store design

### 5.1 State slices
Single slice is acceptable in v1:
- `library` reducer with:
  - `books`
  - `members`
  - `checkouts`
  - `ui` state

### 5.2 Reducers/actions
- `initializeLibrary(seedData)`
- `setSearchQuery(value)`
- `setActiveFilter(filter)`
- `setActiveTab(tab)`
- `openCheckoutModal(bookId)`
- `openReturnModal(checkoutId)`
- `openContactAcknowledgement({ bookId, memberId })`
- `closeModal()`
- `checkoutBook(payload)`
- `returnBook(checkoutId)`
- `contactMemberOverdueCheckouts(memberId)`
- `contactCheckout(checkoutId)`

Reducer constraints:
- `checkoutBook` must reject if book already has active checkout.
- `returnBook` must ignore if already returned or unknown.
- `contactMemberOverdueCheckouts` is idempotent and sets all active overdue, uncontacted rows for member.
- `contactCheckout` should set one checkout as contacted if overdue and uncontacted.

## 6) Selectors
- `selectBookCounts` (total, available, checked out, uncontacted overdue)
- `selectBooksBySearchAndFilter(state, search, filter)`
- `selectOverdueCheckouts(state)` (active + overdue, sorted oldest-first)
- `selectUncontactedOverdueCheckouts(state)`
- `memberHasUncontactedOverdue(state, memberId)` / `activeOverdueByMember(state, memberId)`

## 7) Checkout gate implementation details
Flow:
1. In checkout confirm handler, resolve selected member and book.
2. Re-check availability guard.
3. If `memberHasUncontactedOverdue(memberId)` true:
   - open contact modal.
4. On modal confirm:
   - dispatch `contactMemberOverdueCheckouts(memberId)`.
   - re-check availability for target book.
   - dispatch `checkoutBook`.

This ensures race-safety after modal interactions.

## 8) Empty-state and error handling rules
- Use visible inline error labels for blocked checkout actions.
- Never crash when member/checkout references missing data.
- Use fallback labels `Unknown book/member`.

### 8.1 Safe-area behavior
- Root app host must include `SafeAreaProvider`.
- Use React Navigation headers for top chrome and let it manage status-safe top spacing.
- `StatusBar` should be non-translucent on Android (`translucent={false}`) and consistent color (`#f3f4f6`) so content is not rendered behind system UI.

## 9) Suggested file structure
- `App.tsx` (app shell + tab host)
- `src/store/index.ts`, `src/store/librarySlice.ts`, `src/store/selectors.ts`, `src/store/hooks.ts`
- `src/screens/BooksScreen.tsx`, `OverdueScreen.tsx`, `MembersScreen.tsx`
- `src/components/CheckoutModal.tsx`, `ReturnModal.tsx`, `ContactAcknowledgeModal.tsx`, `BookCard.tsx`, `EmptyState.tsx`
- `src/data/sci-fi-library-mock-data.json`
- `src/types.ts`

## 10) Acceptance criteria
- `Overdue` tab badge equals count of active uncontacted overdue checkouts.
- Contact gate appears only when a selected member has active uncontacted overdue items.
- Confirming gate updates member overdue rows before checkout.
- Checkout proceeds immediately when no uncontacted overdue exists.
- Contact action is idempotent.
- Returned overdue items are no longer considered active for badge and contact checks.

## 11) Unit test specification

### 11.1 Test targets
- File: `rn-app/src/store/__tests__/librarySlice.test.ts`
- Scope: Redux state behavior + derived selectors for RN UI requirements.
- Runtime target: `npm test` in `rn-app`.

### 11.2 Requirement-to-test mapping
- RN section 3.2 (Checkout modal validation and book availability guard)
  - `checks out an available book and sets checkout ownership on the book record`
  - `guards checkout against already checked out book`
- RN section 3.2 + 8 (error-safe checkout/return)
  - `is no-op when return is called for already returned checkout`
- RN section 3.3 (Contact acknowledgement modal prerequisites and message intent)
  - `maps overdue-member gate decision inputs and post-confirm update` (simulates gate decision + contact side-effect before checkout action)
  - `implements the overdue-member gate decision inputs and post-confirm update`
- RN section 3.3 + 3.7 (overdue-contacted state transition and idempotency)
  - `marks all active uncontacted overdue items for a member and is idempotent`
  - `can contact a single overdue checkout by id and ignore invalid/no-op cases`
- RN section 3.5 (Overdue list action behavior and state changes)
  - `maps overdue member selectors to active/uncontacted-overdue behavior`
  - `computes dashboard counts including uncontacted overdue badge total`
- RN section 3.5 (badge updates after checkout/return/contact)
  - `marks all active uncontacted overdue items for a member and is idempotent`
  - `implements the overdue-member gate decision inputs and post-confirm update`
  - `returns an active checkout and marks the book available`
- RN section 3.7/8 (empty states and unavailable data paths)
  - `validates empty-state logic for selected filters via selector output`
- RN section 5/6 (UI state management and screen modals)
  - `opens and resets modal ids consistently`
  - `initializes domain state from seed data and keeps UI shell fields`

### 11.3 Gaps not covered by this file (future)
- Component and integration tests for:
  - modal visibility transitions from press interactions
  - inline checkout error text (`Select a member...`, `This book is no longer available.`)
  - bottom tab badge rendering and `Members` tab listing
  - top navigation search toggle (show/hide filter panel)
  - cross-screen navigation behavior via `@react-navigation/bottom-tabs` (initial tab + focus sync + badge updates)
