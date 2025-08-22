# 🔒 Solução para Persistência de Dados no Easypanel

## 🚨 Problema Identificado

**Sintoma:** A cada novo deploy no Easypanel, tanto a lista de convidados confirmados quanto as listas de casamento criadas são resetadas.

**Causa:** O banco de dados SQLite não está sendo persistido corretamente entre os deploys, causando perda de dados.

## ✅ Solução Implementada

### 1. Estrutura de Diretórios Reorganizada

```
projeto/
├── data/                    # 📁 Dados persistentes (NÃO copiados para Docker)
│   ├── wedding_rsvp.db     # 🗄️ Banco de dados
│   └── uploads/            # 📤 Arquivos enviados
├── backups/                 # 💾 Backups automáticos
├── easypanel-compose.yml   # 🐳 Docker Compose para Easypanel
└── easypanel-deploy.sh     # 🚀 Script de deploy
```

### 2. Dockerfile Otimizado

- ❌ **ANTES:** `COPY . .` (copiava TUDO, incluindo banco)
- ✅ **AGORA:** Copia apenas código, não dados
- 🔧 Script de inicialização que cria banco se não existir

### 3. Volumes Docker Configurados

```yaml
volumes:
  # Volume absoluto para persistência no Easypanel
  - /var/lib/easypanel/data/wedding-rsvp/database:/app/wedding_rsvp.db
  - /var/lib/easypanel/data/wedding-rsvp/uploads:/app/public/uploads
  - /var/lib/easypanel/data/wedding-rsvp/logs:/app/logs
```

## 🚀 Como Aplicar a Solução

### Passo 1: Preparar o Projeto

```bash
# Execute o script de deploy
chmod +x easypanel-deploy.sh
./easypanel-deploy.sh
```

### Passo 2: Fazer Commit e Push

```bash
git add .
git commit -m "Fix: Persistência de dados para Easypanel"
git push origin main
```

### Passo 3: Configurar no Easypanel

#### 3.1 Usar o Arquivo Correto
- ❌ **NÃO use:** `docker-compose.yml`
- ✅ **USE:** `easypanel-compose.yml`

#### 3.2 Configurar Variáveis de Ambiente
```bash
SESSION_SECRET=sua-chave-super-secreta-aqui
NODE_ENV=production
PORT=3000
```

#### 3.3 Verificar Volumes
No Easypanel, certifique-se de que os diretórios existem:
```bash
/var/lib/easypanel/data/wedding-rsvp/database
/var/lib/easypanel/data/wedding-rsvp/uploads
/var/lib/easypanel/data/wedding-rsvp/logs
```

## 🔧 Configurações Técnicas

### 1. Volumes Nomeados vs Bind Mounts

**Problema anterior:**
```yaml
volumes:
  - ./wedding_rsvp.db:/app/wedding_rsvp.db  # ❌ Relativo, pode falhar
```

**Solução atual:**
```yaml
volumes:
  - /var/lib/easypanel/data/wedding-rsvp/database:/app/wedding_rsvp.db  # ✅ Absoluto
```

### 2. Script de Inicialização

O Dockerfile agora inclui um script que:
- ✅ Verifica se o banco existe
- ✅ Cria um novo se necessário
- ✅ Preserva dados existentes

### 3. Health Check Melhorado

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s  # ✅ Tempo para inicialização
```

## 📋 Checklist de Verificação

### Antes do Deploy
- [ ] Script `easypanel-deploy.sh` executado
- [ ] Backup dos dados criado
- [ ] Estrutura de diretórios `data/` criada
- [ ] Banco de dados movido para `data/`
- [ ] Commit e push realizados

### No Easypanel
- [ ] Arquivo `easypanel-compose.yml` selecionado
- [ ] Variáveis de ambiente configuradas
- [ ] Volumes configurados corretamente
- [ ] Deploy executado

### Após o Deploy
- [ ] Container rodando
- [ ] Health check passando
- [ ] Dados anteriores preservados
- [ ] Funcionalidades testadas

## 🚨 Troubleshooting

### Problema: Dados ainda são perdidos

**Verificar:**
1. ✅ Arquivo correto sendo usado (`easypanel-compose.yml`)
2. ✅ Volumes configurados corretamente
3. ✅ Diretórios existem no servidor
4. ✅ Permissões corretas nos diretórios

**Solução:**
```bash
# No servidor Easypanel
sudo mkdir -p /var/lib/easypanel/data/wedding-rsvp/{database,uploads,logs}
sudo chown -R 1000:1000 /var/lib/easypanel/data/wedding-rsvp/
sudo chmod -R 755 /var/lib/easypanel/data/wedding-rsvp/
```

### Problema: Container não inicia

**Verificar logs:**
```bash
# No Easypanel, aba Logs
# Procurar por erros de permissão ou volume
```

## 💾 Backup e Recuperação

### Backup Automático
O script `backup.sh` cria backups antes de cada deploy:
- 🗄️ Banco de dados
- 📤 Uploads
- 📊 Exports
- 📝 Informações do backup

### Recuperação de Dados
```bash
# Restaurar banco de dados
cp backups/backup_YYYYMMDD_HHMMSS_database.db data/wedding_rsvp.db

# Restaurar uploads
tar -xzf backups/backup_YYYYMMDD_HHMMSS_uploads.tar.gz -C data/
```

## 🎯 Resultado Esperado

**ANTES:** ❌ Dados perdidos a cada deploy
**DEPOIS:** ✅ Dados preservados entre deploys

- ✅ Lista de convidados confirmados mantida
- ✅ Listas de casamento preservadas
- ✅ Uploads mantidos
- ✅ Histórico completo preservado

## 📞 Suporte

Se o problema persistir:
1. ✅ Verifique os logs do Easypanel
2. ✅ Confirme que está usando `easypanel-compose.yml`
3. ✅ Verifique as configurações de volume
4. ✅ Execute o script de backup antes de cada deploy

---

**🎉 Com essas mudanças, seus dados estarão seguros e persistirão entre todos os deploys no Easypanel!**
