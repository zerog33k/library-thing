# Library Checkout Interview App

## Development methodology
This app was built in phases to reduce rework and keep behavior consistent across platforms:
- Started with a detailed product/specification document.
- Produced a detailed React Native implementation document.
- Built and iterated on the React Native app first.
- Used the RN implementation and behavior as the baseline to create the SwiftUI and Kotlin/Compose versions with minimal overhead.

## Overview
This repository contains a small cross-platform library checkout app built for interview exercises.

<img width="1000" alt="Screenshot 2026-03-10 at 1 42 22 PM" src="https://github.com/user-attachments/assets/91d1a1ec-2e8d-40f1-acf6-df6de2f17a2c" />

From left to right, native SwiftUI app, react native expo, native android kotlin.

The app supports:
- Browsing a sci-fi catalog
- Title search and simple filtering
- Checking out books to members
- Returning books
- Overdue management with contact workflows
- Overdue-member checkout acknowledgement gate

## Repository layout
- `data/` canonical shared mock data (`sci-fi-library-mock-data.json`)
- `docs/` business analysis + platform implementation specifications
- `rn-app/` React Native (Expo + Redux) implementation
- `swiftui-app/` iOS SwiftUI implementation
- `android-app/` Android Kotlin/Compose implementation

## Shared data strategy
There is a single source-of-truth data file:
- `data/sci-fi-library-mock-data.json`

Platform apps copy this file at build/run time:
- RN: `rn-app/scripts/sync-shared-data.sh`
- SwiftUI: `swiftui-app/scripts/copy-shared-seed-data.sh`
- Android: Gradle `syncSharedData` task in `android-app/app/build.gradle.kts`

## Quick start

### React Native
```bash
cd rn-app
npm install
npm start
```

### SwiftUI
```bash
cd swiftui-app
xcodegen generate
open LibraryApp.xcodeproj
```

### Android
```bash
cd android-app
./gradlew :app:assembleDebug
```

## Documentation
Start with:
- [Business analysis](docs/library-book-checkout-business-analysis.md)

Platform-specific docs:
- [React Native implementation spec](docs/library-book-checkout-implementation-rn.md)
- [SwiftUI implementation spec](docs/library-book-checkout-implementation-swiftui.md)
- [Android Compose implementation spec](docs/library-book-checkout-implementation-compose.md)
