# RiseUp Social Media App

A luxury social media mobile app built with React Native, Expo, and Firebase. Features Instagram-like functionality with real-time messaging, follower rewards, and a comprehensive wallet system.

## Features

### 🔐 Authentication
- Email/Password authentication
- Google Sign-In integration
- Phone number OTP verification
- Two-factor authentication
- Password reset functionality

### 📱 Core Social Features
- Instagram-style feed with infinite scroll
- Photo and video post creation
- Like and comment system with real-time updates
- Follow/unfollow functionality
- User profiles with post grids

### 💬 Real-time Messaging
- 1-to-1 direct messaging
- Real-time message delivery
- Typing indicators
- Push notifications for new messages

### 💰 Wallet & Rewards
- Earn coins for reaching follower milestones
- Wallet balance tracking
- Transaction history
- Payout request system

### ⚙️ Settings & Customization
- Dark/Light theme toggle
- Profile editing
- Privacy settings
- Account management

## Tech Stack

- **Frontend**: React Native with Expo SDK 50+
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **Notifications**: Expo Push Notifications
- **State Management**: Context API
- **Storage**: AsyncStorage for session persistence
- **Animations**: React Native Reanimated

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Expo CLI
- Firebase project setup

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd riseup-app
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
   - Create a Firebase project
   - Enable Authentication, Firestore, and Storage
   - Replace the Firebase config in `firebase.js` with your project credentials

4. Start the development server
```bash
expo start
```

### Firebase Setup

1. **Authentication**
   - Enable Email/Password authentication
   - Configure Google Sign-In (optional)
   - Enable Phone authentication (optional)

2. **Firestore Database**
   - Deploy the security rules from `firebase.rules`
   - Create initial collections as needed

3. **Cloud Storage**
   - Configure storage rules for user uploads

4. **Cloud Functions**
   - Deploy functions from the `functions/` directory
   - Configure environment variables as needed

## Project Structure

```
RiseUp-App/
├── App.js                 # Main app entry point
├── firebase.js            # Firebase configuration
├── firebase.rules         # Firestore & Storage security rules
├── functions/             # Cloud Functions
├── context/               # React Context providers
│   ├── AuthContext.js
│   └── ThemeContext.js
├── navigation/            # Navigation configuration
│   ├── RootStack.js
│   └── BottomTabs.js
├── screens/               # All app screens
│   ├── auth/             # Authentication screens
│   ├── HomeFeedScreen.js
│   ├── CreatePostScreen.js
│   ├── ChatListScreen.js
│   ├── WalletScreen.js
│   └── ProfileScreen.js
├── components/            # Reusable components
│   ├── PostCard.js
│   ├── Avatar.js
│   ├── Button.js
│   └── InputField.js
└── assets/               # Images and icons
```

## Key Features Implementation

### Real-time Feed
- Posts are loaded with infinite scroll
- Real-time updates for likes and comments
- Optimistic UI updates for better UX

### Messaging System
- Real-time message delivery using Firestore listeners
- Push notifications for new messages
- Chat list with unread message counts

### Reward System
- Cloud Functions monitor follower count changes
- Automatic reward distribution when milestones are reached
- Transaction history tracking

### Security
- Comprehensive Firestore security rules
- User data isolation
- Secure file uploads to Cloud Storage

## Environment Variables

Create a `.env` file with your Firebase configuration:

```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your-app-id
```

## Deployment

### Building for Production

1. **iOS**
```bash
expo build:ios
```

2. **Android**
```bash
expo build:android
```

### Using EAS Build (Recommended)

1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

2. Configure EAS
```bash
eas build:configure
```

3. Build for production
```bash
eas build --platform all
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.