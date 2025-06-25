// Funções Utilitárias do Sistema de Gerenciamento de Rotas
// =======================================================

// Classe para validações brasileiras
class BrazilianValidator {

    // Validar placa de veículo (formato antigo e Mercosul)
    static validatePlate(plate) {
        if (!plate) return { valid: false, message: 'Placa é obrigatória' };

        // Remover espaços e converter para maiúsculo
        const cleanPlate = plate.replace(/\s/g, '').toUpperCase();

        // Formato antigo: ABC1234
        const oldFormat = /^[A-Z]{3}[0-9]{4}$/;
        // Formato Mercosul: ABC1D23
        const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

        if (oldFormat.test(cleanPlate) || mercosulFormat.test(cleanPlate)) {
            return { valid: true, formatted: cleanPlate };
        }

        return { 
            valid: false, 
            message: 'Formato inválido. Use ABC1234 ou ABC1D23' 
        };
    }

    // Validar CPF
    static validateCPF(cpf) {
        if (!cpf) return { valid: true }; // CPF é opcional

        // Remover caracteres especiais
        const cleanCPF = cpf.replace(/[^\d]/g, '');

        if (cleanCPF.length !== 11) {
            return { valid: false, message: 'CPF deve ter 11 dígitos' };
        }

        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cleanCPF)) {
            return { valid: false, message: 'CPF inválido' };
        }

        // Validar dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
        }

        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(9))) {
            return { valid: false, message: 'CPF inválido' };
        }

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(10))) {
            return { valid: false, message: 'CPF inválido' };
        }

        return { 
            valid: true, 
            formatted: cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') 
        };
    }

    // Validar CNPJ
    static validateCNPJ(cnpj) {
        if (!cnpj) return { valid: true }; // CNPJ é opcional

        // Remover caracteres especiais
        const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

        if (cleanCNPJ.length !== 14) {
            return { valid: false, message: 'CNPJ deve ter 14 dígitos' };
        }

        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
            return { valid: false, message: 'CNPJ inválido' };
        }

        // Validar primeiro dígito verificador
        let sum = 0;
        let weight = 2;
        for (let i = 11; i >= 0; i--) {
            sum += parseInt(cleanCNPJ.charAt(i)) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }

        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;

        if (digit1 !== parseInt(cleanCNPJ.charAt(12))) {
            return { valid: false, message: 'CNPJ inválido' };
        }

        // Validar segundo dígito verificador
        sum = 0;
        weight = 2;
        for (let i = 12; i >= 0; i--) {
            sum += parseInt(cleanCNPJ.charAt(i)) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }

        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;

        if (digit2 !== parseInt(cleanCNPJ.charAt(13))) {
            return { valid: false, message: 'CNPJ inválido' };
        }

        return { 
            valid: true, 
            formatted: cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') 
        };
    }

    // Detectar tipo de documento e validar
    static validateDocument(document) {
        if (!document) return { valid: true };

        const cleanDoc = document.replace(/[^\d]/g, '');

        if (cleanDoc.length === 11) {
            return this.validateCPF(document);
        } else if (cleanDoc.length === 14) {
            return this.validateCNPJ(document);
        } else {
            return { 
                valid: false, 
                message: 'Digite um CPF (11 dígitos) ou CNPJ (14 dígitos)' 
            };
        }
    }
}

// Classe para formatação de dados
class DataFormatter {

    // Formatar data para exibição
    static formatDate(date, includeTime = true) {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'America/Sao_Paulo'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
        }

        return new Intl.DateTimeFormat('pt-BR', options).format(date);
    }

    // Formatar tempo restante
    static formatTimeRemaining(milliseconds) {
        if (milliseconds <= 0) return 'Expirado';

        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Formatar distância
    static formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    }

    // Formatar tempo de viagem
    static formatTravelTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        } else {
            return `${minutes}min`;
        }
    }
}

// Classe para codificação/decodificação de dados
class DataEncoder {

    // Codificar dados para URL
    static encodeData(data) {
        try {
            const jsonString = JSON.stringify(data);
            return btoa(unescape(encodeURIComponent(jsonString)));
        } catch (error) {
            console.error('Erro ao codificar dados:', error);
            throw new Error('Erro na codificação dos dados');
        }
    }

    // Decodificar dados da URL
    static decodeData(encodedData) {
        try {
            const jsonString = decodeURIComponent(escape(atob(encodedData)));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Erro ao decodificar dados:', error);
            throw new Error('Dados corrompidos ou formato inválido');
        }
    }

