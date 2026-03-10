package com.interview.libraryappandroid

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit

@Serializable
data class LibrarySeed(
  val generatedAt: String,
  val books: List<Book>,
  val members: List<Member>,
  val checkouts: List<Checkout>,
)

@Serializable
data class Book(
  val id: String,
  val title: String,
  val author: String,
  val isbn: String,
  val genre: String,
  val year: Int,
  val coverImageUrl: String? = null,
  val isAvailable: Boolean,
  val currentCheckoutId: String? = null,
)

@Serializable
data class Member(
  val id: String,
  val name: String,
  val memberId: String,
  val email: String,
)

@Serializable
data class Checkout(
  val id: String,
  val bookId: String,
  val memberId: String,
  val checkoutDate: String,
  val dueDate: String,
  val returnedDate: String? = null,
  val notes: String? = null,
  val contacted: Boolean = false,
  val contactedAt: String? = null,
)

enum class ActiveTab {
  BOOKS,
  OVERDUE,
  MEMBERS,
}

enum class FilterType(val label: String) {
  ALL("All"),
  AVAILABLE("Available"),
  CHECKED_OUT("Checked out"),
  OVERDUE("Overdue"),
}

data class BookCounts(
  val all: Int,
  val available: Int,
  val checkedOut: Int,
)

data class LibraryUiState(
  val books: List<Book> = emptyList(),
  val members: List<Member> = emptyList(),
  val checkouts: List<Checkout> = emptyList(),
  val activeTab: ActiveTab = ActiveTab.BOOKS,
  val searchQuery: String = "",
  val activeFilter: FilterType = FilterType.ALL,
  val showSearchPanel: Boolean = false,
  val checkoutModalBookId: String? = null,
  val selectedCheckoutMemberId: String? = null,
  val returnCheckoutId: String? = null,
  val contactAckBookId: String? = null,
  val contactAckMemberId: String? = null,
  val checkoutError: String? = null,
)

class LibraryViewModel(application: Application) : AndroidViewModel(application) {
  private val json = Json { ignoreUnknownKeys = true }

  private val _uiState = MutableStateFlow(LibraryUiState())
  val uiState: StateFlow<LibraryUiState> = _uiState.asStateFlow()

  init {
    loadSeedDataIfNeeded()
  }

  fun loadSeedDataIfNeeded() {
    if (_uiState.value.books.isNotEmpty()) {
      return
    }

    runCatching {
      getApplication<Application>().assets
        .open("sci-fi-library-mock-data.json")
        .bufferedReader()
        .use { it.readText() }
    }.mapCatching { raw ->
      json.decodeFromString<LibrarySeed>(raw)
    }.onSuccess { seed ->
      _uiState.update {
        it.copy(
          books = seed.books,
          members = seed.members,
          checkouts = seed.checkouts,
        )
      }
    }.onFailure { error ->
      Log.e("LibraryViewModel", "Failed to load seed data", error)
    }
  }

  fun setActiveTab(tab: ActiveTab) {
    _uiState.update { it.copy(activeTab = tab) }
  }

  fun toggleSearchPanel() {
    _uiState.update { it.copy(showSearchPanel = !it.showSearchPanel) }
  }

  fun setSearchQuery(value: String) {
    _uiState.update { it.copy(searchQuery = value) }
  }

  fun setFilter(filter: FilterType) {
    _uiState.update { it.copy(activeFilter = filter) }
  }

  fun openCheckoutModal(bookId: String) {
    _uiState.update {
      it.copy(
        checkoutModalBookId = bookId,
        selectedCheckoutMemberId = null,
        returnCheckoutId = null,
        contactAckBookId = null,
        contactAckMemberId = null,
        checkoutError = null,
      )
    }
  }

  fun setSelectedCheckoutMember(memberId: String?) {
    _uiState.update { it.copy(selectedCheckoutMemberId = memberId) }
  }

  fun openReturnModal(checkoutId: String) {
    _uiState.update {
      it.copy(
        returnCheckoutId = checkoutId,
        checkoutModalBookId = null,
        selectedCheckoutMemberId = null,
        contactAckBookId = null,
        contactAckMemberId = null,
      )
    }
  }

  fun closeAllDialogs() {
    _uiState.update {
      it.copy(
        checkoutModalBookId = null,
        selectedCheckoutMemberId = null,
        returnCheckoutId = null,
        contactAckBookId = null,
        contactAckMemberId = null,
      )
    }
  }

