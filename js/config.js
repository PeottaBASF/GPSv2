// Configuração do Sistema de Gerenciamento de Rotas para Caminhoneiros
// =====================================================================

// Configuração do Azure Maps
const AZURE_MAPS_CONFIG = {
    // IMPORTANTE: Substitua pela sua chave do Azure Maps
    // Obtenha em: https://portal.azure.com (Azure Maps Account > Authentication)
    subscriptionKey: '8sBYyJ4uUjjLFYAlrOPHrkPOe5lFZmrDgrFLn8tBJldpqaSZIfN9JQQJ99BFAC8vTIn91W9IAAAgAZMP3jBK',

    // Configurações de localização
    language: 'pt-BR',
    view: 'Unified',

    // Centro inicial do mapa (coordenadas da sua empresa)
    // EXEMPLO: Coordenadas do centro de São Paulo
    center: [-46.633308, -23.550520], // [longitude, latitude]
    zoom: 15,

    // Configurações de estilo do mapa
    style: 'road',

    // URLs da API
    routeServiceUrl: 'https://atlas.microsoft.com/route/directions/json',
    searchServiceUrl: 'https://atlas.microsoft.com/search/address/json'
};

// Configuração geral do sistema
const SYSTEM_CONFIG = {
    // Nome da empresa (será exibido no sistema)
    companyName: "BASF",

    // URL base onde o sistema está hospedado
    // IMPORTANTE: Atualize com a URL real após hospedagem
    baseUrl: "https://peottabasf.github.io/GPSv2",

    // Configurações de QR Code
    qrCodeSize: 256,
    qrCodeMargin: 4,

    // Configurações de expiração
    defaultExpiryHours: 1,
    maxExpiryHours: 24,

    // Configurações de WhatsApp
    whatsappMessage: "🚛 Acesse sua rota de navegação: ",

    // Configurações de localStorage
    localStoragePrefix: "rotas_caminhoneiros_",
    maxRecentCodes: 50,

    // Configurações de validação
    validation: {
        maxAttempts: 3,
        timeoutSeconds: 30
    }
};

// Configuração das Portarias
// IMPORTANTE: Substitua pelas coordenadas reais da sua empresa
const PORTARIAS = [
    {
        id: 1,
        nome: "Portaria Principal",
        descricao: "Entrada principal - Recepção de caminhões",
        coordenadas: {
            // EXEMPLO: Coordenadas próximas ao centro de SP
            latitude: -23.550520,  // Substitua pela latitude real
            longitude: -46.633308  // Substitua pela longitude real
        },
        ativa: true,
        horarioFuncionamento: "24h"
    },
    {
        id: 2,
        nome: "Portaria Secundária",
        descricao: "Entrada lateral - Veículos pequenos",
        coordenadas: {
            latitude: -23.550720,  // Substitua pela latitude real
            longitude: -46.633508  // Substitua pela longitude real
        },
        ativa: true,
        horarioFuncionamento: "06:00-18:00"
    }
    // Adicione mais portarias conforme necessário
];

// Configuração das Docas
// IMPORTANTE: Substitua pelas coordenadas reais da sua empresa
const DOCAS = [
    {
        id: 1,
        nome: "Doca A",
        setor: "Recebimento",
        descricao: "Doca para descarga de materiais pesados",
        coordenadas: {
            latitude: -23.558740,  // Substitua pela latitude real
            longitude: -46.610429  // Substitua pela longitude real
        },
        ativa: true,
        tipo: "descarga",
        capacidade: "Caminhões grandes"
    },
    {
        id: 2,
        nome: "Doca B",
        setor: "Expedição",
        descricao: "Doca para carregamento de produtos acabados",
        coordenadas: {
            latitude: -23.551120,  // Substitua pela latitude real
            longitude: -46.632908  // Substitua pela longitude real
        },
        ativa: true,
        tipo: "carregamento",
        capacidade: "Caminhões médios"
    },
    {
        id: 3,
        nome: "Doca C",
        setor: "Recebimento",
        descricao: "Doca para materiais frágeis e sensíveis",
        coordenadas: {
            latitude: -23.551320,  // Substitua pela latitude real
            longitude: -46.632708  // Substitua pela longitude real
        },
        ativa: true,
        tipo: "descarga",
        capacidade: "Todos os tipos"
    }
    // Adicione mais docas conforme necessário
];

