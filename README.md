# SmartBanking

A personal finance app for Australians and Canadians managing money across both countries. Track account balances, monitor live CAD/AUD exchange rates, set rate alerts, and securely store bank details — all in one place.

---

## Features

**Home Dashboard**
Live snapshot of your total accounts, current CAD→AUD rate, and transfer count — all tappable to navigate directly to each section.

**Account Tracker**
Add and manage bank accounts, Wise, Revolut, or other balances in any currency. Total balance is automatically converted to AUD in real time.

**Bank Vault**
Securely store account numbers, BSBs, and transit numbers using iOS Keychain encryption. Tap any detail to copy it instantly to your clipboard.

**Rate Alerts**
Set a target CAD/AUD rate and get notified the moment it's reached. Alerts run in the background and auto-deactivate once triggered.

**Rate Comparison**
Compare live mid-market rates against popular transfer providers — Wise, Revolut, OFX, and bank wire — with direct links to get a quote.

**Transaction History**
Log past transfers with amount, rate, provider, and automatically calculated received amount. Linked to your account balances.

---

## Security

- Biometric authentication (Face ID / Touch ID) required on every launch
- Sensitive bank details stored in iOS Keychain, not AsyncStorage
- No data leaves your device — everything is stored locally

---

## Tech Stack

- React Native (New Architecture enabled)
- TypeScript
- React Navigation (Stack)
- react-native-biometrics
- react-native-keychain
- react-native-background-fetch
- @react-native-async-storage/async-storage
- @react-native-picker/picker
- @react-native-clipboard/clipboard

---

## Getting Started

**Prerequisites**
- Node.js 18+
- Xcode 15+
- CocoaPods
- iOS device or simulator (iOS 15+)

**Install**
```bash
git clone https://github.com/yourusername/smartbanking.git
cd smartbanking
npm install
cd ios && pod install && cd ..
```

**Run**
```bash
npm run ios
```

> Note: Biometric authentication falls back automatically in the simulator during development. Test on a physical device for the full Face ID experience.

---

## Project Structure

```
src/
├── components/
│   └── BiometricGuard.tsx       # Auth wrapper for all screens
├── screens/
│   ├── Home/
│   ├── AccountTracker/
│   ├── RateAlerts/
│   ├── RateComparison/
│   └── TransactionHistory/
├── services/
│   ├── storageService.ts        # AsyncStorage + Keychain data layer
│   ├── rateService.ts           # Live exchange rate fetching
│   ├── notificationService.ts   # Push notification handling
│   └── backgroundRateChecker.ts # Background alert checking
├── types/
└── utils/
    └── currency.ts              # Formatting and conversion helpers
```

---

## Building for Release

1. Open `ios/SmartBanking.xcworkspace` in Xcode
2. Select a real device or `Any iOS Device` as the target
3. Set scheme to **Release**
4. Product → Archive
5. Upload via Xcode Organizer to App Store Connect

---

## License

Private — all rights reserved.