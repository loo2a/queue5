// Control Page Logic
class ControlPage {
    constructor() {
        this.currentClinic = null;
        this.isMuted = false;
        this.isActive = true;
        
        this.init();
    }

    async init() {
        await this.loadClinics();
        this.setupEventListeners();
        this.updateTime();
        
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
    }

    async loadClinics() {
        try {
            const snapshot = await firebaseDB.refs.clinics.once('value');
            const clinics = snapshot.val() || {};
            
            this.populateClinicSelect(clinics);
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    populateClinicSelect(clinics) {
        const select = document.getElementById('clinicSelect');
        select.innerHTML = '<option value="" class="text-gray-900">اختر العيادة</option>';
        
        Object.entries(clinics).forEach(([id, clinic]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = clinic.name || `عيادة ${clinic.number}`;
            option.className = 'text-gray-900';
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
        
        // Mute button
        document.getElementById('muteBtn').addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Control buttons
        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextPatient();
        });
        
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousPatient();
        });
        
        document.getElementById('repeatBtn').addEventListener('click', () => {
            this.repeatCall();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetClinic();
        });
        
        // Specific number call
        document.getElementById('specificCallBtn').addEventListener('click', () => {
            this.callSpecificNumber();
        });
        
        // Display message
        document.getElementById('displayMessageBtn').addEventListener('click', () => {
            this.displayMessage();
        });
        
        // Toggle status
        document.getElementById('toggleStatusBtn').addEventListener('click', () => {
            this.toggleClinicStatus();
        });
        
        // Emergency call
        document.getElementById('emergencyBtn').addEventListener('click', () => {
            this.emergencyCall();
        });
        
        // Listen for clinic updates
        firebaseDB.refs.clinics.on('value', () => {
            if (this.currentClinic) {
                this.updateClinicDisplay();
            }
        });
    }

    async login() {
        const clinicId = document.getElementById('clinicSelect').value;
        const password = document.getElementById('passwordInput').value;
        
        if (!clinicId || !password) {
            this.showAlert('اختر العيادة وأدخل كلمة السر', 'warning');
            return;
        }
        
        try {
            const snapshot = await firebaseDB.refs.clinics.child(clinicId).once('value');
            const clinic = snapshot.val();
            
            if (!clinic) {
                this.showAlert('العيادة غير موجودة', 'error');
                return;
            }
            
            if (clinic.password !== password) {
                this.showAlert('كلمة السر غير صحيحة', 'error');
                return;
            }
            
            // Successful login
            this.currentClinic = {
                id: clinicId,
                ...clinic
            };
            
            this.showControlPanel();
            this.updateClinicDisplay();
            
        } catch (error) {
            console.error('Error during login:', error);
            this.showAlert('خطأ في تسجيل الدخول', 'error');
        }
    }

    showControlPanel() {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('controlSection').classList.remove('hidden');
    }

    logout() {
        this.currentClinic = null;
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('controlSection').classList.add('hidden');
        document.getElementById('passwordInput').value = '';
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const btn = document.getElementById('muteBtn');
        const icon = btn.querySelector('i');
        
        if (this.isMuted) {
            icon.className = 'fas fa-volume-mute';
            btn.className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors';
        } else {
            icon.className = 'fas fa-volume-up';
            btn.className = 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors';
        }
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-EG');
        document.getElementById('currentTime').textContent = timeString;
    }

    async updateClinicDisplay() {
        if (!this.currentClinic) return;
        
        try {
            const snapshot = await firebaseDB.refs.clinics.child(this.currentClinic.id).once('value');
            this.currentClinic = {
                id: this.currentClinic.id,
                ...snapshot.val()
            };
            
            // Update display
            document.getElementById('clinicName').textContent = this.currentClinic.name;
            document.getElementById('currentNumber').textContent = this.formatNumber(this.currentClinic.currentNumber || 0);
            
            // Update status
            this.isActive = this.currentClinic.isActive !== false;
            this.updateStatusDisplay();
            
        } catch (error) {
            console.error('Error updating clinic display:', error);
        }
    }

