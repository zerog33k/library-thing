# Library App (Android / Kotlin Compose)

## Shared seed data

This app uses the single canonical data file at:

`/Users/zerogeek/code/library-thing/data/sci-fi-library-mock-data.json`

A Gradle `preBuild` task copies that file into generated app assets at build time.

## Build

```bash
cd /Users/zerogeek/code/library-thing/android-app
./gradlew :app:assembleDebug
```

## Run from Android Studio

1. Open `android-app` as a project.
2. Select `app` configuration.
3. Run on an emulator/device.
