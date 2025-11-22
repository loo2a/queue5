// Management Page Logic
class ManagementPage {
    constructor() {
        this.currentEditingClinic = null;
        this.instantAudioFiles = [
            'welcome.mp3',
            'attention.mp3',
            'please_wait.mp3',
            'thank_you.mp3',
            'emergency.mp3'
        ];
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadClinics();
        this.setupEventListeners();
        this.populateInstantAudio();
    }

    async loadSettings() {
        try {
            const snapshot = await firebaseDB.refs.settings.once('value');
            const settings = snapshot.val() || {};
            
            // Populate form fields
            document.getElementById('centerName').value = settings.centerName || 'المركز الطبي';
            document.getElementById('audioSpeed').value = settings.audioSpeed || 1.0;
            document.getElementById('speedValue').textContent = settings.audioSpeed || 1.0;
            document.getElementById('audioPath').value = settings.audioPath || '';
            document.getElementById('mediaPath').value = settings.mediaPath || '';
            document.getElementById('newsTicker').value = settings.newsTicker || '';
            document.getElementById('enableTTS').checked = settings.enableTTS !== false;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async loadClinics() {
        try {
            const snapshot = await firebaseDB.refs.clinics.once('value');
            const clinics = snapshot.val() || {};
            
            this.updateClinicsTable(clinics);
            this.populateClinicSelect(clinics);
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    updateClinicsTable(clinics) {
        const tbody = document.getElementById('clinicsTableBody');
        tbody.innerHTML = '';
        
        Object.entries(clinics).forEach(([id, clinic]) => {
            const row = document.createElement('tr');
            const statusColor = clinic.isActive ? 'text-green-600' : 'text-red-600';
            const statusText = clinic.isActive ? 'نشطة' : 'متوقفة';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${clinic.color || '#3B82F6'}"></div>
                        <span class="text-sm font-medium text-gray-900">${clinic.name || ''}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${clinic.number || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${clinic.password || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${clinic.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${clinic.currentNumber || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="management.editClinic('${id}')" class="text-blue-600 hover:text-blue-900 ml-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="management.deleteClinic('${id}')" class="text-red-600 hover:text-red-900 ml-3">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="management.resetClinic('${id}')" class="text-yellow-600 hover:text-yellow-900">
                        <i class="fas fa-undo"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    populateClinicSelect(clinics) {
        const select = document.getElementById('directCallClinic');
        select.innerHTML = '<option value="">اختر العيادة</option>';
        
        Object.entries(clinics).forEach(([id, clinic]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = clinic.name || `عيادة ${clinic.number}`;
            select.appendChild(option);
        });
    }

    populateInstantAudio() {
        const select = document.getElementById('instantAudio');
        select.innerHTML = '<option value="">اختر ملف صوتي</option>';
        
        this.instantAudioFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.textContent = file.replace('.mp3', '');
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        // Settings
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        
        // Audio speed slider
        document.getElementById('audioSpeed').addEventListener('input', (e) => {
            document.getElementById('speedValue').textContent = e.target.value;
        });
        
        // Clinic management
        document.getElementById('addClinicBtn').addEventListener('click', () => this.showAddClinicModal());
        document.getElementById('clinicForm').addEventListener('submit', (e) => this.saveClinic(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideClinicModal());
        
        // Quick actions
        document.getElementById('emergencyCallBtn').addEventListener('click', () => this.emergencyCall());
        document.getElementById('directCallBtn').addEventListener('click', () => this.directCall());
        document.getElementById('ttsTestBtn').addEventListener('click', () => this.testTTS());
        document.getElementById('broadcastBtn').addEventListener('click', () => this.broadcastAudio());
        
        // Close modal on outside click
        document.getElementById('clinicModal').addEventListener('click', (e) => {
            if (e.target.id === 'clinicModal') {
                this.hideClinicModal();
            }
        });
    }

    async saveSettings() {
        try {
            const settings = {
                centerName: document.getElementById('centerName').value,
                audioSpeed: parseFloat(document.getElementById('audioSpeed').value),
                audioPath: document.getElementById('audioPath').value,
                mediaPath: document.getElementById('mediaPath').value,
                newsTicker: document.getElementById('newsTicker').value,
                enableTTS: document.getElementById('enableTTS').checked,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await firebaseDB.refs.settings.set(settings);
            
            // Show success message
            this.showAlert('تم حفظ الإعدادات بنجاح', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showAlert('خطأ في حفظ الإعدادات', 'error');
        }
    }

    showAddClinicModal() {
        this.currentEditingClinic = null;
        document.getElementById('modalTitle').textContent = 'إضافة عيادة';
        document.getElementById('clinicForm').reset();
        document.getElementById('clinicModal').classList.remove('hidden');
        document.getElementById('clinicModal').classList.add('flex');
    }

    editClinic(clinicId) {
        this.currentEditingClinic = clinicId;
        
        firebaseDB.refs.clinics.child(clinicId).once('value', (snapshot) => {
            const clinic = snapshot.val();
            if (clinic) {
                document.getElementById('clinicName').value = clinic.name || '';
                document.getElementById('clinicNumber').value = clinic.number || '';
                document.getElementById('clinicPassword').value = clinic.password || '';
                document.getElementById('clinicColor').value = clinic.color || '#3B82F6';
                
                document.getElementById('modalTitle').textContent = 'تعديل عيادة';
                document.getElementById('clinicModal').classList.remove('hidden');
                document.getElementById('clinicModal').classList.add('flex');
            }
        });
    }

    hideClinicModal() {
        document.getElementById('clinicModal').classList.add('hidden');
        document.getElementById('clinicModal').classList.remove('flex');
        this.currentEditingClinic = null;
    }

    async saveClinic(e) {
        e.preventDefault();
        
        try {
            const clinicData = {
                name: document.getElementById('clinicName').value,
                number: document.getElementById('clinicNumber').value,
                password: document.getElementById('clinicPassword').value,
                color: document.getElementById('clinicColor').value,
                isActive: true,
                currentNumber: 0,
                lastCalled: null,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            if (this.currentEditingClinic) {
                // Update existing clinic
                await firebaseDB.refs.clinics.child(this.currentEditingClinic).update(clinicData);
                this.showAlert('تم تحديث العيادة بنجاح', 'success');
            } else {
                // Add new clinic
                const newClinicRef = firebaseDB.refs.clinics.push();
                await newClinicRef.set(clinicData);
                this.showAlert('تم إضافة العيادة بنجاح', 'success');
            }
            
            this.hideClinicModal();
            this.loadClinics();
        } catch (error) {
            console.error('Error saving clinic:', error);
            this.showAlert('خطأ في حفظ العيادة', 'error');
        }
    }

    async deleteClinic(clinicId) {
        if (confirm('هل أنت متأكد من حذف هذه العيادة؟')) {
            try {
                await firebaseDB.refs.clinics.child(clinicId).remove();
                this.showAlert('تم حذف العيادة بنجاح', 'success');
                this.loadClinics();
            } catch (error) {
                console.error('Error deleting clinic:', error);
                this.showAlert('خطأ في حذف العيادة', 'error');
            }
        }
    }

    async resetClinic(clinicId) {
        if (confirm('هل أنت متأكد من تصفير العيادة؟')) {
            try {
                await firebaseDB.refs.clinics.child(clinicId).update({
                    currentNumber: 0,
                    lastCalled: null,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                });
                this.showAlert('تم تصفير العيادة بنجاح', 'success');
                this.loadClinics();
            } catch (error) {
                console.error('Error resetting clinic:', error);
                this.showAlert('خطأ في تصفير العيادة', 'error');
            }
        }
    }

    async emergencyCall() {
        const text = document.getElementById('emergencyText').value.trim();
        if (!text) {
            this.showAlert('أدخل نص النداء الطارئ', 'warning');
            return;
        }
        
        try {
            const callId = PatientCallingSystem.generateId();
            await firebaseDB.refs.calls.child(callId).set({
                id: callId,
                type: 'emergency',
                text: text,
                status: 'pending',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            document.getElementById('emergencyText').value = '';
            this.showAlert('تم إرسال النداء الطارئ', 'success');
        } catch (error) {
            console.error('Error sending emergency call:', error);
            this.showAlert('خطأ في إرسال النداء الطارئ', 'error');
        }
    }

    async directCall() {
        const clinicId = document.getElementById('directCallClinic').value;
        const patientNumber = document.getElementById('directCallNumber').value;
        
        if (!clinicId || !patientNumber) {
            this.showAlert('اختر العيادة وأدخل رقم العميل', 'warning');
            return;
        }
        
        try {
            // Update clinic current number
            await firebaseDB.refs.clinics.child(clinicId).update({
                currentNumber: parseInt(patientNumber),
                lastCalled: firebase.database.ServerValue.TIMESTAMP
            });
            
            // Create call record
            const callId = PatientCallingSystem.generateId();
            await firebaseDB.refs.calls.child(callId).set({
                id: callId,
                clinicId: clinicId,
                patientNumber: parseInt(patientNumber),
                status: 'pending',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            document.getElementById('directCallNumber').value = '';
            this.showAlert('تم إرسال النداء المباشر', 'success');
        } catch (error) {
            console.error('Error sending direct call:', error);
            this.showAlert('خطأ في إرسال النداء المباشر', 'error');
        }
    }

    testTTS() {
        const text = document.getElementById('ttsText').value.trim();
        if (!text) {
            this.showAlert('أدخل نص للنطق', 'warning');
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance();
        utterance.text = text;
        utterance.lang = 'ar-SA';
        utterance.rate = parseFloat(document.getElementById('audioSpeed').value);
        
        speechSynthesis.speak(utterance);
        document.getElementById('ttsText').value = '';
    }

    async broadcastAudio() {
        const audioFile = document.getElementById('instantAudio').value;
        if (!audioFile) {
            this.showAlert('اختر ملف صوتي للإذاعة', 'warning');
            return;
        }
        
        try {
            const broadcastId = PatientCallingSystem.generateId();
            await firebaseDB.refs.calls.child(broadcastId).set({
                id: broadcastId,
                type: 'broadcast',
                audioFile: audioFile,
                status: 'pending',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            this.showAlert('تم إرسال الإذاعة الصوتية', 'success');
        } catch (error) {
            console.error('Error broadcasting audio:', error);
            this.showAlert('خطأ في إرسال الإذاعة الصوتية', 'error');
        }
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

// Initialize management page
let management;
document.addEventListener('DOMContentLoaded', () => {
    management = new ManagementPage();
});