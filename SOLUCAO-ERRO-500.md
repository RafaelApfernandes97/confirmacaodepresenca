# 🚨 Solução para Erro 500 - Internal Server Error

## 🔍 Problema Identificado

**Erro:** `GET https://minio-site.cbltmp.easypanel.host/api/admin/weddings 500 (Internal Server Error)`

**Causa:** O banco de dados não está sendo inicializado corretamente ou está faltando colunas necessárias na tabela `weddings`.

## ✅ Soluções Implementadas

### 1. Dockerfile Corrigido

O Dockerfile foi atualizado para:
- ✅ Criar o banco com todas as colunas necessárias
- ✅ Verificar e adicionar colunas faltantes automaticamente
- ✅ Incluir migração de schema durante a inicialização

### 2. Script de Inicialização Robusto

O script `start.sh` agora:
- ✅ Verifica se o banco existe
- ✅ Cria um novo banco se necessário
- ✅ Adiciona colunas faltantes automaticamente
- ✅ Trata erros de forma silenciosa

## 🚀 Como Aplicar a Solução

### Passo 1: Fazer Commit das Alterações

```bash
git add .
git commit -m "Fix: Corrigir erro 500 e migração de banco de dados"
git push origin main
```

### Passo 2: No Easypanel

1. **Usar o arquivo correto:** `easypanel-compose.yml`
2. **Fazer novo deploy** para aplicar as correções
3. **Verificar logs** para confirmar que o banco foi criado corretamente

### Passo 3: Verificar Logs

No Easypanel, verifique os logs para confirmar:
```
Checking database...
Database found, checking schema...
Column is_active already exists
Column color_scheme already exists
...
Schema updated successfully!
Starting application...
```

## 🔧 Colunas Adicionadas Automaticamente

O script agora adiciona automaticamente estas colunas se não existirem:

- `is_active` - Status ativo/inativo do casamento
- `color_scheme` - Esquema de cores
- `background_color` - Cor de fundo
- `text_color` - Cor do texto
- `accent_color` - Cor de destaque
- `header_image` - Imagem de cabeçalho
- `header_text` - Texto do cabeçalho

## 🚨 Troubleshooting

### Se o erro persistir:

1. **Verificar logs do container:**
   ```bash
   # No Easypanel, aba Logs
   # Procurar por mensagens de erro de banco
   ```

2. **Verificar se o banco foi criado:**
   ```bash
   # No servidor Easypanel
   ls -la /var/lib/easypanel/data/wedding-rsvp/database
   ```

3. **Verificar permissões:**
   ```bash
   # No servidor Easypanel
   sudo chown -R 1000:1000 /var/lib/easypanel/data/wedding-rsvp/
   sudo chmod -R 755 /var/lib/easypanel/data/wedding-rsvp/
   ```

### Problemas Comuns:

1. **Banco não encontrado:**
   - Verificar se o volume está montado corretamente
   - Verificar se o diretório existe no servidor

2. **Permissões negadas:**
   - Verificar permissões do diretório de dados
   - Verificar se o usuário do container tem acesso

3. **Schema incompatível:**
   - O script agora corrige automaticamente
   - Verificar logs para confirmar migração

## 📋 Checklist de Verificação

### Antes do Deploy
- [ ] Dockerfile atualizado
- [ ] Script start.sh corrigido
- [ ] Commit e push realizados

### Durante o Deploy
- [ ] Container inicia sem erros
- [ ] Script start.sh executa
- [ ] Banco de dados é criado/verificado
- [ ] Schema é migrado automaticamente

### Após o Deploy
- [ ] Aplicação responde na porta 3000
- [ ] Health check passa
- [ ] Rota `/api/admin/weddings` funciona
- [ ] Dashboard admin carrega sem erros

## 🎯 Resultado Esperado

**ANTES:** ❌ Erro 500 ao acessar `/api/admin/weddings`
**DEPOIS:** ✅ Dashboard admin carrega normalmente

- ✅ Lista de casamentos carrega
- ✅ Estatísticas são exibidas
- ✅ Funcionalidades admin funcionam
- ✅ Dados são persistidos corretamente

## 📞 Suporte

Se o problema persistir após aplicar estas correções:

1. ✅ Verifique os logs do Easypanel
2. ✅ Confirme que está usando `easypanel-compose.yml`
3. ✅ Verifique se o novo deploy foi aplicado
4. ✅ Confirme que o banco foi criado corretamente

---

**🎉 Com essas correções, o erro 500 deve ser resolvido e o dashboard admin deve funcionar normalmente!**
