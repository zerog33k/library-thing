import Foundation

enum LibraryDate {
  private static let formatter: ISO8601DateFormatter = {
    let value = ISO8601DateFormatter()
    value.formatOptions = [.withFullDate]
    value.timeZone = TimeZone(secondsFromGMT: 0)
    return value
  }()

  static func todayISO() -> String {
    return toISO(Date())
  }

  static func toISO(_ date: Date) -> String {
    return formatter.string(from: date)
  }

  static func parse(_ value: String) -> Date? {
    return formatter.date(from: value)
  }

  static func addDays(_ isoDate: String, days: Int) -> String {
    guard let parsed = parse(isoDate) else {
      return isoDate
    }
    return Calendar.current.date(byAdding: .day, value: days, to: parsed)
      .map(toISO) ?? isoDate
  }

  static func isOverdue(_ dueDate: String, asOf date: String = todayISO()) -> Bool {
    guard let due = parse(dueDate), let reference = parse(date) else {
      return false
    }
    let startOfDue = Calendar.current.startOfDay(for: due)
    let startOfReference = Calendar.current.startOfDay(for: reference)
    return startOfDue < startOfReference
  }

  static func overdueDays(for dueDate: String, asOf date: String = todayISO()) -> Int {
    guard let due = parse(dueDate), let reference = parse(date) else {
      return 0
    }
    let startOfDue = Calendar.current.startOfDay(for: due)
    let startOfReference = Calendar.current.startOfDay(for: reference)
    let raw = Calendar.current.dateComponents([.day], from: startOfDue, to: startOfReference).day ?? 0
    return max(0, raw)
  }

  static func display(_ isoDate: String) -> String {
    guard let date = parse(isoDate) else {
      return isoDate
    }
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    return formatter.string(from: date)
  }
}