    updateStatusDisplay() {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const toggleBtn = document.getElementById('toggleStatusBtn');
        
        if (this.isActive) {
            indicator.className = 'w-4 h-4 rounded-full bg-green-400 pulse-animation';
            statusText.textContent = 'نشطة';
            statusText.className = 'text-lg font-semibold text-green-400';
            toggleBtn.innerHTML = '<i class="fas fa-pause ml-2"></i>إيقاف العيادة';
            toggleBtn.className = 'w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors';
        } else {
            indicator.className = 'w-4 h-4 rounded-full bg-red-400';
            statusText.textContent = 'متوقفة';
            statusText.className = 'text-lg font-semibold text-red-400';
            toggleBtn.innerHTML = '<i class="fas fa-play ml-2"></i>استئناف العيادة';
            toggleBtn.className = 'w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors';
        }
    }

    async nextPatient() {
        if (!this.currentClinic || !this.isActive) return;
        
        try {
            const newNumber = (this.currentClinic.currentNumber || 0) + 1;
            
            await firebaseDB.refs.clinics.child(this.currentClinic.id).update({
                currentNumber: newNumber,
                lastCalled: firebase.database.ServerValue.TIMESTAMP
            });
            
            // Create call record
            await this.createCallRecord(newNumber);
            
            this.updateClinicDisplay();
            this.showAlert(`تم الانتقال للعميل رقم ${this.formatNumber(newNumber)}`, 'success');
            
        } catch (error) {
            console.error('Error moving to next patient:', error);
            this.showAlert('خطأ في الانتقال للعميل التالي', 'error');
        }
    }

    async previousPatient() {
        if (!this.currentClinic || !this.isActive) return;
        
        try {
            const currentNumber = this.currentClinic.currentNumber || 0;
            const newNumber = Math.max(0, currentNumber - 1);
            
            await firebaseDB.refs.clinics.child(this.currentClinic.id).update({
                currentNumber: newNumber,
                lastCalled: firebase.database.ServerValue.TIMESTAMP
            });
            
            // Create call record
            await this.createCallRecord(newNumber);
            
            this.updateClinicDisplay();
            this.showAlert(`تم الرجوع للعميل رقم ${this.formatNumber(newNumber)}`, 'success');
            
        } catch (error) {
            console.error('Error moving to previous patient:', error);
            this.showAlert('خطأ في الرجوع للعميل السابق', 'error');
        }
    }

    async repeatCall() {
        if (!this.currentClinic || !this.isActive) return;
        
        try {
            const currentNumber = this.currentClinic.currentNumber || 0;
            
            // Create call record for repeat
            await this.createCallRecord(currentNumber);
            
            this.showAlert(`تم تكرار نداء الرقم ${this.formatNumber(currentNumber)}`, 'success');
            
        } catch (error) {
            console.error('Error repeating call:', error);
            this.showAlert('خطأ في تكرار النداء', 'error');
        }
    }

    async resetClinic() {
        if (!this.currentClinic) return;
        
        if (!confirm('هل أنت متأكد من تصفير العيادة؟ سيتم إعادة العداد إلى الصفر.')) {
            return;
        }
        
        try {
            await firebaseDB.refs.clinics.child(this.currentClinic.id).update({
                currentNumber: 0,
                lastCalled: null
            });
            
            this.updateClinicDisplay();
            this.showAlert('تم تصفير العيادة بنجاح', 'success');
            
        } catch (error) {
            console.error('Error resetting clinic:', error);
            this.showAlert('خطأ في تصفير العيادة', 'error');
        }
    }

