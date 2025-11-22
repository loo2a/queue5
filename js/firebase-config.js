// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqisKc23O4jK3icohi1gJxBT8PutUOYFQ",
  authDomain: "queue7-c107b.firebaseapp.com",
  databaseURL: "https://queue7-c107b-default-rtdb.firebaseio.com",
  projectId: "queue7-c107b",
  storageBucket: "queue7-c107b.firebasestorage.app",
  messagingSenderId: "143343650250",
  appId: "1:143343650250:web:97da71efabf44309963b33",
  measurementId: "G-9TP4P04413"
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
