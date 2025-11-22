// Firebase Configuration Template
// أنسخ هذا الملف إلى firebase-config.js وعدل القيم حسب مشروعك

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
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

// Default data structure
const defaultData = {
    settings: {
        centerName: "المركز الطبي",
        audioSpeed: 1.0,
        audioPath: "",
        mediaPath: "",
        newsTicker: "مرحباً بكم في المركز الطبي - نسعى لتقديم أفضل خدمة طبية لكم",
        enableTTS: true,
        ttsLanguage: "ar-SA",
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    },
    
    clinics: {
        clinic1: {
            name: "عيادة طب الأسرة",
            number: "1",
            password: "1234",
            currentNumber: 0,
            isActive: true,
            color: "#3B82F6",
            lastCalled: null,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }
    }
};

// Initialize default data if not exists
function initializeDefaultData() {
    // Check if settings exist
    firebaseDB.refs.settings.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            firebaseDB.refs.settings.set(defaultData.settings);
            console.log('Default settings initialized');
        }
    });
    
    // Check if clinics exist
    firebaseDB.refs.clinics.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            firebaseDB.refs.clinics.set(defaultData.clinics);
            console.log('Default clinics initialized');
        }
    });
}

// Call initialization
initializeDefaultData();