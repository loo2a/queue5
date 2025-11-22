// Main Application Logic
class PatientCallingSystem {
    constructor() {
        this.clinics = new Map();
        this.settings = {};
        this.audioQueue = [];
        this.isPlaying = false;
        this.currentCall = null;
        this.audioPath = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/audio/';
        this.mediaPath = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/media/';
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadClinics();
        this.setupEventListeners();
        this.updateSystemStatus();
        
        // Update time every second
        setInterval(() => this.updateDateTime(), 1000);
    }

    async loadSettings() {
        try {
            const snapshot = await firebaseDB.refs.settings.once('value');
            this.settings = snapshot.val() || this.getDefaultSettings();
            
            // Update audio path if custom path is set
            if (this.settings.audioPath) {
                this.audioPath = this.settings.audioPath;
            }
            if (this.settings.mediaPath) {
                this.mediaPath = this.settings.mediaPath;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            centerName: 'المركز الطبي',
            audioSpeed: 1.0,
            audioPath: '',
            mediaPath: '',
            newsTicker: 'مرحباً بكم في المركز الطبي - نسعى لتقديم أفضل خدمة طبية لكم',
            enableTTS: true,
            ttsLanguage: 'ar-SA'
        };
    }

    async loadClinics() {
        try {
            const snapshot = await firebaseDB.refs.clinics.once('value');
            const clinicsData = snapshot.val() || {};
            
            this.clinics.clear();
            Object.entries(clinicsData).forEach(([id, clinic]) => {
                this.clinics.set(id, {
                    id,
                    name: clinic.name || `عيادة ${id}`,
                    number: clinic.number || id,
                    password: clinic.password || '1234',
                    currentNumber: clinic.currentNumber || 0,
                    isActive: clinic.isActive !== false,
                    lastCalled: clinic.lastCalled || null,
                    color: clinic.color || '#3B82F6'
                });
            });
            
            this.updateClinicsDisplay();
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    setupEventListeners() {
        // Listen for real-time updates
        firebaseDB.refs.clinics.on('value', (snapshot) => {
            this.loadClinics();
        });

        firebaseDB.refs.calls.on('child_added', (snapshot) => {
            const call = snapshot.val();
            this.handleNewCall(call);
        });

        firebaseDB.refs.settings.on('value', (snapshot) => {
            this.loadSettings();
        });
    }

    async handleNewCall(call) {
        if (call.status === 'pending') {
            this.audioQueue.push(call);
            if (!this.isPlaying) {
                await this.processAudioQueue();
            }
        }
    }

    async processAudioQueue() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const call = this.audioQueue.shift();
        this.currentCall = call;

        try {
            await this.playCallAudio(call);
            
            // Mark call as completed
            await firebaseDB.refs.calls.child(call.id).update({
                status: 'completed',
                completedAt: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Error playing call audio:', error);
            
            // Fallback to TTS
            if (this.settings.enableTTS) {
                await this.playTTSAudio(call);
            }
        }

        this.currentCall = null;
        await this.processAudioQueue();
    }

    async playCallAudio(call) {
        const audioFiles = this.getAudioFilesForCall(call);
        
        // Play ding sound first
        await this.playAudioFile('ding.mp3');
        
        // Play the call sequence
        for (const file of audioFiles) {
            await this.playAudioFile(file);
        }
    }

    getAudioFilesForCall(call) {
        const files = [];
        const number = call.patientNumber;
        const clinic = this.clinics.get(call.clinicId);
        
        // Add prefix
        files.push('prefix.mp3');
        
        // Break down the number
        if (number >= 100) {
            const hundreds = Math.floor(number / 100) * 100;
            files.push(`${hundreds}.mp3`);
            const remainder = number % 100;
            if (remainder > 0) {
                files.push('and.mp3');
                if (remainder >= 10) {
                    const tens = Math.floor(remainder / 10) * 10;
                    const units = remainder % 10;
                    if (units > 0) {
                        files.push(`${units}.mp3`);
                        files.push('and.mp3');
                    }
                    files.push(`${tens}.mp3`);
                } else {
                    files.push(`${remainder}.mp3`);
                }
            }
        } else if (number >= 10) {
            const tens = Math.floor(number / 10) * 10;
            const units = number % 10;
            if (units > 0) {
                files.push(`${units}.mp3`);
                files.push('and.mp3');
            }
            files.push(`${tens}.mp3`);
        } else {
            files.push(`${number}.mp3`);
        }
        
        // Add clinic audio
        if (clinic) {
            files.push(`clinic${clinic.number}.mp3`);
        }
        
        return files;
    }

    playAudioFile(filename) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = this.audioPath + filename;
            audio.playbackRate = this.settings.audioSpeed;
            
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error(`Failed to play ${filename}`));
            
            audio.play().catch(reject);
        });
    }

    async playTTSAudio(call) {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance();
            const clinic = this.clinics.get(call.clinicId);
            
            utterance.text = `على العميل رقم ${call.patientNumber} إلى ${clinic ? clinic.name : 'العيادة'}`;
            utterance.lang = this.settings.ttsLanguage;
            utterance.rate = this.settings.audioSpeed;
            
            utterance.onend = () => resolve();
            speechSynthesis.speak(utterance);
        });
    }

    updateSystemStatus() {
        const activeClinics = Array.from(this.clinics.values()).filter(c => c.isActive).length;
        const totalPatients = Array.from(this.clinics.values()).reduce((sum, c) => sum + c.currentNumber, 0);
        
        const activeClinicsEl = document.getElementById('activeClinics');
        const totalPatientsEl = document.getElementById('totalPatients');
        const lastUpdateEl = document.getElementById('lastUpdate');
        
        if (activeClinicsEl) activeClinicsEl.textContent = activeClinics;
        if (totalPatientsEl) totalPatientsEl.textContent = totalPatients;
        if (lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleTimeString('ar-EG');
    }

    updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-EG');
        const dateString = now.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Update any time displays
        const timeElements = document.querySelectorAll('.current-time');
        const dateElements = document.querySelectorAll('.current-date');
        
        timeElements.forEach(el => el.textContent = timeString);
        dateElements.forEach(el => el.textContent = dateString);
    }

    updateClinicsDisplay() {
        // This will be implemented in display-specific pages
        this.updateSystemStatus();
    }

    // Utility methods
    static formatNumber(number) {
        return new Intl.NumberFormat('ar-EG').format(number);
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize the system
const patientSystem = new PatientCallingSystem();

// Export for global use
window.patientSystem = patientSystem;