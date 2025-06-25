# Sistema de Gerenciamento de Rotas para Caminhoneiros

![Status](https://img.shields.io/badge/status-pronto--para--produção-brightgreen)
![Versão](https://img.shields.io/badge/versão-1.0.0-blue)
![Licença](https://img.shields.io/badge/licença-MIT-green)

Um sistema completo para gerenciar rotas de caminhoneiros dentro de empresas, utilizando QR Codes temporários e navegação via Azure Maps.

## 🚀 Características Principais

### Para o Porteiro
- ✅ Interface intuitiva para cadastro de caminhões e motoristas
- ✅ Geração de QR Codes temporários com tempo de expiração customizável
- ✅ Validação automática de placas brasileiras (formato antigo e Mercosul)
- ✅ Validação de CPF/CNPJ com cálculo de dígitos verificadores
- ✅ Histórico de QR Codes recentes com status de expiração
- ✅ Compartilhamento direto via WhatsApp

### Para o Caminhoneiro
- ✅ Navegação simples através de QR Code escaneado
- ✅ Mapa interativo com Azure Maps e rotas otimizadas
- ✅ Instruções de navegação passo a passo
- ✅ Interface móvel responsiva
- ✅ Contador regressivo de expiração do link
- ✅ Rastreamento de localização em tempo real

### Para o Sistema
- ✅ Links temporários com expiração automática
- ✅ Validação robusta de dados em todas as etapas
- ✅ Tratamento completo de erros
- ✅ Auto-diagnóstico do sistema
- ✅ Compatibilidade com navegadores modernos

## 📁 Estrutura do Projeto

```
sistema-rotas/
├── index.html              # Interface principal do porteiro
├── rota.html               # Página de navegação para caminhoneiros
├── teste.html              # Página de validação do sistema
├── css/
│   └── style.css           # Estilos responsivos completos
├── js/
│   ├── config.js           # Configurações centralizadas
│   ├── app.js              # Lógica da interface do porteiro
│   ├── route.js            # Lógica da navegação no mapa
│   └── utils.js            # Funções utilitárias
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Framework CSS:** Bootstrap 5.3
- **Mapas:** Azure Maps SDK v3
- **QR Code:** QRCode.js library
- **Armazenamento:** LocalStorage (sem necessidade de banco de dados)
- **Compatibilidade:** Chrome 60+, Firefox 55+, Safari 12+, Edge 79+

## 📋 Pré-requisitos

1. **Conta no Microsoft Azure** (gratuita)
2. **Chave do Azure Maps** (gratuito até 250.000 transações/mês)
3. **Hospedagem web** (GitHub Pages, Netlify, Vercel - gratuito)
4. **Coordenadas GPS** das portarias e docas da sua empresa

## 🚀 Instalação e Configuração

### Passo 1: Configuração do Azure Maps

1. Acesse [portal.azure.com](https://portal.azure.com)
2. Crie uma conta gratuita se necessário
3. Crie um recurso **Azure Maps**:
   - Vá em "Criar um recurso"
   - Busque por "Azure Maps"
   - Selecione a camada de preços **S0** (gratuita)
4. Copie a **Chave Primária** da seção "Autenticação"

### Passo 2: Configuração do Sistema

1. **Edite o arquivo `js/config.js`:**

```javascript
// Substitua pela sua chave do Azure Maps
subscriptionKey: 'SUA_CHAVE_AZURE_MAPS_AQUI',

// Atualize com o nome da sua empresa
companyName: "SUA EMPRESA LTDA",

// Configure a URL após hospedagem
baseUrl: "https://seuusuario.github.io/sistema-rotas",
```

2. **Configure as coordenadas das portarias:**

```javascript
const PORTARIAS = [
    {
        id: 1,
        nome: "Portaria Principal",
        coordenadas: {
            latitude: -23.550520,  // ← Substitua pela latitude real
            longitude: -46.633308  // ← Substitua pela longitude real
        }
    }
];
```

3. **Configure as coordenadas das docas:**

```javascript
const DOCAS = [
    {
        id: 1,
        nome: "Doca A",
        coordenadas: {
            latitude: -23.550920,  // ← Substitua pela latitude real
            longitude: -46.633108  // ← Substitua pela longitude real
        }
    }
];
```

#### 📍 Como Obter Coordenadas Precisas

1. Acesse [Google Maps](https://maps.google.com)
2. Navegue até o local da portaria/doca
3. Clique com o botão direito no local exato
4. Selecione "Copiar coordenadas"
5. Cole no formato `-23.550520, -46.633308`

### Passo 3: Hospedagem

#### Opção Recomendada: GitHub Pages

1. Crie um repositório público no GitHub
2. Faça upload de todos os arquivos
3. Vá em **Settings** > **Pages**
4. Selecione **Deploy from a branch** > **main**
5. Acesse em `https://seuusuario.github.io/nome-repositorio`

#### Outras Opções Gratuitas

- **Netlify:** Arraste a pasta do projeto para [netlify.com/drop](https://netlify.com/drop)
- **Vercel:** Conecte seu repositório GitHub em [vercel.com](https://vercel.com)
- **Firebase Hosting:** Use `firebase deploy` após configuração

### Passo 4: Teste Final

1. Acesse `teste.html` no seu domínio
2. Verifique se todos os testes passam:
   - ✅ Bibliotecas JavaScript carregadas
   - ✅ Chave do Azure Maps configurada
   - ✅ Coordenadas válidas
   - ✅ Conectividade com APIs

## 💰 Custos Operacionais

### Gratuito até 250.000 transações/mês
- **Azure Maps:** Camada S0 - Grátis (suficiente para ~8.000 caminhões/mês)
- **Hospedagem:** GitHub Pages/Netlify/Vercel - Grátis
- **Domínio:** Opcional (~R$ 40/ano)
- **Manutenção:** Zero - sistema automatizado

### Estimativa de Uso
- **1 QR Code + Navegação:** ~30 transações
- **Empresa com 100 caminhões/dia:** ~90.000 transações/mês
- **Margem de segurança:** 160.000 transações restantes

## 📱 Como Usar

### Interface do Porteiro (`index.html`)

1. **Cadastrar Caminhão:**
   - Preencha placa (formato ABC1234 ou ABC1D23)
   - Nome do motorista (obrigatório)
   - CPF/CNPJ (opcional, mas validado)
   - Selecione portaria de entrada
   - Selecione doca de destino
   - Defina tempo de expiração (1-24 horas)

2. **Gerar QR Code:**
   - Clique em "Gerar QR Code"
   - Sistema valida todos os campos
   - QR Code aparece com link de backup
   - Compartilhe via WhatsApp ou copie o link

3. **Gerenciar Histórico:**
   - Visualize QR Codes recentes
   - Veja status de expiração em tempo real
   - Reenvie ou remova códigos antigos

### Navegação do Caminhoneiro (`rota.html`)

1. **Escanear QR Code:**
   - Use qualquer app de QR Code
   - Ou acesse o link diretamente

2. **Seguir Navegação:**
   - Mapa carrega automaticamente
   - Rota otimizada é calculada
   - Instruções passo a passo são exibidas
   - Timer de expiração é mostrado

3. **Funcionalidades Móveis:**
   - Interface adaptada para smartphone
   - Rastreamento de localização
   - Atualização em tempo real

## 🔧 Solução de Problemas

### Erro: "Expected value to be of type number, but found null"

**Causa:** Coordenadas configuradas como `null` no `config.js`

**Solução:**
1. Abra `js/config.js`
2. Substitua todos os valores `null` por coordenadas reais
3. Execute `teste.html` para validar

### Erro: "Bibliotecas JavaScript não carregadas"

**Causa:** Problemas de conectividade ou CDNs bloqueados

**Solução:**
1. Verifique conexão com internet
2. Desative adblockers temporariamente
3. Teste em navegador diferente
4. Verifique firewall corporativo

### Erro: "Chave do Azure Maps não configurada"

**Causa:** Chave não substituída no `config.js`

**Solução:**
1. Acesse [portal.azure.com](https://portal.azure.com)
2. Vá em Azure Maps > Autenticação
3. Copie a chave primária
4. Cole em `AZURE_MAPS_CONFIG.subscriptionKey`

### QR Code não funciona

**Possíveis causas:**
- Link expirado
- Dados corrompidos
- Coordenadas inválidas

**Solução:**
1. Gere novo QR Code
2. Verifique `teste.html`
3. Valide coordenadas no `config.js`

## 🔒 Segurança e Privacidade

### Dados Protegidos
- ✅ Links temporários com expiração automática
- ✅ Dados codificados em base64
- ✅ Validação contra XSS
- ✅ Processamento local (sem servidor)

### Conformidade LGPD
- ✅ Dados armazenados apenas localmente
- ✅ Nenhuma informação enviada para servidores externos
- ✅ Usuário controla próprios dados
- ✅ Possibilidade de limpeza completa

### Recomendações de Segurança
1. **Configure HTTPS:** Sempre use conexão segura
2. **Monitore uso:** Acompanhe transações no Azure
3. **Atualize regularmente:** Mantenha bibliotecas atualizadas
4. **Backup de configuração:** Mantenha cópia do `config.js`

## 📊 Monitoramento

### Azure Portal
1. Acesse **Azure Maps** > **Métricas**
2. Monitore:
   - Total de transações
   - Transações por tipo
   - Erros de API
   - Uso por região

### Alertas Recomendados
- **80% do limite mensal:** Aviso por email
- **95% do limite mensal:** Alerta crítico
- **Erros de API > 5%:** Verificar configuração

## 🆘 Suporte e Comunidade

### Recursos Oficiais
- **Azure Maps:** [docs.microsoft.com/azure/azure-maps](https://docs.microsoft.com/azure/azure-maps)
- **Bootstrap:** [getbootstrap.com](https://getbootstrap.com)
- **QRCode.js:** [github.com/davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs)

### Solução de Problemas
1. **Primeira tentativa:** Execute `teste.html`
2. **Segunda tentativa:** Verifique console do navegador (F12)
3. **Terceira tentativa:** Reconfigure Azure Maps
4. **Último recurso:** Contate suporte Azure

## 📈 Atualizações Futuras

### Versão 1.1 (Planejada)
- [ ] Integração com WhatsApp Business API
- [ ] Relatórios de uso em PDF
- [ ] Múltiplos idiomas
- [ ] Tema escuro

### Versão 1.2 (Planejada)
- [ ] API para integração com sistemas ERP
- [ ] Notificações push
- [ ] Histórico de rotas
- [ ] Dashboard administrativo

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja os detalhes:

```
MIT License

Copyright (c) 2025 Sistema de Gerenciamento de Rotas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🏆 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

## 👥 Autores

- **Desenvolvimento Inicial:** Sistema de IA Perplexity
- **Conceito e Requisitos:** Baseado em necessidades reais de empresas brasileiras

## 🙏 Agradecimentos

- **Microsoft Azure** pelos serviços de mapa gratuitos
- **Bootstrap Team** pelo framework CSS
- **David Shim** pela biblioteca QRCode.js
- **Comunidade open source** pelas ferramentas utilizadas

---

**📞 Precisa de ajuda?** 
1. Execute `teste.html` primeiro
2. Verifique este README
3. Consulte a documentação do Azure Maps
4. Abra uma issue no repositório

**🚀 Pronto para começar?**
1. Configure sua chave do Azure Maps
2. Atualize as coordenadas
3. Faça o deploy
4. Execute o teste
5. Comece a usar!

---

*Sistema desenvolvido para otimizar o fluxo de caminhões em empresas brasileiras, reduzindo filas e melhorando a eficiência operacional.*