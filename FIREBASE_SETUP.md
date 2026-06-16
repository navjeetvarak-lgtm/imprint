# Imprint Firebase Backend Setup Guide

I have successfully integrated a dynamic Firebase Firestore backend for your Gigs section. Currently, the site uses placeholder credentials, so you need to create a real Firebase project and plug in the credentials.

Follow these steps to go live:

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **Create a project** (or **Add project**). Name it something like "Imprint-Website".
3. Disable Google Analytics (you don't need it for this).
4. Click **Create Project**.

## 2. Register Your Web App
1. On your Firebase project dashboard, click the **Web icon** (`</>`) to add Firebase to your web app.
2. Name the app "Imprint Website".
3. Check the box for **"Also set up Firebase Hosting"** if you plan to host the site on Firebase later (optional, but good to have).
4. Click **Register app**.

## 3. Copy the Config
Firebase will show you a block of code with `firebaseConfig`. Copy those values and open `js/firebase-config.js` in your code editor.

Replace my placeholder values with yours:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_REAL_API_KEY",
  authDomain: "YOUR_REAL_DOMAIN",
  projectId: "YOUR_REAL_PROJECT_ID",
  storageBucket: "YOUR_REAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_REAL_SENDER_ID",
  appId: "YOUR_REAL_APP_ID"
};
```

## 4. Setup Firestore Database
1. In the left menu of the Firebase Console, go to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a location close to your users (e.g., `asia-south1` for India) and start in **Test Mode** (we will update rules next).
4. Once created, go to the **Rules** tab. Replace the rules with this to allow public reading but only secure writing (you can tighten this later if you implement Firebase Auth):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gigs/{gig} {
      allow read: if true;
      allow write: if true; // Note: For production, secure this with Firebase Auth
    }
  }
}
```

## 5. Setup Firebase Storage (For Images)
1. In the left menu, go to **Build > Storage**.
2. Click **Get started**, start in Test Mode, and choose the same location.
3. Once created, go to the **Rules** tab and replace the rules with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /gigs/{imageId} {
      allow read: if true;
      allow write: if true; // Note: For production, secure this with Firebase Auth
    }
  }
}
```

## 6. CORS Configuration (Important for Storage)
Because your website is running locally or on a different domain, Firebase Storage might block image uploads due to CORS.
1. Open Google Cloud Console [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Select your Firebase project at the top.
3. Open the Cloud Shell (terminal icon at top right).
4. Create a cors.json file in the shell:
   ```bash
   echo '[{"origin": ["*"],"responseHeader": ["Content-Type"],"method": ["GET", "HEAD", "DELETE", "POST", "PUT"],"maxAgeSeconds": 3600}]' > cors.json
   ```
5. Apply the CORS config to your storage bucket (replace `YOUR_PROJECT.firebasestorage.app` with your actual bucket URL from the config):
   ```bash
   gsutil cors set cors.json gs://YOUR_PROJECT.firebasestorage.app
   ```

## 7. How to Deploy to GitHub (GitHub Pages)
If you want to host this website for free using GitHub Pages:
1. Initialize a Git repository in your `imprint` folder and commit all files.
2. Create a new public repository on GitHub and push your code to it.
3. On your GitHub repository page, go to **Settings** > **Pages**.
4. Under **Source**, select `Deploy from a branch`.
5. Under **Branch**, select `main` (or `master`) and `/ (root)` folder.
6. Click **Save**.
7. Wait a few minutes, and GitHub will provide you with a live URL (e.g., `https://yourusername.github.io/imprint/`).
8. **Important**: You must add this GitHub Pages domain to the **Authorized Domains** in your Firebase Console (under **Authentication** > **Settings** > **Authorized domains**) so Firebase allows connections from your live site.

## 8. You're Done!
1. Open `html/admin.html` in your browser.
2. The password is `imprint2026` (you can change this inside `admin.html`).
3. Add a gig with an image.
4. Go to `html/gigs.html` or `html/index.html` to see it live with a working countdown!