  fun startCheckoutFromModal() {
    val state = _uiState.value
    val bookId = state.checkoutModalBookId ?: return
    val memberId = state.selectedCheckoutMemberId

    if (memberId == null) {
      _uiState.update { it.copy(checkoutError = "Select a member to continue.") }
      return
    }

    val book = state.books.firstOrNull { it.id == bookId }
    if (book == null || !book.isAvailable) {
      _uiState.update { it.copy(checkoutError = "This book is no longer available.") }
      return
    }

    if (memberHasUncontactedOverdue(state, memberId)) {
      _uiState.update {
        it.copy(
          checkoutModalBookId = null,
          selectedCheckoutMemberId = null,
          contactAckBookId = bookId,
          contactAckMemberId = memberId,
          checkoutError = null,
        )
      }
      return
    }

    if (!checkoutBook(bookId, memberId)) {
      _uiState.update { it.copy(checkoutError = "This book is no longer available.") }
    }
  }

  fun confirmContactAndContinueCheckout() {
    val state = _uiState.value
    val bookId = state.contactAckBookId
    val memberId = state.contactAckMemberId

    if (bookId == null || memberId == null) {
      closeAllDialogs()
      return
    }

    val updatedCheckouts = contactMemberOverdueCheckouts(state.checkouts, memberId)
    _uiState.update { it.copy(checkouts = updatedCheckouts) }

    if (!checkoutBook(bookId, memberId)) {
      _uiState.update {
        it.copy(
          contactAckBookId = null,
          contactAckMemberId = null,
          checkoutError = "This book is no longer available.",
        )
      }
    }
  }

  fun returnFromModal() {
    val checkoutId = _uiState.value.returnCheckoutId ?: return
    returnCheckout(checkoutId)
    _uiState.update { it.copy(returnCheckoutId = null) }
  }

  fun returnCheckout(checkoutId: String) {
    val state = _uiState.value
    val checkoutIndex = state.checkouts.indexOfFirst { it.id == checkoutId }
    if (checkoutIndex < 0) return

    val checkout = state.checkouts[checkoutIndex]
    if (checkout.returnedDate != null) return

    val mutableCheckouts = state.checkouts.toMutableList()
    mutableCheckouts[checkoutIndex] = checkout.copy(returnedDate = DateUtils.todayIso())

    val mutableBooks = state.books.toMutableList()
    val bookIndex = mutableBooks.indexOfFirst { it.id == checkout.bookId }
    if (bookIndex >= 0) {
      val book = mutableBooks[bookIndex]
      val nextCheckoutId = if (book.currentCheckoutId == checkoutId) null else book.currentCheckoutId
      mutableBooks[bookIndex] = book.copy(isAvailable = true, currentCheckoutId = nextCheckoutId)
    }

    _uiState.update {
      it.copy(
        books = mutableBooks,
        checkouts = mutableCheckouts,
        returnCheckoutId = if (it.returnCheckoutId == checkoutId) null else it.returnCheckoutId,
      )
    }
  }

  fun contactCheckout(checkoutId: String) {
    val state = _uiState.value
    val index = state.checkouts.indexOfFirst { it.id == checkoutId }
    if (index < 0) return

    val target = state.checkouts[index]
    if (target.returnedDate != null || target.contacted || !DateUtils.isOverdue(target.dueDate)) {
      return
    }

    val mutableCheckouts = state.checkouts.toMutableList()
    mutableCheckouts[index] = target.copy(contacted = true, contactedAt = DateUtils.todayIso())
    _uiState.update { it.copy(checkouts = mutableCheckouts) }
  }

  fun bookById(bookId: String): Book? {
    return _uiState.value.books.firstOrNull { it.id == bookId }
  }

  fun memberById(memberId: String): Member? {
    return _uiState.value.members.firstOrNull { it.id == memberId }
  }

  fun checkoutById(checkoutId: String): Checkout? {
    return _uiState.value.checkouts.firstOrNull { it.id == checkoutId }
  }

  fun checkoutByBookId(bookId: String): Checkout? {
    val book = bookById(bookId) ?: return null
    val checkoutId = book.currentCheckoutId ?: return null
    return checkoutById(checkoutId)
  }

  fun activeCheckoutsForMember(memberId: String, state: LibraryUiState = _uiState.value): List<Checkout> {
    return state.checkouts
      .filter { it.memberId == memberId && it.returnedDate == null }
      .sortedByDescending { DateUtils.parseIso(it.checkoutDate) ?: LocalDate.MIN }
  }

  fun filteredBooks(state: LibraryUiState = _uiState.value): List<Book> {
    val query = state.searchQuery.trim().lowercase()

    var result = state.books
    if (query.isNotEmpty()) {
      result = result.filter { it.title.lowercase().contains(query) }
    }

    result = when (state.activeFilter) {
      FilterType.ALL -> result
      FilterType.AVAILABLE -> result.filter { it.isAvailable }
      FilterType.CHECKED_OUT -> result.filter { !it.isAvailable }
      FilterType.OVERDUE -> result.filter { book ->
        val checkout = book.currentCheckoutId?.let { id -> state.checkouts.firstOrNull { it.id == id } }
        checkout != null && isOverdueActive(checkout)
      }
    }

    return result.sortedBy { it.title.lowercase() }
  }

