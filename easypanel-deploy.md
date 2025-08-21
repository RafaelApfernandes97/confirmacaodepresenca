# 🚀 Deploy no Easypanel - Wedding RSVP

## 📋 Passo a Passo Completo

### 1. Preparar o Repositório

```bash
# Fazer commit de todos os arquivos
git add .
git commit -m "Preparar para deploy no Easypanel"
git push origin main
```

### 2. Configurar Projeto no Easypanel

#### 2.1 Criar Novo Projeto
- Acesse o Easypanel
- Clique em "New Project"
- Escolha "Git Repository"

#### 2.2 Conectar Repositório
- **Repository URL:** `https://github.com/seu-usuario/wedding-rsvp.git`
- **Branch:** `main` ou `master`
- **Project Name:** `wedding-rsvp`

#### 2.3 Configurar Build
- **Build Command:** `docker-compose up -d --build`
- **Port:** `3000`
- **Environment:** `production`

### 3. Configurar Variáveis de Ambiente

No Easypanel, adicione estas variáveis:

```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=sua-chave-super-secreta-aqui
```

### 4. Configurar Domínio

#### 4.1 Adicionar Domínio
- **Domain:** `seu-dominio.com`
- **SSL:** Habilitar (automático)

#### 4.2 Configurar DNS
```
A Record: @ -> IP_DO_SERVIDOR
CNAME: www -> @
```

### 5. Fazer Deploy

#### 5.1 Deploy Automático
- O Easypanel fará deploy automático quando detectar mudanças no Git
- Você pode forçar um deploy manual clicando em "Deploy"

#### 5.2 Verificar Status
- **Build Status:** Deve mostrar "Success"
- **Container Status:** Deve mostrar "Running"
- **Port Status:** Deve mostrar "3000"

### 6. Testar Aplicação

#### 6.1 URLs de Teste
- **Principal:** `https://seu-dominio.com/`
- **Admin:** `https://seu-dominio.com/admin`
- **Login:** `https://seu-dominio.com/admin/login`

#### 6.2 Verificar Funcionalidades
- ✅ Página inicial carrega
- ✅ Login admin funciona
- ✅ Dashboard admin funciona
- ✅ Dashboard compartilhado funciona
- ✅ Uploads funcionam

## 🔧 Configurações Avançadas

### 1. Health Check

Adicione esta rota no `server.js`:

```javascript
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
```

### 2. Logs

No Easypanel:
- **Logs:** Acesse a aba "Logs" para ver logs em tempo real
- **Container Logs:** Ver logs específicos do container

### 3. Monitoramento

- **CPU/Memory:** Monitore uso de recursos
- **Disk Space:** Verifique espaço disponível
- **Network:** Monitore tráfego de rede

## 🚨 Troubleshooting Comum

### 1. Build Falha

**Problema:** Docker build falha
**Solução:**
```bash
# Verificar logs de build
# Verificar se Dockerfile está correto
# Verificar se .dockerignore está configurado
```

### 2. Aplicação não Inicia

**Problema:** Container para de rodar
**Solução:**
```bash
# Verificar logs do container
# Verificar variáveis de ambiente
# Verificar se porta 3000 está livre
```

### 3. Banco de Dados não Persiste

**Problema:** Dados são perdidos após restart
**Solução:**
```bash
# Verificar volumes Docker
# Verificar permissões de arquivo
# Verificar se .db está sendo copiado
```

## 📊 Monitoramento e Manutenção

### 1. Logs Importantes

```bash
# Aplicação iniciando
"Server running on port 3000"

# Erros de banco
"Error connecting to database"

# Erros de upload
"Error uploading file"
```

### 2. Métricas Importantes

- **Response Time:** < 500ms
- **Memory Usage:** < 512MB
- **CPU Usage:** < 50%
- **Disk Usage:** < 80%

### 3. Backup

```bash
# Backup automático do banco
0 2 * * * cp wedding_rsvp.db /backup/

# Backup dos uploads
0 3 * * * tar -czf /backup/uploads.tar.gz public/uploads/
```

## 🔄 Atualizações

### 1. Deploy Automático

- Faça push para `main`
- Easypanel detecta mudanças
- Deploy automático inicia
- Container é rebuildado
- Nova versão fica ativa

### 2. Deploy Manual

```bash
# No Easypanel
1. Ir para o projeto
2. Clicar em "Deploy"
3. Aguardar build
4. Verificar status
```

### 3. Rollback

```bash
# Voltar para commit anterior
git revert HEAD
git push origin main

# Ou fazer checkout de versão específica
git checkout <commit-hash>
git push origin main --force
```

## 🎯 Checklist de Deploy

- [ ] Repositório configurado no Easypanel
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio configurado
- [ ] SSL habilitado
- [ ] Build bem-sucedido
- [ ] Container rodando
- [ ] Aplicação respondendo
- [ ] Funcionalidades testadas
- [ ] Logs configurados
- [ ] Monitoramento ativo

## 📞 Suporte

### 1. Logs do Easypanel
- Acesse a aba "Logs" no projeto
- Verifique erros de build e runtime

### 2. Documentação
- [Easypanel Docs](https://docs.easypanel.io/)
- [Docker Docs](https://docs.docker.com/)

### 3. Comunidade
- GitHub Issues do projeto
- Fóruns do Easypanel

---

**🎉 Parabéns! Sua aplicação Wedding RSVP está rodando no Easypanel!**
