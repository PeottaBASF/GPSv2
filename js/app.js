// Lógica Principal da Interface do Porteiro
// ==========================================

class TruckManagementApp {
    constructor() {
        this.form = null;
        this.recentCodes = [];
        this.currentQRCode = null;
        this.expiryTimer = null;

        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupForm();
            this.setupEventListeners();
            this.loadRecentCodes();
            this.populateSelectOptions();
            this.setupFormValidation();
        });
    }

    setupForm() {
        this.form = document.getElementById('truck-form');
        if (!this.form) {
            console.error('Formulário não encontrado');
            return;
        }
    }

    setupEventListeners() {
        // Submissão do formulário
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Botão de copiar link
        const copyBtn = document.getElementById('copy-link');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyQRLink());
        }

        // Botão de WhatsApp
        const whatsappBtn = document.getElementById('whatsapp-share');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => this.shareViaWhatsApp());
        }

        // Validação em tempo real
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        // Validação da placa
        const plateInput = document.getElementById('truck-plate');
        if (plateInput) {
            plateInput.addEventListener('input', debounce((e) => {
                this.validatePlate(e.target);
            }, 500));

            plateInput.addEventListener('blur', (e) => {
                this.validatePlate(e.target);
            });
        }

        // Validação do CPF/CNPJ
        const documentInput = document.getElementById('driver-document');
        if (documentInput) {
            documentInput.addEventListener('input', debounce((e) => {
                this.validateDocument(e.target);
            }, 500));
        }

        // Validação do nome do motorista
        const driverNameInput = document.getElementById('driver-name');
        if (driverNameInput) {
            driverNameInput.addEventListener('blur', (e) => {
                this.validateDriverName(e.target);
            });
        }
    }

    validatePlate(input) {
        const result = BrazilianValidator.validatePlate(input.value);

        if (input.value.trim() === '') {
            this.clearValidation(input);
        } else if (result.valid) {
            this.showValidation(input, true);
            input.value = result.formatted;
        } else {
            this.showValidation(input, false, result.message);
        }
    }

    validateDocument(input) {
        if (input.value.trim() === '') {
            this.clearValidation(input);
            return;
        }

        const result = BrazilianValidator.validateDocument(input.value);

        if (result.valid) {
            this.showValidation(input, true);
            if (result.formatted) {
                input.value = result.formatted;
            }
        } else {
            this.showValidation(input, false, result.message);
        }
    }

    validateDriverName(input) {
        const name = input.value.trim();

        if (name === '') {
            this.showValidation(input, false, 'Nome do motorista é obrigatório');
        } else if (name.length < 3) {
            this.showValidation(input, false, 'Nome deve ter pelo menos 3 caracteres');
        } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) {
            this.showValidation(input, false, 'Nome deve conter apenas letras');
        } else {
            this.showValidation(input, true);
        }
    }

    showValidation(input, isValid, message = '') {
        const feedbackElement = input.parentElement.querySelector('.invalid-feedback');

        // Remover classes anteriores
        input.classList.remove('is-valid', 'is-invalid');

        if (isValid) {
            input.classList.add('is-valid');
        } else {
            input.classList.add('is-invalid');
            if (feedbackElement && message) {
                feedbackElement.textContent = message;
            }
        }
    }

    clearValidation(input) {
        input.classList.remove('is-valid', 'is-invalid');
        const feedbackElement = input.parentElement.querySelector('.invalid-feedback');
        if (feedbackElement) {
            feedbackElement.textContent = '';
        }
    }

    populateSelectOptions() {
        // Popular portarias
        const entryGateSelect = document.getElementById('entry-gate');
        if (entryGateSelect) {
            const activePortarias = getActivePortarias();
            entryGateSelect.innerHTML = '<option value="" selected disabled>Selecione...</option>';

            activePortarias.forEach(portaria => {
                const option = document.createElement('option');
                option.value = portaria.id;
                option.textContent = `${portaria.nome} - ${portaria.descricao}`;
                entryGateSelect.appendChild(option);
            });
        }

        // Popular docas
        const destinationDockSelect = document.getElementById('destination-dock');
        if (destinationDockSelect) {
            const activeDocas = getActiveDocas();
            destinationDockSelect.innerHTML = '<option value="" selected disabled>Selecione...</option>';

            activeDocas.forEach(doca => {
                const option = document.createElement('option');
                option.value = doca.id;
                option.textContent = `${doca.nome} - ${doca.setor} (${doca.tipo})`;
                destinationDockSelect.appendChild(option);
            });
        }
    }

    setupFormValidation() {
        const requiredFields = ['truck-plate', 'driver-name', 'entry-gate', 'destination-dock'];

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', () => {
                    this.validateRequiredField(field);
                });
            }
        });
    }

    validateRequiredField(field) {
        if (field.value.trim() === '') {
            this.showValidation(field, false, 'Este campo é obrigatório');
        } else {
            // Validações específicas
            if (field.id === 'truck-plate') {
                this.validatePlate(field);
            } else if (field.id === 'driver-name') {
                this.validateDriverName(field);
            } else {
                this.showValidation(field, true);
            }
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        // Validar formulário completo
        if (!this.validateForm()) {
            notifications.error('Por favor, corrija os erros no formulário');
            return;
        }

        // Mostrar loading
        this.setLoadingState(true);

        try {
            // Coletar dados do formulário
            const formData = this.collectFormData();

            // Validar coordenadas
            const validation = this.validateCoordinates(formData);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            // Gerar QR Code
            await this.generateQRCode(formData);

            // Salvar nos códigos recentes
            this.saveRecentCode(formData);

            // Atualizar interface
            this.updateRecentCodesList();

            notifications.success('QR Code gerado com sucesso!');

        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            notifications.error('Erro ao gerar QR Code: ' + error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    validateForm() {
        const requiredFields = [
            'truck-plate',
            'driver-name', 
            'entry-gate',
            'destination-dock'
        ];

        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || field.value.trim() === '') {
                this.showValidation(field, false, 'Este campo é obrigatório');
                isValid = false;
            }
        });

        // Validações específicas
        const plateField = document.getElementById('truck-plate');
        if (plateField && plateField.value.trim()) {
            const plateResult = BrazilianValidator.validatePlate(plateField.value);
            if (!plateResult.valid) {
                this.showValidation(plateField, false, plateResult.message);
                isValid = false;
            }
        }

        const documentField = document.getElementById('driver-document');
        if (documentField && documentField.value.trim()) {
            const docResult = BrazilianValidator.validateDocument(documentField.value);
            if (!docResult.valid) {
                this.showValidation(documentField, false, docResult.message);
                isValid = false;
            }
        }

        return isValid;
    }

    collectFormData() {
        return {
            id: generateUniqueId(),
            truckPlate: document.getElementById('truck-plate').value.trim(),
            truckModel: document.getElementById('truck-model').value.trim(),
            companyName: document.getElementById('company-name').value.trim(),
            driverName: document.getElementById('driver-name').value.trim(),
            driverDocument: document.getElementById('driver-document').value.trim(),
            entryGateId: parseInt(document.getElementById('entry-gate').value),
            destinationDockId: parseInt(document.getElementById('destination-dock').value),
            expiryHours: parseInt(document.getElementById('expiry-time').value),
            expiryDate: Date.now() + (parseInt(document.getElementById('expiry-time').value) * 60 * 60 * 1000),
            createdAt: Date.now()
        };
    }

    validateCoordinates(formData) {
        const portaria = findPortariaById(formData.entryGateId);
        const doca = findDocaById(formData.destinationDockId);

        if (!portaria) {
            return { valid: false, message: 'Portaria selecionada não encontrada' };
        }

        if (!doca) {
            return { valid: false, message: 'Doca selecionada não encontrada' };
        }

        // Verificar se as coordenadas são válidas
        if (!validateCoordinates(portaria.coordenadas.latitude, portaria.coordenadas.longitude)) {
            return { valid: false, message: `Coordenadas da portaria ${portaria.nome} são inválidas` };
        }

        if (!validateCoordinates(doca.coordenadas.latitude, doca.coordenadas.longitude)) {
            return { valid: false, message: `Coordenadas da doca ${doca.nome} são inválidas` };
        }

        return { valid: true, portaria, doca };
    }

    async generateQRCode(formData) {
        // Codificar dados
        const encodedData = DataEncoder.encodeData(formData);

        // Gerar URL
        const routeUrl = `${SYSTEM_CONFIG.baseUrl}/rota.html?data=${encodedData}`;

        // Limpar QR Code anterior
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';

        // Gerar novo QR Code
        this.currentQRCode = new QRCode(qrContainer, {
            text: routeUrl,
            width: SYSTEM_CONFIG.qrCodeSize,
            height: SYSTEM_CONFIG.qrCodeSize,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        // Atualizar interface
        document.getElementById('qr-link').value = routeUrl;
        document.getElementById('expiry-message').textContent = 
            `${formData.expiryHours} hora${formData.expiryHours > 1 ? 's' : ''}`;

        // Mostrar container do QR Code
        const qrContainer2 = document.getElementById('qrcode-container');
        qrContainer2.style.display = 'block';
        qrContainer2.classList.add('fade-in');

        // Iniciar timer de expiração
        this.startExpiryTimer(formData.expiryDate);

        return routeUrl;
    }

    startExpiryTimer(expiryDate) {
        // Limpar timer anterior
        if (this.expiryTimer) {
            clearInterval(this.expiryTimer);
        }

        const expiryElement = document.getElementById('expiry-message');

        this.expiryTimer = setInterval(() => {
            const timeRemaining = expiryDate - Date.now();

            if (timeRemaining <= 0) {
                expiryElement.innerHTML = '<span class="text-danger">⚠️ Expirado</span>';
                clearInterval(this.expiryTimer);
            } else {
                const formatted = DataFormatter.formatTimeRemaining(timeRemaining);
                if (timeRemaining < 10 * 60 * 1000) { // Menos de 10 minutos
                    expiryElement.innerHTML = `<span class="countdown-danger">${formatted}</span>`;
                } else if (timeRemaining < 30 * 60 * 1000) { // Menos de 30 minutos
                    expiryElement.innerHTML = `<span class="countdown-warning">${formatted}</span>`;
                } else {
                    expiryElement.textContent = formatted;
                }
            }
        }, 1000);
    }

    async copyQRLink() {
        const linkInput = document.getElementById('qr-link');
        const success = await copyToClipboard(linkInput.value);

        if (success) {
            notifications.success('Link copiado para a área de transferência!');

            // Feedback visual
            const copyBtn = document.getElementById('copy-link');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copiado!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } else {
            notifications.error('Erro ao copiar link. Tente selecionar e copiar manualmente.');
            linkInput.select();
        }
    }

    shareViaWhatsApp() {
        const link = document.getElementById('qr-link').value;
        const truckPlate = document.getElementById('truck-plate').value;
        const driverName = document.getElementById('driver-name').value;

        const message = `${SYSTEM_CONFIG.whatsappMessage}\n\n` +
                       `🚛 Placa: ${truckPlate}\n` +
                       `👤 Motorista: ${driverName}\n\n` +
                       `${link}`;

        const whatsappUrl = generateWhatsAppLink(message);
        window.open(whatsappUrl, '_blank');
    }

    saveRecentCode(formData) {
        // Carregar códigos existentes
        this.recentCodes = storage.load('recent_codes') || [];

        // Adicionar novo código
        const codeEntry = {
            ...formData,
            url: document.getElementById('qr-link').value,
            portaria: findPortariaById(formData.entryGateId),
            doca: findDocaById(formData.destinationDockId)
        };

        this.recentCodes.unshift(codeEntry);

        // Manter apenas os últimos códigos
        this.recentCodes = this.recentCodes.slice(0, SYSTEM_CONFIG.maxRecentCodes);

        // Salvar
        storage.save('recent_codes', this.recentCodes);
    }

    loadRecentCodes() {
        this.recentCodes = storage.load('recent_codes') || [];
        this.updateRecentCodesList();
    }

    updateRecentCodesList() {
        const tbody = document.getElementById('recent-codes-list');
        if (!tbody) return;

        if (this.recentCodes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        Nenhum QR Code gerado ainda
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.recentCodes.map(code => {
            const isExpired = code.expiryDate < Date.now();
            const timeRemaining = code.expiryDate - Date.now();
            const statusClass = isExpired ? 'text-danger' : 
                               timeRemaining < 30 * 60 * 1000 ? 'text-warning' : 'text-success';

            return `
                <tr class="${isExpired ? 'table-secondary' : ''}">
                    <td><strong>${code.truckPlate}</strong></td>
                    <td>${code.driverName}</td>
                    <td>${code.doca ? code.doca.nome : 'N/A'}</td>
                    <td>
                        <small class="${statusClass}">
                            ${isExpired ? '⚠️ Expirado' : 
                              '⏰ ' + DataFormatter.formatTimeRemaining(timeRemaining)}
                        </small>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="app.shareCode('${code.id}')" 
                                    ${isExpired ? 'disabled' : ''}>
                                📱
                            </button>
                            <button class="btn btn-outline-secondary" onclick="app.copyCodeLink('${code.id}')">
                                📋
                            </button>
                            <button class="btn btn-outline-danger" onclick="app.removeCode('${code.id}')">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    shareCode(codeId) {
        const code = this.recentCodes.find(c => c.id === codeId);
        if (!code) return;

        const message = `${SYSTEM_CONFIG.whatsappMessage}\n\n` +
                       `🚛 Placa: ${code.truckPlate}\n` +
                       `👤 Motorista: ${code.driverName}\n\n` +
                       `${code.url}`;

        const whatsappUrl = generateWhatsAppLink(message);
        window.open(whatsappUrl, '_blank');
    }

    async copyCodeLink(codeId) {
        const code = this.recentCodes.find(c => c.id === codeId);
        if (!code) return;

        const success = await copyToClipboard(code.url);
        if (success) {
            notifications.success('Link copiado!');
        } else {
            notifications.error('Erro ao copiar link');
        }
    }

    removeCode(codeId) {
        if (confirm('Deseja remover este QR Code do histórico?')) {
            this.recentCodes = this.recentCodes.filter(c => c.id !== codeId);
            storage.save('recent_codes', this.recentCodes);
            this.updateRecentCodesList();
            notifications.info('QR Code removido do histórico');
        }
    }

    setLoadingState(loading) {
        const submitBtn = document.getElementById('generate-btn');
        const spinner = document.getElementById('loading-spinner');

        if (loading) {
            submitBtn.disabled = true;
            spinner.classList.remove('d-none');
            submitBtn.textContent = ' Gerando...';
        } else {
            submitBtn.disabled = false;
            spinner.classList.add('d-none');
            submitBtn.textContent = 'Gerar QR Code';
        }
    }
}

// Inicializar aplicação
const app = new TruckManagementApp();

// Tornar disponível globalmente para callbacks HTML
window.app = app;