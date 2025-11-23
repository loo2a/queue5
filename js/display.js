// Display Page Logic
class DisplayPage {
    constructor() {
        this.mediaFiles = [];
        this.currentMediaIndex = 0;
        this.mediaPlayer = null;
        this.isMuted = true;
        this.isPlaying = true;
        
        this.init();
    }

    async init() {
        this.mediaPlayer = document.getElementById('mediaPlayer');
        
        await this.loadMediaFiles();
        this.setupEventListeners();
        this.generateQRCode();
        this.startMediaPlayback();
        this.updateDisplay();
        
        // Update every second
        setInterval(() => this.updateDisplay(), 1000);
    }

    async loadMediaFiles() {
        try {
            // In a real implementation, you would load this from Firebase or a media list
            this.mediaFiles = [
                { name: 'توعية صحية 1', type: 'video', src: '.mp4' },
                { name: 'إعلان طبي', type: 'video', src: '2.mp4' },
                { name: 'نصائح صحية', type: 'video', src: '3.mp4' }
            ];
        } catch (error) {
            console.error('Error loading media files:', error);
            this.mediaFiles = [];
        }
    }

    setupEventListeners() {
        // Media player controls
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        document.getElementById('muteBtn').addEventListener('click', () => {
            this.toggleMute();
        });

        // Media player events
        this.mediaPlayer.addEventListener('ended', () => {
            this.playNextMedia();
        });

        // Listen for real-time updates
        firebaseDB.refs.clinics.on('value', () => {
            this.updateClinicsDisplay();
        });

        firebaseDB.refs.calls.on('child_added', (snapshot) => {
            const call = snapshot.val();
            this.showCallNotification(call);
        });

        firebaseDB.refs.settings.on('value', (snapshot) => {
            this.updateSettings(snapshot.val());
        });
    }

    generateQRCode() {
        const canvas = document.getElementById('qrCanvas');
        const url = window.location.origin + window.location.pathname;
        
        QRCode.toCanvas(canvas, url, {
            width: 100,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error) => {
            if (error) console.error('QR Code generation error:', error);
        });
    }

    startMediaPlayback() {
        if (this.mediaFiles.length > 0) {
            this.playMedia(0);
        }
    }

    playMedia(index) {
        if (index >= this.mediaFiles.length) {
            index = 0; // Loop back to first media
        }
        
        const media = this.mediaFiles[index];
        const mediaSrc = patientSystem.mediaPath + media.src;
        
        this.mediaPlayer.src = mediaSrc;
        this.currentMediaIndex = index;
        
        // Update media info
        document.getElementById('currentMedia').textContent = media.name;
        
        // Play the media
        this.mediaPlayer.play().catch(error => {
            console.error('Error playing media:', error);
            this.playNextMedia();
        });
    }

    playNextMedia() {
        const nextIndex = (this.currentMediaIndex + 1) % this.mediaFiles.length;
        this.playMedia(nextIndex);
    }

    togglePlayPause() {
        const btn = document.getElementById('playPauseBtn');
        const icon = btn.querySelector('i');
        
        if (this.isPlaying) {
            this.mediaPlayer.pause();
            icon.className = 'fas fa-play';
            this.isPlaying = false;
        } else {
            this.mediaPlayer.play();
            icon.className = 'fas fa-pause';
            this.isPlaying = true;
        }
    }

    toggleMute() {
        const btn = document.getElementById('muteBtn');
        const icon = btn.querySelector('i');
        
        this.isMuted = !this.isMuted;
        this.mediaPlayer.muted = this.isMuted;
        
        if (this.isMuted) {
            icon.className = 'fas fa-volume-mute';
            btn.className = 'bg-gray-600 hover:bg-gray-700 p-3 rounded-full transition-colors';
        } else {
            icon.className = 'fas fa-volume-up';
            btn.className = 'bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-colors';
        }
    }

    updateDisplay() {
        this.updateDateTime();
        this.updateClinicsDisplay();
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
        
        document.getElementById('currentTime').textContent = timeString;
        document.getElementById('currentDate').textContent = dateString;
    }

    updateClinicsDisplay() {
        const grid = document.getElementById('clinicsGrid');
        const clinics = Array.from(patientSystem.clinics.values());
        
        grid.innerHTML = '';
        
        clinics.forEach(clinic => {
            const card = this.createClinicCard(clinic);
            grid.appendChild(card);
        });
    }

    createClinicCard(clinic) {
        const card = document.createElement('div');
        card.className = `clinic-card bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20 ${clinic.isActive ? '' : 'opacity-50'}`;
        
        if (patientSystem.currentCall && patientSystem.currentCall.clinicId === clinic.id) {
            card.classList.add('calling');
        }
        
        const statusColor = clinic.isActive ? 'text-green-400' : 'text-red-400';
        const statusText = clinic.isActive ? 'نشطة' : 'متوقفة';
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full ${clinic.isActive ? 'bg-green-400' : 'bg-red-400'} mr-2"></div>
                    <span class="text-sm ${statusColor}">${statusText}</span>
                </div>
                <i class="fas fa-clinic-medical text-blue-400"></i>
            </div>
            <h3 class="text-lg font-bold mb-2">${clinic.name}</h3>
            <div class="number-display text-3xl text-yellow-400 mb-2">
                ${this.formatNumber(clinic.currentNumber)}
            </div>
            <div class="text-sm text-gray-300">
                <div>الرقم الحالي: ${this.formatNumber(clinic.currentNumber)}</div>
                ${clinic.lastCalled ? `<div class="text-xs mt-1">آخر نداء: ${new Date(clinic.lastCalled).toLocaleTimeString('ar-EG')}</div>` : ''}
            </div>
        `;
        
        return card;
    }

    showCallNotification(call) {
        const banner = document.getElementById('notificationBanner');
        const text = document.getElementById('notificationText');
        const time = document.getElementById('notificationTime');
        
        const clinic = patientSystem.clinics.get(call.clinicId);
        const clinicName = clinic ? clinic.name : 'العيادة';
        
        text.textContent = `على العميل رقم ${this.formatNumber(call.patientNumber)} إلى ${clinicName}`;
        time.textContent = new Date().toLocaleTimeString('ar-EG');
        
        banner.classList.add('show');
        
        // Hide after 5 seconds
        setTimeout(() => {
            banner.classList.remove('show');
        }, 5000);
    }

    updateSettings(settings) {
        if (settings.centerName) {
            document.getElementById('centerName').textContent = settings.centerName;
        }
        
        if (settings.newsTicker) {
            document.getElementById('newsTicker').textContent = settings.newsTicker;
        }
    }

    formatNumber(number) {
        return new Intl.NumberFormat('ar-EG').format(number);
    }
}

// Initialize display page
document.addEventListener('DOMContentLoaded', () => {
    new DisplayPage();
});