    // Validar dados decodificados
    static validateDecodedData(data) {
        const required = ['id', 'truckPlate', 'driverName', 'entryGateId', 'destinationDockId', 'expiryDate'];

        for (const field of required) {
            if (!data.hasOwnProperty(field) || data[field] === null || data[field] === undefined) {
                return { valid: false, message: `Campo obrigatório ausente: ${field}` };
            }
        }

        // Verificar se os dados estão expirados
        if (data.expiryDate < Date.now()) {
            return { valid: false, message: 'Link expirado', expired: true };
        }

        // Verificar se portaria e doca existem
        const portaria = findPortariaById(data.entryGateId);
        const doca = findDocaById(data.destinationDockId);

        if (!portaria) {
            return { valid: false, message: 'Portaria não encontrada' };
        }

        if (!doca) {
            return { valid: false, message: 'Doca não encontrada' };
        }

        return { valid: true, portaria, doca };
    }
}

// Classe para localStorage
class LocalStorageManager {

    constructor(prefix = SYSTEM_CONFIG.localStoragePrefix) {
        this.prefix = prefix;
    }

    // Salvar dados
    save(key, data) {
        try {
            const fullKey = this.prefix + key;
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            return false;
        }
    }

    // Carregar dados
    load(key) {
        try {
            const fullKey = this.prefix + key;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            return null;
        }
    }

    // Remover dados
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
            return false;
        }
    }

    // Listar todas as chaves
    listKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.replace(this.prefix, ''));
            }
        }
        return keys;
    }

    // Limpar todos os dados do sistema
    clear() {
        const keys = this.listKeys();
        keys.forEach(key => this.remove(key));
    }
}

// Classe para notificações
class NotificationManager {

    static show(message, type = 'info', duration = 5000) {
        // Verificar se existe container de toast
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }

        // Criar toast
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast show" role="alert">
                <div class="toast-header bg-${type} text-white">
                    <strong class="me-auto">${this.getTypeIcon(type)} ${this.getTypeTitle(type)}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        // Auto-remover após duração especificada
        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.remove();
            }
        }, duration);
    }

    static getTypeIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    static getTypeTitle(type) {
        const titles = {
            success: 'Sucesso',
            error: 'Erro',
            warning: 'Aviso',
            info: 'Informação'
        };
        return titles[type] || 'Informação';
    }

    static success(message, duration) {
        this.show(message, 'success', duration);
    }

    static error(message, duration) {
        this.show(message, 'error', duration);
    }

    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    static info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// Função para gerar ID único
function generateUniqueId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Função para copiar texto para clipboard
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        }
    } catch (error) {
        console.error('Erro ao copiar para clipboard:', error);
        return false;
    }
}

// Função para gerar link do WhatsApp
function generateWhatsAppLink(message, phoneNumber = '') {
    const baseUrl = 'https://wa.me/';
    const encodedMessage = encodeURIComponent(message);

    if (phoneNumber) {
        return `${baseUrl}${phoneNumber}?text=${encodedMessage}`;
    } else {
        return `${baseUrl}?text=${encodedMessage}`;
    }
}

// Função para detectar dispositivo móvel
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Função para obter posição atual do usuário
function getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalização não suportada'));
            return;
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        };

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { ...defaultOptions, ...options }
        );
    });
}

// Função para calcular distância entre dois pontos (em metros)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// Função para debounce (evitar múltiplas execuções)
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Função para throttle (limitar execuções)
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Instâncias globais
const storage = new LocalStorageManager();
const notifications = NotificationManager;

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BrazilianValidator = BrazilianValidator;
    window.DataFormatter = DataFormatter;
    window.DataEncoder = DataEncoder;
    window.LocalStorageManager = LocalStorageManager;
    window.NotificationManager = NotificationManager;
    window.storage = storage;
    window.notifications = notifications;

    // Funções utilitárias globais
    window.generateUniqueId = generateUniqueId;
    window.copyToClipboard = copyToClipboard;
    window.generateWhatsAppLink = generateWhatsAppLink;
    window.isMobileDevice = isMobileDevice;
    window.getCurrentPosition = getCurrentPosition;
    window.calculateDistance = calculateDistance;
    window.debounce = debounce;
    window.throttle = throttle;
}