    async callSpecificNumber() {
        if (!this.currentClinic || !this.isActive) return;
        
        const numberInput = document.getElementById('specificNumber');
        const number = parseInt(numberInput.value);
        
        if (!number || number < 0) {
            this.showAlert('أدخل رقم صحيح', 'warning');
            return;
        }
        
        try {
            await firebaseDB.refs.clinics.child(this.currentClinic.id).update({
                currentNumber: number,
                lastCalled: firebase.database.ServerValue.TIMESTAMP
            });
            
            await this.createCallRecord(number);
            
            numberInput.value = '';
            this.updateClinicDisplay();
            this.showAlert(`تم النداء على الرقم ${this.formatNumber(number)}`, 'success');
            
        } catch (error) {
            console.error('Error calling specific number:', error);
            this.showAlert('خطأ في نداء الرقم المحدد', 'error');
        }
    }

    async displayMessage() {
        const messageInput = document.getElementById('displayMessage');
        const message = messageInput.value.trim();
        
        if (!message) {
            this.showAlert('أدخل نص الرسالة', 'warning');
            return;
        }
        
        try {
            const messageId = PatientCallingSystem.generateId();
            await firebaseDB.refs.calls.child(messageId).set({
                id: messageId,
                type: 'message',
                text: message,
                status: 'pending',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            messageInput.value = '';
            this.showAlert('تم إرسال الرسالة للعرض', 'success');
            
        } catch (error) {
            console.error('Error displaying message:', error);
            this.showAlert('خطأ في إرسال الرسالة', 'error');
        }
    }

    async toggleClinicStatus() {
        if (!this.currentClinic) return;
        
        try {
            const newStatus = !this.isActive;
            
            await firebaseDB.refs.clinics.child(this.currentClinic.id).update({
                isActive: newStatus,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            this.isActive = newStatus;
            this.updateStatusDisplay();
            
            const statusText = newStatus ? 'نشطة' : 'متوقفة';
            this.showAlert(`تم تغيير حالة العيادة إلى ${statusText}`, 'success');
            
        } catch (error) {
            console.error('Error toggling clinic status:', error);
            this.showAlert('خطأ في تغيير حالة العيادة', 'error');
        }
    }

    async emergencyCall() {
        if (!this.currentClinic) return;
        
        const emergencyText = `نداء طارئ من ${this.currentClinic.name} - يرجى التوجه للعيادة فوراً`;
        
        try {
            const callId = PatientCallingSystem.generateId();
            await firebaseDB.refs.calls.child(callId).set({
                id: callId,
                type: 'emergency',
                clinicId: this.currentClinic.id,
                text: emergencyText,
                status: 'pending',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            this.showAlert('تم إرسال النداء الطارئ', 'success');
            
        } catch (error) {
            console.error('Error sending emergency call:', error);
            this.showAlert('خطأ في إرسال النداء الطارئ', 'error');
        }
    }

    async createCallRecord(number) {
        const callId = PatientCallingSystem.generateId();
        await firebaseDB.refs.calls.child(callId).set({
            id: callId,
            clinicId: this.currentClinic.id,
            patientNumber: number,
            status: 'pending',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    formatNumber(number) {
        return new Intl.NumberFormat('ar-EG').format(number);
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-x-full`;
        
        // Set alert style based on type
        switch (type) {
            case 'success':
                alert.classList.add('bg-green-600');
                break;
            case 'error':
                alert.classList.add('bg-red-600');
                break;
            case 'warning':
                alert.classList.add('bg-yellow-600');
                break;
            default:
                alert.classList.add('bg-blue-600');
        }
        
        alert.textContent = message;
        document.body.appendChild(alert);
        
        // Show alert
        setTimeout(() => {
            alert.classList.remove('translate-x-full');
        }, 100);
        
        // Hide alert after 3 seconds
        setTimeout(() => {
            alert.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(alert);
            }, 300);
        }, 3000);
    }
}

// Initialize control page
document.addEventListener('DOMContentLoaded', () => {
    new ControlPage();
});