  fun overdueCheckouts(state: LibraryUiState = _uiState.value): List<Checkout> {
    return state.checkouts
      .filter { isOverdueActive(it) }
      .sortedBy { DateUtils.parseIso(it.dueDate) ?: LocalDate.MAX }
  }

  fun uncontactedOverdueCheckouts(state: LibraryUiState = _uiState.value): List<Checkout> {
    return overdueCheckouts(state).filter { !it.contacted }
  }

  fun uncontactedOverdueCount(state: LibraryUiState = _uiState.value): Int {
    return uncontactedOverdueCheckouts(state).size
  }

  fun bookCounts(state: LibraryUiState = _uiState.value): BookCounts {
    val available = state.books.count { it.isAvailable }
    return BookCounts(
      all = state.books.size,
      available = available,
      checkedOut = state.books.size - available,
    )
  }

  private fun checkoutBook(bookId: String, memberId: String): Boolean {
    val state = _uiState.value
    val bookIndex = state.books.indexOfFirst { it.id == bookId }
    if (bookIndex < 0) return false

    val book = state.books[bookIndex]
    if (!book.isAvailable) return false

    val checkoutId = "co-${System.currentTimeMillis()}"
    val today = DateUtils.todayIso()
    val dueDate = DateUtils.addDays(today, 14)

    val newCheckout = Checkout(
      id = checkoutId,
      bookId = bookId,
      memberId = memberId,
      checkoutDate = today,
      dueDate = dueDate,
      returnedDate = null,
      notes = null,
      contacted = false,
      contactedAt = null,
    )

    val mutableBooks = state.books.toMutableList()
    mutableBooks[bookIndex] = book.copy(isAvailable = false, currentCheckoutId = checkoutId)

    val mutableCheckouts = state.checkouts.toMutableList()
    mutableCheckouts.add(newCheckout)

    _uiState.update {
      it.copy(
        books = mutableBooks,
        checkouts = mutableCheckouts,
        checkoutModalBookId = null,
        selectedCheckoutMemberId = null,
        contactAckBookId = null,
        contactAckMemberId = null,
        checkoutError = null,
      )
    }
    return true
  }

  private fun memberHasUncontactedOverdue(state: LibraryUiState, memberId: String): Boolean {
    return activeOverdueByMember(state, memberId).any { !it.contacted }
  }

  private fun activeOverdueByMember(state: LibraryUiState, memberId: String): List<Checkout> {
    return state.checkouts
      .filter { it.memberId == memberId }
      .filter { isOverdueActive(it) }
  }

  private fun contactMemberOverdueCheckouts(checkouts: List<Checkout>, memberId: String): List<Checkout> {
    val now = DateUtils.todayIso()
    return checkouts.map { checkout ->
      if (checkout.memberId == memberId && isOverdueActive(checkout) && !checkout.contacted) {
        checkout.copy(contacted = true, contactedAt = now)
      } else {
        checkout
      }
    }
  }

  private fun isOverdueActive(checkout: Checkout): Boolean {
    return checkout.returnedDate == null && DateUtils.isOverdue(checkout.dueDate)
  }
}

object DateUtils {
  private val isoFormatter = DateTimeFormatter.ISO_LOCAL_DATE
  private val displayFormatter = DateTimeFormatter.ofPattern("MMM d, yyyy")

  fun todayIso(): String {
    return LocalDate.now().format(isoFormatter)
  }

  fun addDays(isoDate: String, days: Long): String {
    val date = parseIso(isoDate) ?: LocalDate.now()
    return date.plusDays(days).format(isoFormatter)
  }

  fun parseIso(value: String?): LocalDate? {
    if (value.isNullOrBlank()) return null
    return try {
      LocalDate.parse(value, isoFormatter)
    } catch (_: DateTimeParseException) {
      null
    }
  }

  fun isOverdue(dueDateIso: String): Boolean {
    val dueDate = parseIso(dueDateIso) ?: return false
    return dueDate.isBefore(LocalDate.now())
  }

  fun overdueDays(dueDateIso: String): Long {
    val dueDate = parseIso(dueDateIso) ?: return 0
    if (!dueDate.isBefore(LocalDate.now())) return 0
    return ChronoUnit.DAYS.between(dueDate, LocalDate.now())
  }

  fun display(value: String?): String {
    val parsed = parseIso(value) ?: return "Unknown"
    return parsed.format(displayFormatter)
  }
}
