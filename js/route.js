// Lógica de Navegação e Mapa para Caminhoneiros
// ===============================================

class RouteNavigationApp {
    constructor() {
        this.map = null;
        this.routeData = null;
        this.currentRoute = null;
        this.markers = [];
        this.datasource = null;
        this.routeLayer = null;
        this.countdownTimer = null;
        this.geolocationWatch = null;
        this.userPosition = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.parseRouteData();
        });
    }

    parseRouteData() {
        try {
            // Obter dados da URL
            const urlParams = new URLSearchParams(window.location.search);
            const encodedData = urlParams.get('data');
            
            if (!encodedData) {
                this.showError('Link inválido', 'Nenhum dado encontrado na URL');
                return;
            }

            // Decodificar dados
            const decodedData = DataEncoder.decodeData(encodedData);
            
            // Validar dados
            const validation = DataEncoder.validateDecodedData(decodedData);
            if (!validation.valid) {
                if (validation.expired) {
                    this.showError('Link Expirado', 'Este QR Code já expirou. Solicite um novo QR Code no porteiro.');
                } else {
                    this.showError('Dados Inválidos', validation.message);
                }
                return;
            }

            this.routeData = decodedData;
            this.portaria = validation.portaria;
            this.doca = validation.doca;

            // Inicializar interface
            this.initializeInterface();
        } catch (error) {
            console.error('Erro ao processar dados da rota:', error);
            this.showError('Erro de Processamento', 'Não foi possível processar os dados da rota. Verifique o QR Code.');
        }
    }

    initializeInterface() {
        // Atualizar informações do cabeçalho
        this.updateHeaderInfo();
        
        // Inicializar mapa
        this.initializeMap();
        
        // Iniciar contador regressivo
        this.startCountdown();
        
        // Solicitar localização do usuário
        this.requestUserLocation();
        
        // Configurar eventos
        this.setupEventListeners();
    }

    updateHeaderInfo() {
        // Atualizar dados do caminhão
        document.getElementById('truck-plate-display').textContent = this.routeData.truckPlate;
        document.getElementById('driver-name-display').textContent = this.routeData.driverName;
        document.getElementById('dock-name-display').textContent = this.doca.nome;
    }

    initializeMap() {
        this.updateLoadingMessage('Inicializando mapa...');
        try {
            // Verificar se Azure Maps está disponível
            if (typeof atlas === 'undefined') {
                throw new Error('Azure Maps SDK não carregado');
            }
            
            // Verificar chave da API
            if (!AZURE_MAPS_CONFIG.subscriptionKey || AZURE_MAPS_CONFIG.subscriptionKey === 'SUA_CHAVE_AZURE_MAPS_AQUI') {
                throw new Error('Chave do Azure Maps não configurada');
            }
            
            // Calcular centro do mapa (ponto médio entre portaria e doca)
            const centerLat = (this.portaria.coordenadas.latitude + this.doca.coordenadas.latitude) / 2;
            const centerLng = (this.portaria.coordenadas.longitude + this.doca.coordenadas.longitude) / 2;
            
            // Inicializar mapa
            this.map = new atlas.Map('route-map', {
                center: [centerLng, centerLat],
                zoom: 16,
                language: AZURE_MAPS_CONFIG.language,
                view: AZURE_MAPS_CONFIG.view,
                style: AZURE_MAPS_CONFIG.style,
                authOptions: {
                    authType: 'subscriptionKey',
                    subscriptionKey: AZURE_MAPS_CONFIG.subscriptionKey
                }
            });
            
            // Aguardar carregamento do mapa
            this.map.events.add('ready', () => {
                this.onMapReady();
            });
            
            // Tratar erros do mapa
            this.map.events.add('error', (error) => {
                console.error('Erro no mapa:', error);
                this.showError('Erro no Mapa', 'Falha ao carregar o mapa. Verifique sua conexão.');
            });
            
        } catch (error) {
            console.error('Erro ao inicializar mapa:', error);
            this.showError('Erro de Inicialização', error.message);
        }
    }

    onMapReady() {
        this.updateLoadingMessage('Configurando camadas do mapa...');
        try {
            // Criar fonte de dados
            this.datasource = new atlas.source.DataSource();
            this.map.sources.add(this.datasource);
            
            // Adicionar camada de linha para a rota
            this.routeLayer = new atlas.layer.LineLayer(this.datasource, null, {
                strokeColor: '#0078d4',
                strokeWidth: 6,
                strokeOpacity: 0.8
            });
            this.map.layers.add(this.routeLayer);
            
            // Adicionar camada de símbolos para marcadores
            const symbolLayer = new atlas.layer.SymbolLayer(this.datasource, null, {
                iconOptions: {
                    allowOverlap: true,
                    ignorePlacement: true
                },
                textOptions: {
                    textField: ['get', 'title'],
                    offset: [0, -2],
                    color: '#000000',
                    haloColor: '#ffffff',
                    haloWidth: 2
                }
            });
            this.map.layers.add(symbolLayer);
            
            // Adicionar marcadores
            this.addMarkers();
            
            // Calcular rota
            this.calculateRoute();
            
        } catch (error) {
            console.error('Erro ao configurar mapa:', error);
            this.showError('Erro de Configuração', 'Falha ao configurar o mapa');
        }
    }

    addMarkers() {
        // Marcador da portaria (início)
        const startMarker = new atlas.data.Feature(
            new atlas.data.Point([this.portaria.coordenadas.longitude, this.portaria.coordenadas.latitude]), 
            {
                title: '🚪 ' + this.portaria.nome,
                type: 'start'
            }
        );
        
        // Marcador da doca (destino)
        const endMarker = new atlas.data.Feature(
            new atlas.data.Point([this.doca.coordenadas.longitude, this.doca.coordenadas.latitude]), 
            {
                title: '🎯 ' + this.doca.nome,
                type: 'end'
            }
        );
        
        this.datasource.add([startMarker, endMarker]);
        this.markers = [startMarker, endMarker];
    }

    async calculateRoute() {
        this.updateLoadingMessage('Calculando melhor rota...');
        try {
            // VALIDAÇÃO CRÍTICA (adicionada)
            if (!this.portaria.coordenadas || !this.doca.coordenadas) {
                throw new Error("Coordenadas indefinidas em config.js");
            }
            
            const startCoords = [this.portaria.coordenadas.longitude, this.portaria.coordenadas.latitude];
            const endCoords = [this.doca.coordenadas.longitude, this.doca.coordenadas.latitude];
            
            // Formatar coordenadas para o padrão Azure Maps: lon,lat:lon,lat
            const queryParam = `${startCoords[0]},${startCoords[1]}:${endCoords[0]},${endCoords[1]}`;
            
            // CORREÇÃO: Usar método GET com parâmetro query na URL
            const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0` +
                        `&subscription-key=${AZURE_MAPS_CONFIG.subscriptionKey}` +
                        `&query=${encodeURIComponent(queryParam)}` + // Parâmetro OBRIGATÓRIO
                        `&travelMode=truck` +
                        `&routeType=fastest`;
            
            const response = await fetch(url); // AGORA É GET
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Azure Maps: ${errorData.error.message}`);
            }
            
            const routeResponse = await response.json();
            if (!routeResponse.routes || routeResponse.routes.length === 0) {
                throw new Error('Nenhuma rota encontrada');
            }
            
            // Processar rota
            this.processRoute(routeResponse.routes[0]);
            
        } catch (error) {
            console.error('Erro ao calcular rota:', error);
            
            // Fallback: linha direta
            this.createDirectRoute();
            
            notifications.warning('Usando rota direta. Verifique sua conexão para rota otimizada.');
        }
    }
    
    processRoute(route) {
        this.currentRoute = route;
        
        // Adicionar linha da rota ao mapa
        const routeLine = new atlas.data.LineString(route.legs[0].points);
        this.datasource.add(new atlas.data.Feature(routeLine));
        
        // Ajustar visualização do mapa
        const bounds = atlas.data.BoundingBox.fromData(routeLine);
        this.map.setCamera({
            bounds: bounds,
            padding: 50
        });
        
        // Atualizar informações da rota
        this.updateRouteInfo(route);
        
        // Gerar instruções
        this.generateInstructions(route);
        
        // Ocultar tela de loading
        this.hideLoadingScreen();
    }
    
    createDirectRoute() {
        // Criar rota direta como fallback
        const startCoords = [this.portaria.coordenadas.longitude, this.portaria.coordenadas.latitude];
        const endCoords = [this.doca.coordenadas.longitude, this.doca.coordenadas.latitude];
        
        const directLine = new atlas.data.LineString([startCoords, endCoords]);
        this.datasource.add(new atlas.data.Feature(directLine));
        
        // Calcular distância direta
        const distance = calculateDistance(
            this.portaria.coordenadas.latitude, 
            this.portaria.coordenadas.longitude,
            this.doca.coordenadas.latitude, 
            this.doca.coordenadas.longitude
        );
        
        // Estimar tempo (velocidade média de 20 km/h dentro da empresa)
        const timeInSeconds = (distance / 1000) * 3.6 * 20;
        
        // Atualizar informações
        document.getElementById('total-distance').textContent = DataFormatter.formatDistance(distance);
        document.getElementById('total-time').textContent = DataFormatter.formatTravelTime(timeInSeconds);
        
        // Ajustar visualização
        const bounds = atlas.data.BoundingBox.fromData(directLine);
        this.map.setCamera({
            bounds: bounds,
            padding: 50
        });
        
        // Instruções simples
        document.getElementById('step-by-step').innerHTML = `
            <div class="navigation-step current">
                <div class="step-icon">🚪</div>
                <div class="step-content">
                    <h5>Partir da ${this.portaria.nome}</h5>
                    <p>Siga em frente em direção à ${this.doca.nome}</p>
                </div>
            </div>
            <div class="navigation-step">
                <div class="step-icon">🎯</div>
                <div class="step-content">
                    <h5>Chegar na ${this.doca.nome}</h5>
                    <p>Você chegou ao seu destino</p>
                </div>
            </div>
        `;
        
        this.hideLoadingScreen();
    }
    
    updateRouteInfo(route) {
        const leg = route.legs[0];
        document.getElementById('total-distance').textContent = DataFormatter.formatDistance(leg.summary.lengthInMeters);
        document.getElementById('total-time').textContent = DataFormatter.formatTravelTime(leg.summary.travelTimeInSeconds);
    }
    
    generateInstructions(route) {
        const instructions = document.getElementById('step-by-step');
        let instructionsHTML = '';
        
        if (route.guidance && route.guidance.instructions) {
            route.guidance.instructions.forEach((instruction, index) => {
                const icon = this.getInstructionIcon(instruction.maneuver);
                instructionsHTML += `
                    <div class="navigation-step ${index === 0 ? 'current' : ''}">
                        <div class="step-icon">${icon}</div>
                        <div class="step-content">
                            <h5>${instruction.message}</h5>
                            <p>Distância: ${DataFormatter.formatDistance(instruction.routeOffsetInMeters)}</p>
                        </div>
                    </div>
                `;
            });
        } else {
            // Instruções simples se não houver dados detalhados
            instructionsHTML = `
                <div class="navigation-step current">
                    <div class="step-icon">🚪</div>
                    <div class="step-content">
                        <h5>Partir da ${this.portaria.nome}</h5>
                        <p>Siga em frente em direção à ${this.doca.nome}</p>
                    </div>
                </div>
                <div class="navigation-step">
                    <div class="step-icon">🎯</div>
                    <div class="step-content">
                        <h5>Chegar na ${this.doca.nome}</h5>
                        <p>Você chegou ao seu destino</p>
                    </div>
                </div>
            `;
        }
        
        instructions.innerHTML = instructionsHTML;
    }
    
    getInstructionIcon(maneuver) {
        const icons = {
            '... STRAIGHT': '⬆️',
            'BEAR_LEFT': '↖️',
            'BEAR_RIGHT': '↗️',
            'TURN_LEFT': '⬅️',
            'TURN_RIGHT': '➡️',
            'SHARP_LEFT': '↩️',
            'SHARP_RIGHT': '↪️',
            'CONTINUE': '⬆️',
            'ARRIVE': '🏁',
            'DEPART': '🚀'
        };
        
        return icons[maneuver] || '📍';
    }
    
    startCountdown() {
        const countdownElement = document.getElementById('expiry-countdown');
        this.countdownTimer = setInterval(() => {
            const timeRemaining = this.routeData.expiryDate - Date.now();
            
            if (timeRemaining <= 0) {
                countdownElement.innerHTML = '⚠️ EXPIRADO';
                clearInterval(this.countdownTimer);
                this.handleExpiredLink();
            } else {
                const formatted = DataFormatter.formatTimeRemaining(timeRemaining);
                
                if (timeRemaining < 5 * 60 * 1000) { // Menos de 5 minutos
                    countdownElement.innerHTML = `⚠️ ${formatted}`;
                } else if (timeRemaining < 15 * 60 * 1000) { // Menos de 15 minutos
                    countdownElement.innerHTML = `⏰ ${formatted}`;
                } else {
                    countdownElement.innerHTML = `⏰ ${formatted}`;
                }
            }
        }, 1000);
    }
    
    handleExpiredLink() {
        notifications.error('Link expirado! Solicite um novo QR Code.', 0);
        
        // Desabilitar funcionalidades
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.id !== 'toggle-instructions') {
                btn.disabled = true;
            }
        });
    }
    
    async requestUserLocation() {
        try {
            const position = await getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
            
            this.userPosition = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            // Adicionar marcador da posição do usuário
            this.addUserLocationMarker();
            
            // Iniciar acompanhamento da localização
            this.startLocationTracking();
            
        } catch (error) {
            console.warn('Erro ao obter localização:', error);
            notifications.info('Não foi possível obter sua localização. A navegação ainda funcionará.');
        }
    }
    
    addUserLocationMarker() {
        if (!this.userPosition || !this.datasource) return;
        
        const userMarker = new atlas.data.Feature(
            new atlas.data.Point([this.userPosition.longitude, this.userPosition.latitude]), 
            {
                title: '📍 Sua localização',
                type: 'user'
            }
        );
        
        this.datasource.add(userMarker);
    }
    
    startLocationTracking() {
        if (!navigator.geolocation) return;
        
        this.geolocationWatch = navigator.geolocation.watchPosition(
            (position) => {
                this.updateUserPosition(position);
            },
            (error) => {
                console.warn('Erro no acompanhamento de localização:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 10000
            }
        );
    }
    
    updateUserPosition(position) {
        this.userPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
        
        // Atualizar marcador no mapa (implementação simplificada)
        // Em uma implementação completa, você atualizaria o marcador existente
    }
    
    setupEventListeners() {
        // Toggle do painel de instruções
        const toggleBtn = document.getElementById('toggle-instructions');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleInstructionsPanel();
            });
        }
        
        // Eventos do mapa
        if (this.map) {
            this.map.events.add('click', (e) => {
                // Implementar funcionalidades de clique se necessário
            });
        }
    }
    
    toggleInstructionsPanel() {
        const panel = document.getElementById('navigation-panel');
        const button = document.getElementById('toggle-instructions');
        
        if (panel.classList.contains('collapsed')) {
            panel.classList.remove('collapsed');
            button.textContent = '▼';
        } else {
            panel.classList.add('collapsed');
            button.textContent = '▲';
        }
    }
    
    updateLoadingMessage(message) {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const routeInterface = document.getElementById('route-interface');
        
        if (loadingScreen) {
            loadingScreen.classList.add('d-none');
        }
        
        if (routeInterface) {
            routeInterface.classList.remove('d-none');
        }
    }
    
    showError(title, message) {
        const errorScreen = document.getElementById('error-screen');
        const loadingScreen = document.getElementById('loading-screen');
        
        document.getElementById('error-title').textContent = title;
        document.getElementById('error-message').textContent = message;
        
        if (loadingScreen) {
            loadingScreen.classList.add('d-none');
        }
        
        if (errorScreen) {
            errorScreen.classList.remove('d-none');
        }
    }
    
    // Cleanup ao sair da página
    cleanup() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        if (this.geolocationWatch) {
            navigator.geolocation.clearWatch(this.geolocationWatch);
        }
        
        if (this.map) {
            this.map.dispose();
        }
    }
}

// Inicializar aplicação de navegação
const routeApp = new RouteNavigationApp();

// Cleanup ao sair da página
window.addEventListener('beforeunload', () => {
    if (routeApp) {
        routeApp.cleanup();
    }
});

// Tornar disponível globalmente
window.routeApp = routeApp;
