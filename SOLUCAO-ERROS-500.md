# 🚨 Solução para Erros 500 - Internal Server Error

## 🔍 Problemas Identificados

### Erro 1: Dashboard Admin
**Erro:** `GET /api/admin/weddings 500 (Internal Server Error)`

### Erro 2: Lista de Convidados
**Erro:** `GET /api/admin/wedding/:slug/guests 500 (Internal Server Error)`

## 🎯 Causa Raiz

**Problema Principal:** Inconsistência entre o schema da tabela e as queries do banco de dados.

**Detalhes:**
1. ❌ **Tabela `guests`** estava sendo criada com estrutura incorreta
2. ❌ **Funções** estavam misturando `wedding_id` e `wedding_slug`
3. ❌ **Schema** não incluía todas as colunas necessárias
4. ❌ **Migração** não estava funcionando corretamente

## ✅ Soluções Implementadas

### 1. Dockerfile Completamente Corrigido

- ✅ **Schema correto** para todas as tabelas
- ✅ **Colunas necessárias** incluídas desde o início
- ✅ **Migração automática** para bancos existentes
- ✅ **Script de inicialização** robusto e confiável

### 2. Estrutura da Tabela `guests` Corrigida

```sql
CREATE TABLE guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wedding_id INTEGER,                    -- Referência para foreign key
    wedding_slug TEXT NOT NULL,            -- Slug para queries diretas
    name TEXT NOT NULL,
    adults INTEGER NOT NULL,
    adults_names TEXT,                     -- JSON array
    children INTEGER NOT NULL,
    children_details TEXT,                 -- JSON array
    phone TEXT,
    confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wedding_id) REFERENCES weddings (id)
);
```

### 3. Funções do Banco Corrigidas

- ✅ **`getGuestsByWedding(slug)`** - Usa `wedding_slug`
- ✅ **`getStatsByWedding(slug)`** - Usa `wedding_slug`
- ✅ **Logs melhorados** para debugging
- ✅ **Tratamento de erros** robusto

### 4. Server.js Atualizado

- ✅ **Chamadas corrigidas** para usar slug em vez de ID
- ✅ **Consistência** entre todas as rotas
- ✅ **Validação** adequada dos parâmetros

## 🚀 Como Aplicar a Solução

### Passo 1: Fazer Commit das Alterações

```bash
git add .
git commit -m "Fix: Corrigir erros 500 e inconsistências do banco de dados"
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
Column wedding_id already exists
Column phone already exists
Column created_at already exists
Schema updated successfully!
Starting application...
```

## 🔧 Colunas Adicionadas Automaticamente

### Tabela `weddings`:
- `is_active` - Status ativo/inativo
- `color_scheme` - Esquema de cores
- `background_color` - Cor de fundo
- `text_color` - Cor do texto
- `accent_color` - Cor de destaque
- `header_image` - Imagem de cabeçalho
- `header_text` - Texto do cabeçalho

### Tabela `guests`:
- `wedding_id` - Referência para foreign key
- `phone` - Número de telefone
- `created_at` - Data de criação

## 🚨 Troubleshooting

### Se os erros persistirem:

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
- [ ] Funções do banco corrigidas
- [ ] Server.js atualizado
- [ ] Commit e push realizados

### Durante o Deploy
- [ ] Container inicia sem erros
- [ ] Script start.sh executa
- [ ] Banco de dados é criado/verificado
- [ ] Schema é migrado automaticamente
- [ ] Todas as colunas são criadas

### Após o Deploy
- [ ] Aplicação responde na porta 3000
- [ ] Health check passa
- [ ] Rota `/api/admin/weddings` funciona
- [ ] Rota `/api/admin/wedding/:slug/guests` funciona
- [ ] Dashboard admin carrega sem erros
- [ ] Lista de convidados carrega sem erros

## 🎯 Resultado Esperado

**ANTES:** ❌ Erros 500 em múltiplas rotas
**DEPOS:** ✅ Todas as funcionalidades funcionando

- ✅ Dashboard admin carrega normalmente
- ✅ Lista de casamentos é exibida
- ✅ Lista de convidados carrega
- ✅ Estatísticas são calculadas
- ✅ Dados são persistidos corretamente

## 📞 Suporte

Se os problemas persistirem após aplicar estas correções:

1. ✅ Verifique os logs do Easypanel
2. ✅ Confirme que está usando `easypanel-compose.yml`
3. ✅ Verifique se o novo deploy foi aplicado
4. ✅ Confirme que o banco foi criado corretamente
5. ✅ Verifique se todas as colunas foram criadas

---

**🎉 Com essas correções, todos os erros 500 devem ser resolvidos e o sistema deve funcionar perfeitamente!**
