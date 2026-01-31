# Firebase Setup Guide for MediSync

## Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project" or select an existing one
3. Enter project name: `medisync`
4. Accept default settings and create

## Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under "Your apps", click **Web** to register a new web app
3. Copy the firebaseConfig object

## Setup Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`)
2. Add your Firebase credentials:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Enable Firebase Services

### 1. Enable Authentication

- In Firebase Console, go to **Authentication**
- Click **Get Started**
- Enable **Email/Password** authentication

### 2. Create Firestore Database

- In Firebase Console, go to **Firestore Database**
- Click **Create Database**
- Start in **Test Mode** (for development)
- Choose a region close to you

### 3. Create Firestore Collections

In Firestore, create these collections:

- **users** - Store user profiles
- **patients** - Patient data
- **alerts** - Health alerts
- **vitals** - Vital readings
- **medicines** - Medicine information
- **lab_reports** - Lab reports
- **wards** - Ward information
- **staff_schedules** - Staff schedules

## How the App Works with Firebase

1. **Authentication**: Uses Firebase Authentication (Email/Password)
2. **Data Storage**: Uses Firestore for all data
3. **Fallback**: If Firebase credentials aren't set, uses mock data
4. **Real-time**: Firestore queries are real-time by default

## Testing

After setting up Firebase:

```bash
npm start
```

- Create a new account
- Data will be stored in Firestore
- Refresh the page - data persists across sessions

## Firestore Rules (Test Mode)

For development, test mode allows read/write. For production, set proper security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

- **"Firebase is not initialized"**: Check `.env` file has correct values
- **"Permission denied"**: Make sure Firestore security rules allow read/write
- **"User not found"**: Check email/password in Firebase Authentication
- **Mock data showing**: Firebase credentials aren't set or invalid

## Next Steps

1. Add real data to Firestore collections
2. Set up proper security rules for production
3. Enable email verification
4. Add password reset functionality
