package com.interview.libraryappandroid

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.PriorityHigh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ElevatedFilterChip
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryApp(viewModel: LibraryViewModel = viewModel()) {
  val state by viewModel.uiState.collectAsStateWithLifecycle()
  val filteredBooks = remember(state.books, state.checkouts, state.searchQuery, state.activeFilter) {
    viewModel.filteredBooks(state)
  }
  val overdue = remember(state.checkouts) { viewModel.overdueCheckouts(state) }
  val uncontactedOverdueCount = remember(state.checkouts) { viewModel.uncontactedOverdueCount(state) }
  val counts = remember(state.books) { viewModel.bookCounts(state) }

  Scaffold(
    topBar = {
      when (state.activeTab) {
        ActiveTab.BOOKS -> {
          CenterAlignedTopAppBar(
            title = { Text("Books") },
            actions = {
              IconButton(onClick = { viewModel.toggleSearchPanel() }) {
                Icon(
                  imageVector = if (state.showSearchPanel) Icons.Default.Close else Icons.Default.Search,
                  contentDescription = if (state.showSearchPanel) "Close" else "Search",
                )
              }
            },
          )
        }

        ActiveTab.OVERDUE -> CenterAlignedTopAppBar(title = { Text("Overdue") })
        ActiveTab.MEMBERS -> CenterAlignedTopAppBar(title = { Text("Members") })
      }
    },
    bottomBar = {
      NavigationBar {
        NavigationBarItem(
          selected = state.activeTab == ActiveTab.BOOKS,
          onClick = { viewModel.setActiveTab(ActiveTab.BOOKS) },
          icon = { Icon(Icons.Default.Book, contentDescription = "Books") },
          label = { Text("Books") },
        )

        NavigationBarItem(
          selected = state.activeTab == ActiveTab.OVERDUE,
          onClick = { viewModel.setActiveTab(ActiveTab.OVERDUE) },
          icon = {
            BadgedBox(
              badge = {
                if (uncontactedOverdueCount > 0) {
                  Badge { Text(uncontactedOverdueCount.toString()) }
                }
              },
            ) {
              Icon(Icons.Default.PriorityHigh, contentDescription = "Overdue")
            }
          },
          label = { Text("Overdue") },
        )

        NavigationBarItem(
          selected = state.activeTab == ActiveTab.MEMBERS,
          onClick = { viewModel.setActiveTab(ActiveTab.MEMBERS) },
          icon = { Icon(Icons.Default.Groups, contentDescription = "Members") },
          label = { Text("Members") },
        )
      }
    },
  ) { innerPadding ->
    Box(
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding),
    ) {
      when (state.activeTab) {
        ActiveTab.BOOKS -> BooksScreen(
          state = state,
          filteredBooks = filteredBooks,
          counts = counts,
          lookupCheckout = { viewModel.checkoutByBookId(it) },
          onSearchQueryChanged = viewModel::setSearchQuery,
          onFilterChanged = viewModel::setFilter,
          onCheckout = viewModel::openCheckoutModal,
          onReturn = { checkoutId -> viewModel.openReturnModal(checkoutId) },
        )

        ActiveTab.OVERDUE -> OverdueScreen(
          overdue = overdue,
          uncontactedOverdueCount = uncontactedOverdueCount,
          resolveBook = { viewModel.bookById(it) },
          resolveMember = { viewModel.memberById(it) },
          onReturn = viewModel::openReturnModal,
          onContact = viewModel::contactCheckout,
        )

        ActiveTab.MEMBERS -> MembersScreen(
          members = state.members,
          activeCheckoutsForMember = { viewModel.activeCheckoutsForMember(it, state) },
          resolveBook = { viewModel.bookById(it) },
        )
      }

      val checkoutBook = state.checkoutModalBookId?.let { viewModel.bookById(it) }
      if (checkoutBook != null) {
        CheckoutDialog(
          book = checkoutBook,
          members = state.members,
          selectedMemberId = state.selectedCheckoutMemberId,
          message = state.checkoutError,
          onMemberSelected = viewModel::setSelectedCheckoutMember,
          onDismiss = viewModel::closeAllDialogs,
          onConfirm = viewModel::startCheckoutFromModal,
        )
      }

      val returnCheckout = state.returnCheckoutId?.let { viewModel.checkoutById(it) }
      if (returnCheckout != null) {
        ReturnDialog(
          checkout = returnCheckout,
          book = viewModel.bookById(returnCheckout.bookId),
          member = viewModel.memberById(returnCheckout.memberId),
          onDismiss = viewModel::closeAllDialogs,
          onConfirm = viewModel::returnFromModal,
        )
      }

      if (state.contactAckBookId != null && state.contactAckMemberId != null) {
        ContactAckDialog(onConfirm = viewModel::confirmContactAndContinueCheckout)
      }
    }
  }
}

