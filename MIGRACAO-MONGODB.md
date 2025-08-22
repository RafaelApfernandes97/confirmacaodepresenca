# 🚀 Migração para MongoDB - Wedding RSVP

## 🎯 **Por que MongoDB?**

### ✅ **Vantagens da Migração:**
- **Persistência Garantida:** Dados sempre salvos no servidor MongoDB
- **Sem Problemas de Volume:** Não depende de volumes Docker
- **Escalabilidade:** Banco de dados robusto e escalável
- **Performance:** Queries otimizadas com índices
- **Flexibilidade:** Schema flexível para futuras expansões

### ❌ **Problemas Resolvidos:**
- ❌ **Erros 500** causados por inconsistências de schema
- ❌ **Perda de dados** entre deploys no Easypanel
- ❌ **Problemas de volume** Docker
- ❌ **Inconsistências** entre `wedding_id` e `wedding_slug`

## 🔧 **Arquitetura Nova**

### **Estrutura de Diretórios:**
```
projeto/
├── config/
│   └── database.js          # Configuração MongoDB
├── models/
│   ├── Wedding.js           # Modelo de casamentos
│   ├── Guest.js             # Modelo de convidados
│   └── AdminUser.js         # Modelo de usuários admin
├── operations/
│   ├── weddingOperations.js # Operações de casamentos
│   ├── guestOperations.js   # Operações de convidados
│   └── adminOperations.js   # Operações de admin
├── public/                  # Arquivos estáticos
├── exports/                 # Arquivos CSV exportados
└── server.js                # Servidor principal
```

### **Modelos MongoDB:**

#### **Wedding (Casamentos):**
```javascript
{
    bride_name: String,        // Nome da noiva
    groom_name: String,        // Nome do noivo
    wedding_date: String,      // Data do casamento
    wedding_time: String,      // Horário do casamento
    venue_address: String,     // Endereço do local
    venue_name: String,        // Nome do local
    additional_info: String,   // Informações adicionais
    header_image: String,      # Imagem de cabeçalho
    header_text: String,       # Texto do cabeçalho
    color_scheme: String,      # Esquema de cores
    background_color: String,  # Cor de fundo
    text_color: String,        # Cor do texto
    accent_color: String,      # Cor de destaque
    slug: String,              # URL amigável (único)
    is_active: Boolean,        # Status ativo/inativo
    createdAt: Date,           # Data de criação
    updatedAt: Date            # Data de atualização
}
```

#### **Guest (Convidados):**
```javascript
{
    wedding_slug: String,      # Slug do casamento
    name: String,              # Nome do responsável
    adults: Number,            # Quantidade de adultos
    children: Number,          # Quantidade de crianças
    adults_names: [String],    # Array com nomes dos adultos
    children_details: [{       # Array com detalhes das crianças
        name: String,          # Nome da criança
        over6: Boolean         # Maior de 6 anos
    }],
    phone: String,             # Telefone
    createdAt: Date,           # Data de criação
    updatedAt: Date            # Data de atualização
}
```

#### **AdminUser (Usuários Admin):**
```javascript
{
    username: String,          # Nome de usuário (único)
    password_hash: String,     # Hash da senha
    is_active: Boolean,        # Status ativo/inativo
    last_login: Date,          # Último login
    createdAt: Date,           # Data de criação
    updatedAt: Date            # Data de atualização
}
```

## 🚀 **Como Aplicar a Migração**

### **Passo 1: Preparar o Projeto**
```bash
# Instalar dependências MongoDB
npm install mongodb mongoose bcrypt

# Verificar se todos os arquivos foram criados
ls -la config/ models/ operations/
```

### **Passo 2: Fazer Commit das Alterações**
```bash
git add .
git commit -m "feat: Migrar para MongoDB - Resolver problemas de persistência e erros 500"
git push origin main
```

### **Passo 3: No Easypanel**
1. **Usar o arquivo correto:** `easypanel-compose.yml`
2. **Configurar variáveis de ambiente:**
   ```bash
   MONGODB_URI=mongodb://admin:admin@164.68.109.41:3080/?tls=false
   SESSION_SECRET=sua-chave-super-secreta
   NODE_ENV=production
   PORT=3000
   ```
