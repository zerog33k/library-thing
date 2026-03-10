# LibraryApp (SwiftUI)

## Quick start

1. Make sure Xcode is installed.
2. From this folder, regenerate the project (if needed):

```bash
cd /Users/zerogeek/code/library-thing/swiftui-app
xcodegen generate
```

3. Open the project:

```bash
open LibraryApp.xcodeproj
```

4. Select a simulator and press **Run**.

## Project layout

- `Project.yml` — XcodeGen spec used to generate `LibraryApp.xcodeproj`
- `LibraryApp.xcodeproj` — generated Xcode project
- `LibraryApp/` — SwiftUI app code and assets
- `Resources/` — seeded Sci-Fi JSON file used for app data

## Re-run project generation

If you edit `Project.yml`, re-run:

```bash
cd /Users/zerogeek/code/library-thing/swiftui-app
xcodegen generate
```

Then reopen `LibraryApp.xcodeproj`.

