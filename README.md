# Never Eat Alone

Eine Webapp zum gemeinsamen Essen. Finde Abendessen in deiner Nähe oder lade andere zu dir ein.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **Auth:** Google Login via Firebase Authentication

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Firebase konfigurieren

Erstelle ein Firebase-Projekt unter [console.firebase.google.com](https://console.firebase.google.com) und trage deine Config in `src/firebase.js` ein.

### 3. Entwicklungsserver starten

```bash
npm run dev
```

### 4. Deployment

```bash
npm run build
firebase deploy
```

## Features

- Dinner entdecken und filtern nach Küche
- Dinner erstellen und hosten
- Google Login
- Echtzeit-Updates via Firestore