@Composable
private fun BooksScreen(
  state: LibraryUiState,
  filteredBooks: List<Book>,
  counts: BookCounts,
  lookupCheckout: (String) -> Checkout?,
  onSearchQueryChanged: (String) -> Unit,
  onFilterChanged: (FilterType) -> Unit,
  onCheckout: (String) -> Unit,
  onReturn: (String) -> Unit,
) {
  val listState = rememberLazyListState()

  LaunchedEffect(state.showSearchPanel) {
    if (state.showSearchPanel) {
      listState.animateScrollToItem(0)
    }
  }

  val emptyMessage = remember(filteredBooks, state.books, state.searchQuery) {
    if (filteredBooks.isNotEmpty()) {
      null
    } else if (state.books.isEmpty()) {
      "No books in catalog."
    } else if (state.searchQuery.isNotBlank()) {
      "No books match this search."
    } else {
      "No books in this filter."
    }
  }

  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    state = listState,
    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 12.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    item {
      Text(
        text = "Overview • Total: ${counts.all} · Available: ${counts.available} · Checked out: ${counts.checkedOut}",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )
    }

    if (state.showSearchPanel) {
      item {
        SearchPanel(
          searchQuery = state.searchQuery,
          activeFilter = state.activeFilter,
          onSearchQueryChanged = onSearchQueryChanged,
          onFilterChanged = onFilterChanged,
        )
      }
    }

    if (emptyMessage != null) {
      item {
        EmptyStateCard(message = emptyMessage)
      }
    } else {
      items(items = filteredBooks, key = { it.id }) { book ->
        val checkout = lookupCheckout(book.id)
        BookCard(
          book = book,
          checkout = checkout,
          onCheckout = { onCheckout(book.id) },
          onReturn = {
            checkout?.id?.let { onReturn(it) }
          },
        )
      }
    }
  }
}

@Composable
private fun SearchPanel(
  searchQuery: String,
  activeFilter: FilterType,
  onSearchQueryChanged: (String) -> Unit,
  onFilterChanged: (FilterType) -> Unit,
) {
  Card {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(12.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
      OutlinedTextField(
        modifier = Modifier.fillMaxWidth(),
        value = searchQuery,
        onValueChange = onSearchQueryChanged,
        label = { Text("Search by title") },
        singleLine = true,
      )

      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        FilterType.entries.forEach { filter ->
          ElevatedFilterChip(
            selected = activeFilter == filter,
            onClick = { onFilterChanged(filter) },
            label = { Text(filter.label) },
          )
        }
      }
    }
  }
}

@Composable
private fun BookCard(
  book: Book,
  checkout: Checkout?,
  onCheckout: () -> Unit,
  onReturn: () -> Unit,
) {
  val isOverdue = checkout?.let { DateUtils.isOverdue(it.dueDate) } == true
  val statusText = when {
    book.isAvailable -> "Available"
    isOverdue -> "Overdue"
    else -> "Checked out"
  }
  val statusColor = when {
    book.isAvailable -> Color(0xFF1E8E3E)
    isOverdue -> Color(0xFFC5221F)
    else -> Color(0xFFE09F00)
  }

  Card {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(12.dp),
      verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
      Text(book.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
      Text(book.author, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
      Text(statusText, style = MaterialTheme.typography.bodyMedium, color = statusColor, fontWeight = FontWeight.SemiBold)

      if (!book.isAvailable && checkout != null) {
        Text(
          text = "Due: ${DateUtils.display(checkout.dueDate)}",
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
      }

      Spacer(modifier = Modifier.height(2.dp))

      if (book.isAvailable) {
        Button(onClick = onCheckout) { Text("Check out") }
      } else {
        TextButton(onClick = onReturn) { Text("Return") }
      }
    }
  }
}

@Composable
private fun OverdueScreen(
  overdue: List<Checkout>,
  uncontactedOverdueCount: Int,
  resolveBook: (String) -> Book?,
  resolveMember: (String) -> Member?,
  onReturn: (String) -> Unit,
  onContact: (String) -> Unit,
) {
  if (overdue.isEmpty()) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(16.dp),
    ) {
      EmptyStateCard(message = "No overdue books.")
    }
    return
  }

  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 12.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    if (uncontactedOverdueCount == 0) {
      item {
        Text(
          text = "No uncontacted overdue books.",
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
      }
    }

    items(overdue, key = { it.id }) { checkout ->
      val bookTitle = resolveBook(checkout.bookId)?.title ?: "Unknown book"
      val memberName = resolveMember(checkout.memberId)?.name ?: "Unknown member"
      val days = DateUtils.overdueDays(checkout.dueDate)

      Card {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp),
          verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
          Text(bookTitle, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
          Text("Member: $memberName", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
          Text(
            "Due: ${DateUtils.display(checkout.dueDate)} · $days days overdue",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
          Text(
            text = if (checkout.contacted) "Contacted" else "Uncontacted",
            color = if (checkout.contacted) Color(0xFF1E8E3E) else Color(0xFFC5221F),
            fontWeight = FontWeight.SemiBold,
          )

          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TextButton(onClick = { onReturn(checkout.id) }) { Text("Return") }
            if (!checkout.contacted) {
              Button(onClick = { onContact(checkout.id) }) { Text("Contact Member") }
            }
          }
        }
      }
    }
  }
}

