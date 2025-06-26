// Configuração do sistema
const CONFIG = {
    // Chave do Azure Maps (substitua pela sua chave real)
    azureMapsKey: 'SUA_CHAVE_AZURE_MAPS_AQUI',
    
    // Coordenadas fictícias para teste
    defaultCoordinates: {
        lat: -23.5505,
        lng: -46.6333
    },
    
    // Portarias de entrada
    entryGates: {
        1: {
            name: 'Portaria Principal',
            coordinates: { lat: -23.5505, lng: -46.6333 }
        },
        2: {
            name: 'Portaria Secundária', 
            coordinates: { lat: -23.5515, lng: -46.6343 }
        }
    },
    
    // Docas de destino
    destinationDocks: {
        1: {
            name: 'Doca A',
            coordinates: { lat: -23.5525, lng: -46.6353 }
        },
        2: {
            name: 'Doca B',
            coordinates: { lat: -23.5535, lng: -46.6363 }
        },
        3: {
            name: 'Doca C',
            coordinates: { lat: -23.5545, lng: -46.6373 }
        }
    }
};
