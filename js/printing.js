// Printing Page Logic
class PrintingPage {
    constructor() {
        this.clinics = new Map();
        this.currentClinic = null;
        
        this.init();
    }

    async init() {
        await this.loadClinics();
        this.setupEventListeners();
    }

    async loadClinics() {
        try {
            const snapshot = await firebaseDB.refs.clinics.once('value');
            const clinicsData = snapshot.val() || {};
            
            this.clinics.clear();
            Object.entries(clinicsData).forEach(([id, clinic]) => {
                this.clinics.set(id, {
                    id,
                    name: clinic.name || `عيادة ${clinic.number}`,
                    number: clinic.number || id,
                    currentNumber: clinic.currentNumber || 0
                });
            });
            
            this.populateClinicSelect();
        } catch (error) {
            console.error('Error loading clinics:', error);
        }
    }

    populateClinicSelect() {
        const select = document.getElementById('clinicSelect');
        select.innerHTML = '<option value="">اختر العيادة</option>';
        
        this.clinics.forEach(clinic => {
            const option = document.createElement('option');
            option.value = clinic.id;
            option.textContent = clinic.name;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        // Clinic selection
        document.getElementById('clinicSelect').addEventListener('change', (e) => {
            this.currentClinic = this.clinics.get(e.target.value) || null;
            this.updateNumberRange();
        });
        
        // Number inputs
        document.getElementById('startNumber').addEventListener('input', () => {
            this.validateNumbers();
        });
        
        document.getElementById('endNumber').addEventListener('input', () => {
            this.validateNumbers();
        });
        
        // Print button
        document.getElementById('printBtn').addEventListener('click', () => {
            this.generatePreview();
        });
        
        // Preview buttons
        document.getElementById('confirmPrint').addEventListener('click', () => {
            this.printTickets();
        });
        
        document.getElementById('cancelPrint').addEventListener('click', () => {
            this.hidePreview();
        });
    }

    updateNumberRange() {
        if (!this.currentClinic) return;
        
        const startInput = document.getElementById('startNumber');
        const endInput = document.getElementById('endNumber');
        const currentNumber = this.currentClinic.currentNumber || 0;
        
        // Suggest next numbers
        startInput.value = currentNumber + 1;
        endInput.value = currentNumber + 10;
    }

    validateNumbers() {
        const startInput = document.getElementById('startNumber');
        const endInput = document.getElementById('endNumber');
        const start = parseInt(startInput.value) || 0;
        const end = parseInt(endInput.value) || 0;
        
        if (start > end) {
            endInput.value = start;
        }
        
        // Limit to reasonable number of tickets
        if (end - start > 100) {
            endInput.value = start + 100;
        }
    }

    generatePreview() {
        const clinicId = document.getElementById('clinicSelect').value;
        const start = parseInt(document.getElementById('startNumber').value);
        const end = parseInt(document.getElementById('endNumber').value);
        
        if (!clinicId || !start || !end) {
            this.showAlert('اختر العيادة وأدخل نطاق الأرقام', 'warning');
            return;
        }
        
        if (start > end) {
            this.showAlert('رقم البداية يجب أن يكون أقل من رقم النهاية', 'warning');
            return;
        }
        
        if (end - start > 100) {
            this.showAlert('الحد الأقصى لعدد التذاكر هو 100 تذكرة', 'warning');
            return;
        }
        
        this.currentClinic = this.clinics.get(clinicId);
        this.showPreview(start, end);
    }

    showPreview(start, end) {
        const previewSection = document.getElementById('previewSection');
        const ticketsContainer = document.getElementById('ticketsPreview');
        
        // Clear previous preview
        ticketsContainer.innerHTML = '';
        
        // Generate preview tickets
        const ticketCount = Math.min(end - start + 1, 20); // Show max 20 tickets in preview
        
        for (let i = 0; i < ticketCount; i++) {
            const number = start + i;
            const ticket = this.createTicketElement(number, true);
            ticketsContainer.appendChild(ticket);
        }
        
        // Show preview section
        previewSection.classList.remove('hidden');
        
        // Scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    hidePreview() {
        document.getElementById('previewSection').classList.add('hidden');
    }

    createTicketElement(number, isPreview = false) {
        const clinic = this.currentClinic;
        const currentNumber = clinic.currentNumber || 0;
        const waitingCount = Math.max(0, number - currentNumber - 1);
        const estimatedTime = waitingCount * 5; // 5 minutes per patient
        
        // Options
        const showWaitingTime = document.getElementById('includeWaitingTime').checked;
        const showPreviousCount = document.getElementById('includePreviousCount').checked;
        const showDate = document.getElementById('includeDate').checked;
        
        const ticket = document.createElement('div');
        ticket.className = isPreview ? 'ticket-preview print-ticket' : 'print-ticket';
        
        const now = new Date();
        const dateStr = showDate ? now.toLocaleDateString('ar-EG') : '';
        
        ticket.innerHTML = `
            <div class="clinic-name">${clinic.name}</div>
            <div class="ticket-number">${this.formatNumber(number)}</div>
            <div class="ticket-info">
                ${showDate ? `<div>${dateStr}</div>` : ''}
                ${showPreviousCount ? `<div>السابقون: ${waitingCount}</div>` : ''}
            </div>
            ${showWaitingTime && waitingCount > 0 ? `
                <div class="waiting-time">
                    ${this.formatWaitingTime(estimatedTime)}
                </div>
            ` : ''}
        `;
        
        return ticket;
    }

    formatNumber(number) {
        return new Intl.NumberFormat('ar-EG').format(number);
    }

    formatWaitingTime(minutes) {
        if (minutes < 60) {
            return `${minutes} دقيقة`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            if (remainingMinutes === 0) {
                return `${hours} ساعة`;
            } else {
                return `${hours} س و ${remainingMinutes} د`;
            }
        }
    }

    printTickets() {
        const clinicId = document.getElementById('clinicSelect').value;
        const start = parseInt(document.getElementById('startNumber').value);
        const end = parseInt(document.getElementById('endNumber').value);
        
        this.currentClinic = this.clinics.get(clinicId);
        
        // Prepare print section
        const printSection = document.getElementById('printSection');
        const ticketsContainer = document.getElementById('printTickets');
        
        // Clear previous tickets
        ticketsContainer.innerHTML = '';
        
        // Generate all tickets
        for (let number = start; number <= end; number++) {
            const ticket = this.createTicketElement(number, false);
            ticketsContainer.appendChild(ticket);
        }
        
        // Show print section and print
        printSection.classList.remove('hidden');
        
        // Wait for rendering then print
        setTimeout(() => {
            window.print();
            
            // Hide print section after printing
            setTimeout(() => {
                printSection.classList.add('hidden');
                this.hidePreview();
                this.showAlert('تمت الطباعة بنجاح', 'success');
            }, 1000);
        }, 500);
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

// Initialize printing page
document.addEventListener('DOMContentLoaded', () => {
    new PrintingPage();
});