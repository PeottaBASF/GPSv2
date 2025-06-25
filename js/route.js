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
            const urlParams = new URLSearchParams(window.location.search);
            const encodedData = urlParams.get('data');
            
            if (!encodedData) {
                this.showError('Link inválido', 'Nenhum dado encontrado na URL');
                return;
            }

            const decodedData = DataEncoder.decodeData(encodedData);
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
            this.initializeInterface();
        } catch (error) {
            console.error('Erro ao processar dados da rota:', error);
            this.showError('Erro de Processamento', 'Não foi possível processar os dados da rota. Verifique o QR Code.');
        }
    }

    initializeInterface() {
        this.updateHeaderInfo();
        this.initializeMap();
        this.startCountdown();
        this.requestUserLocation();
        this.setupEventListeners();
    }

    updateHeaderInfo() {
        document.getElementById('truck-plate-display').textContent = this.routeData.truckPlate;
        document.getElementById('driver-name-display').textContent = this.routeData.driverName;
        document.getElementById('dock-name-display').textContent = this.doca.nome;
    }

    initializeMap() {
        this.updateLoadingMessage('Inicializando mapa...');
        try {
            if (typeof atlas === 'undefined') {
                throw new Error('Azure Maps SDK não carregado');
            }
            
            if (!AZURE_MAPS_CONFIG.subscriptionKey || AZURE_MAPS_CONFIG.subscriptionKey === 'SUA_CHAVE_AZURE_MAPS_AQUI') {
                throw new Error('Chave do Azure Maps não configurada');
            }
            
            const centerLat = (this.portaria.coordenadas.latitude + this.doca.coordenadas.latitude) / 2;
            const centerLng = (this.portaria.coordenadas.longitude + this.doca.coordenadas.longitude) / 2;
            
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
            
            this.map.events.add('ready', () => {
                this.onMapReady();
            });
            
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
            this.datasource = new atlas.source.DataSource();
            this.map.sources.add(this.datasource);
            
            this.routeLayer = new atlas.layer.LineLayer(this.datasource, null, {
                strokeColor: '#0078d4',
                strokeWidth: 6,
                strokeOpacity: 0.8
            });
            this.map.layers.add(this.routeLayer);
            
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
            
            this.addMarkers();
            this.calculateRoute();
            
        } catch (error) {
            console.error('Erro ao configurar mapa:', error);
            this.showError('Erro de Configuração', 'Falha ao configurar o mapa');
        }
    }

    addMarkers() {
        const startMarker = new atlas.data.Feature(
            new atlas.data.Point([this.portaria.coordenadas.longitude, this.portaria.coordenadas.latitude]), 
            {
                title: '🚪 ' + this.portaria.nome,
                type: 'start'
            }
        );
        
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
            if (!this.portaria.coordenadas || !this.doca.coordenadas) {
                throw new Error("Coordenadas indefinidas em config.js");
            }
            
            // CORREÇÃO: Usar ordem latitude, longitude conforme necessário
            const start = `${this.portaria.coordenadas.latitude},${this.portaria.coordenadas.longitude}`;
            const end = `${this.doca.coordenadas.latitude},${this.doca.coordenadas.longitude}`;
            
            const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0` +
                        `&subscription-key=${AZURE_MAPS_CONFIG.subscriptionKey}` +
                        `&query=${encodeURIComponent(start)}:${encodeURIComponent(end)}` +
                        `&travelMode=truck` +
                        `&routeType=fastest`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Azure Maps: ${errorData.error.message}`);
            }
            
            const routeResponse = await response.json();
            if (!routeResponse.routes || routeResponse.routes.length === 0) {
                throw new Error('Nenhuma rota encontrada');
            }
            
            this.processRoute(routeResponse.routes[0]);
            
        } catch (error) {
            console.error('Erro ao calcular rota:', error);
            this.createDirectRoute();
            notifications.warning('Usando rota direta. Verifique sua conexão para rota otimizada.');
        }
    }
    
    processRoute(route) {
        this.currentRoute = route;
        
        const routeLine = new atlas.data.LineString(route.legs[0].points);
        this.datasource.add(new atlas.data.Feature(routeLine));
        
        const bounds = atlas.data.BoundingBox.fromData(routeLine);
        this.map.setCamera({
            bounds: bounds,
            padding: 50
        });
        
        this.updateRouteInfo(route);
        this.generateInstructions(route);
        this.hideLoadingScreen();
    }
    
    createDirectRoute() {
        const startCoords = [this.portaria.coordenadas.longitude, this.portaria.coordenadas.latitude];
        const endCoords = [this.doca.coordenadas.longitude, this.doca.coordenadas.latitude];
        
        const directLine = new atlas.data.LineString([startCoords, endCoords]);
        this.datasource.add(new atlas.data.Feature(directLine));
        
        const distance = calculateDistance(
            this.portaria.coordenadas.latitude, 
            this.portaria.coordenadas.longitude,
            this.doca.coordenadas.latitude, 
            this.doca.coordenadas.longitude
        );
        
        const timeInSeconds = (distance / 1000) * 3.6 * 20;
        
        document.getElementById('total-distance').textContent = DataFormatter.formatDistance(distance);
        document.getElementById('total-time').textContent = DataFormatter.formatTravelTime(timeInSeconds);
        
        const bounds = atlas.data.BoundingBox.fromData(directLine);
        this.map.setCamera({
            bounds: bounds,
            padding: 50
        });
        
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
                
                if (timeRemaining < 5 * 60 * 1000) {
                    countdownElement.innerHTML = `⚠️ ${formatted}`;
                } else if (timeRemaining < 15 * 60 * 1000) {
                    countdownElement.innerHTML = `⏰ ${formatted}`;
                } else {
                    countdownElement.innerHTML = `⏰ ${formatted}`;
                }
            }
        }, 1000);
    }
    
    handleExpiredLink() {
        notifications.error('Link expirado! Solicite um novo QR Code.', 0);
        
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.id !== 'toggle-instructions') {
                btn.disabled = true;
            }
        });
    }
    
    async requestUserLocation() {
        try {
            // Passo 1: Verificar suporte do navegador
            if (!navigator.geolocation) {
                throw new Error("Geolocalização não suportada");
            }
    
            // Passo 2: Configurar opções otimizadas
            const geoOptions = {
                enableHighAccuracy: true,
                timeout: 5000,    // 5 segundos
                maximumAge: 0      // Sem cache
            };
    
            // Passo 3: Usar Promise para controle do timeout
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, geoOptions);
            });
    
            // Passo 4: Atualizar estado com nova localização
            this.userPosition = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            this.addUserLocationMarker();
            this.startLocationTracking();
            
        } catch (error) {
            console.warn('Erro de geolocalização:', error);
            
            // Tratamento detalhado por código de erro
            switch(error.code) {
                case 1: // PERMISSION_DENIED
                    notifications.warning(
                        'Permissão negada. Ative a localização nas configurações do navegador 🔒'
                    );
                    break;
                    
                case 2: // POSITION_UNAVAILABLE
                    notifications.warning(
                        'Serviço de localização indisponível. Verifique:' +
                        '\n• Conexão com internet 🌐' +
                        '\n• GPS ativado 📡' +
                        '\n• Permissões do sistema 🔑'
                    );
                    break;
                    
                case 3: // TIMEOUT
                    notifications.info(
                        'Tempo de busca excedido. A navegação continuará sem localização em tempo real ⏱️'
                    );
                    break;
                    
                default:
                    notifications.info(
                        'Localização não disponível. A rota será exibida normalmente 🗺️'
                    );
            }
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
    }
    
    setupEventListeners() {
        const toggleBtn = document.getElementById('toggle-instructions');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleInstructionsPanel();
            });
        }
        
        if (this.map) {
            this.map.events.add('click', (e) => {});
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

const routeApp = new RouteNavigationApp();

window.addEventListener('beforeunload', () => {
    if (routeApp) {
        routeApp.cleanup();
    }
});

window.routeApp = routeApp;
