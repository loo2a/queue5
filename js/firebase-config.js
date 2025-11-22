// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Database references
const dbRefs = {
    clinics: database.ref('clinics'),
    settings: database.ref('settings'),
    calls: database.ref('calls'),
    media: database.ref('media'),
    patients: database.ref('patients')
};

// Export for use in other files
window.firebaseDB = {
    database,
    refs: dbRefs
};