@Composable
private fun MembersScreen(
  members: List<Member>,
  activeCheckoutsForMember: (String) -> List<Checkout>,
  resolveBook: (String) -> Book?,
) {
  if (members.isEmpty()) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(16.dp),
    ) {
      EmptyStateCard(message = "No members available.")
    }
    return
  }

  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 12.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    items(members, key = { it.id }) { member ->
      val active = activeCheckoutsForMember(member.id)
      val titles = active.mapNotNull { resolveBook(it.bookId)?.title }

      Card {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp),
          verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
          Text(member.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
          Text("${member.memberId} · ${member.email}", color = MaterialTheme.colorScheme.onSurfaceVariant)
          Text("Active checkouts: ${active.size}", style = MaterialTheme.typography.bodyMedium)

          if (titles.isEmpty()) {
            Text("No active checkouts.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
          } else {
            Text("Checked out:", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            titles.forEach { title ->
              Text("• $title", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
          }
        }
      }
    }
  }
}

@Composable
private fun CheckoutDialog(
  book: Book,
  members: List<Member>,
  selectedMemberId: String?,
  message: String?,
  onMemberSelected: (String?) -> Unit,
  onDismiss: () -> Unit,
  onConfirm: () -> Unit,
) {
  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text("Checkout Book") },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Book: ${book.title}")

        Column(
          modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 320.dp)
            .verticalScroll(rememberScrollState()),
          verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
          members.forEach { member ->
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .clickable {
                  onMemberSelected(
                    if (selectedMemberId == member.id) null else member.id,
                  )
                }
                .padding(vertical = 4.dp),
              verticalAlignment = Alignment.CenterVertically,
            ) {
              RadioButton(
                selected = selectedMemberId == member.id,
                onClick = {
                  onMemberSelected(
                    if (selectedMemberId == member.id) null else member.id,
                  )
                },
              )
              Spacer(modifier = Modifier.width(8.dp))
              Column {
                Text(member.name)
                Text(
                  "${member.memberId} · ${member.email}",
                  style = MaterialTheme.typography.bodySmall,
                  color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
              }
            }
          }
        }

        if (!message.isNullOrBlank()) {
          Text(message, color = MaterialTheme.colorScheme.error)
        }
      }
    },
    dismissButton = {
      TextButton(onClick = onDismiss) { Text("Cancel") }
    },
    confirmButton = {
      TextButton(onClick = onConfirm, enabled = selectedMemberId != null) {
        Text("Confirm checkout")
      }
    },
  )
}

@Composable
private fun ReturnDialog(
  checkout: Checkout,
  book: Book?,
  member: Member?,
  onDismiss: () -> Unit,
  onConfirm: () -> Unit,
) {
  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text("Return Book") },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Book: ${book?.title ?: "Unknown book"}")
        Text("Member: ${member?.name ?: "Unknown member"}")
        Text("Checkout date: ${DateUtils.display(checkout.checkoutDate)}")
        Text("Due date: ${DateUtils.display(checkout.dueDate)}")
      }
    },
    dismissButton = {
      TextButton(onClick = onDismiss) { Text("Cancel") }
    },
    confirmButton = {
      TextButton(onClick = onConfirm) { Text("Confirm return") }
    },
  )
}

@Composable
private fun ContactAckDialog(onConfirm: () -> Unit) {
  AlertDialog(
    onDismissRequest = {},
    title = { Text("Overdue Books") },
    text = { Text("This member has overdue book(s). Please confirm you have informed them.") },
    confirmButton = {
      Button(onClick = onConfirm) { Text("Confirmed - Member Contacted") }
    },
    dismissButton = null,
  )
}

@Composable
private fun EmptyStateCard(message: String) {
  Surface(
    modifier = Modifier.fillMaxWidth(),
    shape = RoundedCornerShape(12.dp),
    tonalElevation = 1.dp,
  ) {
    Text(
      modifier = Modifier.padding(horizontal = 12.dp, vertical = 18.dp),
      text = message,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
      style = MaterialTheme.typography.bodyMedium,
    )
  }
}