// Função de validação das configurações
function validateConfig() {
    const errors = [];
    const warnings = [];

    // Validar Azure Maps
    if (!AZURE_MAPS_CONFIG.subscriptionKey || 
        AZURE_MAPS_CONFIG.subscriptionKey === 'SUA_CHAVE_AZURE_MAPS_AQUI') {
        errors.push('❌ Chave do Azure Maps não configurada');
    } else if (AZURE_MAPS_CONFIG.subscriptionKey.length < 30) {
        warnings.push('⚠️ Chave do Azure Maps parece muito curta');
    }

    // Validar URL base
    if (!SYSTEM_CONFIG.baseUrl || SYSTEM_CONFIG.baseUrl.includes('seuusuario')) {
        warnings.push('⚠️ URL base não configurada adequadamente');
    }

    // Validar portarias
    if (PORTARIAS.length === 0) {
        errors.push('❌ Nenhuma portaria configurada');
    }

    PORTARIAS.forEach((portaria, index) => {
        if (!portaria.coordenadas || 
            portaria.coordenadas.latitude === null || 
            portaria.coordenadas.longitude === null ||
            typeof portaria.coordenadas.latitude !== 'number' ||
            typeof portaria.coordenadas.longitude !== 'number') {
            errors.push(`❌ Portaria ${index + 1} (${portaria.nome}) com coordenadas inválidas`);
        } else {
            // Validar range de coordenadas
            const lat = portaria.coordenadas.latitude;
            const lng = portaria.coordenadas.longitude;
            if (lat < -90 || lat > 90) {
                errors.push(`❌ Latitude da portaria ${portaria.nome} fora do range válido (-90 a 90)`);
            }
            if (lng < -180 || lng > 180) {
                errors.push(`❌ Longitude da portaria ${portaria.nome} fora do range válido (-180 a 180)`);
            }
        }
    });

    // Validar docas
    if (DOCAS.length === 0) {
        errors.push('❌ Nenhuma doca configurada');
    }

    DOCAS.forEach((doca, index) => {
        if (!doca.coordenadas || 
            doca.coordenadas.latitude === null || 
            doca.coordenadas.longitude === null ||
            typeof doca.coordenadas.latitude !== 'number' ||
            typeof doca.coordenadas.longitude !== 'number') {
            errors.push(`❌ Doca ${index + 1} (${doca.nome}) com coordenadas inválidas`);
        } else {
            // Validar range de coordenadas
            const lat = doca.coordenadas.latitude;
            const lng = doca.coordenadas.longitude;
            if (lat < -90 || lat > 90) {
                errors.push(`❌ Latitude da doca ${doca.nome} fora do range válido (-90 a 90)`);
            }
            if (lng < -180 || lng > 180) {
                errors.push(`❌ Longitude da doca ${doca.nome} fora do range válido (-180 a 180)`);
            }
        }
    });

    return { errors, warnings };
}

// Função para obter portarias ativas
function getActivePortarias() {
    return PORTARIAS.filter(portaria => portaria.ativa !== false);
}

// Função para obter docas ativas
function getActiveDocas() {
    return DOCAS.filter(doca => doca.ativa !== false);
}

// Função para encontrar portaria por ID
function findPortariaById(id) {
    return PORTARIAS.find(portaria => portaria.id === parseInt(id));
}

// Função para encontrar doca por ID
function findDocaById(id) {
    return DOCAS.find(doca => doca.id === parseInt(id));
}

// Função para validar coordenadas específicas
function validateCoordinates(lat, lng) {
    return typeof lat === 'number' && 
           typeof lng === 'number' && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180 &&
           !isNaN(lat) && !isNaN(lng);
}

// Função de auto-teste do sistema
function runSystemCheck() {
    const result = validateConfig();
    const librariesCheck = checkRequiredLibraries();

    return {
        configValid: result.errors.length === 0,
        configErrors: result.errors,
        configWarnings: result.warnings,
        librariesLoaded: librariesCheck.allLoaded,
        missingLibraries: librariesCheck.missing,
        azureMapsReady: typeof atlas !== 'undefined',
        qrCodeReady: typeof QRCode !== 'undefined',
        bootstrapReady: typeof bootstrap !== 'undefined'
    };
}

// Verificar bibliotecas necessárias
function checkRequiredLibraries() {
    const required = {
        'QRCode': typeof QRCode !== 'undefined',
        'Azure Maps': typeof atlas !== 'undefined', 
        'Bootstrap': typeof bootstrap !== 'undefined'
    };

    const missing = Object.keys(required).filter(lib => !required[lib]);

    return {
        allLoaded: missing.length === 0,
        missing: missing,
        details: required
    };
}

// Executar validação ao carregar
document.addEventListener('DOMContentLoaded', () => {
    const systemCheck = runSystemCheck();

    if (!systemCheck.configValid) {
        console.error('🚨 PROBLEMAS DE CONFIGURAÇÃO ENCONTRADOS:');
        systemCheck.configErrors.forEach(error => console.error(error));
    }

    if (systemCheck.configWarnings.length > 0) {
        console.warn('⚠️ AVISOS DE CONFIGURAÇÃO:');
        systemCheck.configWarnings.forEach(warning => console.warn(warning));
    }

    if (!systemCheck.librariesLoaded) {
        console.error('📚 BIBLIOTECAS AUSENTES:', systemCheck.missingLibraries);
    }

    // Atualizar status na interface se existir
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        if (systemCheck.configValid && systemCheck.librariesLoaded) {
            statusElement.innerHTML = '✅ Sistema configurado e funcionando';
            statusElement.parentElement.className = 'alert alert-success alert-dismissible fade show';
        } else {
            statusElement.innerHTML = '⚠️ Configuração incompleta - verifique o console';
            statusElement.parentElement.className = 'alert alert-warning alert-dismissible fade show';
        }
    }
});

// Exportar configurações (se usando módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AZURE_MAPS_CONFIG,
        SYSTEM_CONFIG,
        PORTARIAS,
        DOCAS,
        validateConfig,
        getActivePortarias,
        getActiveDocas,
        findPortariaById,
        findDocaById,
        validateCoordinates,
        runSystemCheck
    };
}
