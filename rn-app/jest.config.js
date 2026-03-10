module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.(test|spec).ts', '<rootDir>/src/**/*.(test|spec).tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(immer|@reduxjs/toolkit|react-native|@react-native|@react-native\\/js-polyfills|expo|expo-modules-core|expo-modules-autolinking|@expo)/)',
  ],
}
