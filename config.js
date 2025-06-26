// Configuração do sistema
const CONFIG = {
    // Chave do Azure Maps (substitua pela sua chave real)
    azureMapsKey: '6RSGmiu3ErhQYwneLdwQVDQ1FgBiyFotIKSxueUPU0oxaKM71PqIJQQJ99BFACrJL3J91W9IAAAgAZMP3zaY',
    
    // Coordenadas fictícias para teste
    defaultCoordinates: {
        lat: -23.5505,
        lng: -46.6333
    },
    
    // Portarias de entrada
    entryGates: {
        1: {
            name: 'Portaria Principal',
            coordinates: { lat: -23.7490, lng: -46.5643 }
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
            coordinates: { lat: -23.7477, lng: -46.5611 }
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