3. **Fazer novo deploy**

## 🔍 **Configuração do MongoDB**

### **String de Conexão:**
```
mongodb://admin:admin@164.68.109.41:3080/?tls=false
```

### **Parâmetros:**
- **Host:** `164.68.109.41`
- **Porta:** `3080`
- **Usuário:** `admin`
- **Senha:** `admin`
- **TLS:** `false` (sem criptografia)
- **Database:** `wedding_rsvp` (criado automaticamente)

### **Opções de Conexão:**
```javascript
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'wedding_rsvp',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
};
```

## 📊 **Operações do Banco**

### **Wedding Operations:**
- ✅ `getAllWeddings()` - Buscar todos os casamentos ativos
- ✅ `getWeddingBySlug(slug)` - Buscar por slug
- ✅ `createWedding(data)` - Criar novo casamento
- ✅ `updateWedding(id, data)` - Atualizar casamento
- ✅ `deleteWedding(id)` - Marcar como inativo (soft delete)

### **Guest Operations:**
- ✅ `getGuestsByWedding(slug)` - Buscar convidados por casamento
- ✅ `insertGuest(data)` - Inserir novo convidado
- ✅ `getStatsByWedding(slug)` - Estatísticas do casamento
- ✅ `deleteGuest(id)` - Deletar convidado
- ✅ `checkPhoneExists(slug, phone)` - Verificar telefone duplicado

### **Admin Operations:**
- ✅ `authenticate(username, password)` - Autenticar usuário
- ✅ `createDefaultAdmin()` - Criar usuário padrão
- ✅ `getAdminById(id)` - Buscar admin por ID

## 🔒 **Segurança**

### **Autenticação:**
- **Usuário padrão:** `admin`
- **Senha padrão:** `admin123`
- **Hash:** bcrypt com salt 10
- **Sessão:** Express-session com cookie seguro

### **Validações:**
- **Schema validation** do Mongoose
- **Rate limiting** para APIs
- **Helmet** para headers de segurança
- **CORS** configurado

## 📋 **Checklist de Verificação**

### **Antes do Deploy:**
- [ ] Dependências MongoDB instaladas
- [ ] Modelos criados e configurados
- [ ] Operações do banco implementadas
- [ ] Server.js atualizado
- [ ] Dockerfile simplificado
- [ ] Docker Compose atualizado
- [ ] Commit e push realizados

### **Durante o Deploy:**
- [ ] Container inicia sem erros
- [ ] Conexão MongoDB estabelecida
- [ ] Usuário admin padrão criado
- [ ] Aplicação responde na porta 3000

### **Após o Deploy:**
- [ ] Health check passa
- [ ] Dashboard admin carrega
- [ ] Lista de casamentos funciona
- [ ] Lista de convidados funciona
- [ ] RSVP funciona
- [ ] Dados são persistidos no MongoDB

## 🎯 **Resultado Esperado**

**ANTES:** ❌ Erros 500, dados perdidos, problemas de volume
**DEPOIS:** ✅ Sistema robusto, dados persistentes, sem erros

- ✅ **Persistência Garantida:** Dados sempre salvos no MongoDB
- ✅ **Sem Erros 500:** Sistema estável e confiável
- ✅ **Performance Otimizada:** Queries rápidas com índices
- ✅ **Escalabilidade:** Banco preparado para crescimento
- ✅ **Manutenibilidade:** Código limpo e organizado

## 🚨 **Troubleshooting**

### **Problemas de Conexão MongoDB:**
1. ✅ Verificar se o servidor MongoDB está acessível
2. ✅ Confirmar credenciais (admin/admin)
3. ✅ Verificar se a porta 3080 está aberta
4. ✅ Confirmar se TLS está desabilitado

### **Problemas de Deploy:**
1. ✅ Verificar logs do container
2. ✅ Confirmar variáveis de ambiente
3. ✅ Verificar se o arquivo correto está sendo usado
4. ✅ Confirmar se as dependências foram instaladas

---

**🎉 Com a migração para MongoDB, todos os problemas de persistência e erros 500 serão resolvidos!**
