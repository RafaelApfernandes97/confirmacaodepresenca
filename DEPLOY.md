# 🚀 Guia de Deploy - Wedding RSVP

## 📋 Pré-requisitos

- Easypanel instalado e configurado
- Acesso SSH ao servidor
- Domínio configurado (opcional, mas recomendado)

## 🐳 Deploy com Docker (Recomendado)

### 1. Preparar o Projeto

```bash
# Clonar o repositório no servidor
git clone <seu-repositorio>
cd wedding-rsvp

# Verificar se todos os arquivos estão presentes
ls -la
```

### 2. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env (se necessário)
cp .env.example .env
nano .env
```

### 3. Fazer Deploy

```bash
# Dar permissão ao script de deploy
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

### 4. Verificar Status

```bash
# Ver containers rodando
docker-compose ps

# Ver logs
docker-compose logs -f

# Ver uso de recursos
docker stats
```

## 🌐 Deploy no Easypanel

### Opção 1: Deploy via Git + Docker

1. **No Easypanel:**
   - Criar novo projeto
   - Selecionar "Git Repository"
   - Conectar com seu repositório
   - Selecionar branch (main/master)

2. **Configurar Build:**
   - Build Command: `docker-compose up -d --build`
   - Port: `3000`
   - Environment: `production`

3. **Configurar Domínio:**
   - Adicionar domínio personalizado
   - Configurar SSL automático

### Opção 2: Deploy via Docker Image

1. **Fazer build da imagem:**
   ```bash
   docker build -t wedding-rsvp:latest .
   ```

2. **Fazer push para registry:**
   ```bash
   docker tag wedding-rsvp:latest seu-registry/wedding-rsvp:latest
   docker push seu-registry/wedding-rsvp:latest
   ```

3. **No Easypanel:**
   - Criar projeto Docker
   - Usar imagem: `seu-registry/wedding-rsvp:latest`
   - Porta: `3000`

## 🔧 Configurações de Produção

### 1. Variáveis de Ambiente

```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=sua-chave-secreta-muito-segura
```

### 2. Banco de Dados

- O SQLite será persistido via volume Docker
- Para MySQL/PostgreSQL, configurar variáveis de conexão

### 3. Uploads

- Diretório `/public/uploads` é persistido via volume
- Configurar backup automático se necessário

## 📊 Monitoramento

### 1. Logs

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs wedding-rsvp
```

### 2. Status da Aplicação

```bash
# Verificar se está rodando
curl http://localhost:3000/

# Verificar health check
curl http://localhost:3000/health
```

### 3. Recursos

```bash
# Uso de CPU e memória
docker stats

# Espaço em disco
df -h
```

## 🔄 Atualizações

### 1. Deploy Automático

```bash
# Pull das mudanças
git pull origin main

# Rebuild e restart
docker-compose down
docker-compose up -d --build
```

### 2. Rollback

```bash
# Voltar para versão anterior
git checkout <commit-hash>
docker-compose down
docker-compose up -d --build
```

## 🚨 Troubleshooting

### 1. Aplicação não inicia

```bash
# Ver logs de erro
docker-compose logs

# Verificar portas
netstat -tulpn | grep 3000

# Verificar permissões
ls -la wedding_rsvp.db
```

### 2. Erro de permissão

```bash
# Corrigir permissões
sudo chown -R $USER:$USER .
chmod 755 public/uploads
```

### 3. Banco de dados corrompido

```bash
# Fazer backup
cp wedding_rsvp.db wedding_rsvp.db.backup

# Restaurar backup
cp wedding_rsvp.db.backup wedding_rsvp.db
```

## 📱 URLs Importantes

- **Aplicação Principal:** `http://seu-dominio.com/`
- **Dashboard Admin:** `http://seu-dominio.com/admin`
- **Login Admin:** `http://seu-dominio.com/admin/login`
- **Dashboard Compartilhado:** `http://seu-dominio.com/share/[slug]`

## 🔐 Segurança

### 1. HTTPS
- Configurar SSL automático no Easypanel
- Forçar redirecionamento HTTPS

### 2. Firewall
- Abrir apenas porta 80/443
- Bloquear acesso direto à porta 3000

### 3. Senhas
- Alterar senhas padrão
- Usar senhas fortes para admin

## 📈 Backup

### 1. Banco de Dados
```bash
# Backup automático diário
0 2 * * * cp wedding_rsvp.db /backup/wedding_rsvp_$(date +%Y%m%d).db
```

### 2. Uploads
```bash
# Backup dos arquivos
0 3 * * * tar -czf /backup/uploads_$(date +%Y%m%d).tar.gz public/uploads/
```

## 🎯 Próximos Passos

1. ✅ Configurar domínio personalizado
2. ✅ Configurar SSL/HTTPS
3. ✅ Configurar backup automático
4. ✅ Configurar monitoramento
5. ✅ Configurar CI/CD automático

---

**Suporte:** Em caso de problemas, verificar logs e documentação do Easypanel.
