# 🔧 Correções Finais - Erros 500 e Persistência de Dados

## 🎯 Problemas Identificados e Corrigidos

### ❌ **Problema 1: Inconsistência entre `wedding_id` e `wedding_slug`**
- **Causa:** Funções misturavam o uso de `wedding_id` e `wedding_slug`
- **Impacto:** Erros 500 ao tentar buscar convidados e estatísticas
- **Solução:** Padronização para usar `wedding_slug` em todas as queries

### ❌ **Problema 2: Schema da tabela `guests` incorreto**
- **Causa:** Tabela criada com estrutura inconsistente
- **Impacto:** Falha ao inserir e buscar convidados
- **Solução:** Estrutura corrigida com ambas as colunas (`wedding_id` e `wedding_slug`)

### ❌ **Problema 3: Funções do banco usando parâmetros incorretos**
- **Causa:** `getGuestsByWedding`, `getStatsByWedding`, `checkPhoneExists` usando IDs
- **Impacto:** Queries falhando e retornando erros 500
- **Solução:** Todas as funções agora usam `wedding_slug`

## ✅ **Correções Implementadas**

### 1. **Funções do Banco Corrigidas**

#### `getGuestsByWedding(slug)`
```javascript
// ANTES: WHERE wedding_id = ?
// DEPOIS: WHERE wedding_slug = ?
db.all('SELECT * FROM guests WHERE wedding_slug = ? ORDER BY created_at DESC', [weddingSlug], ...)
```

#### `getStatsByWedding(slug)`
```javascript
// ANTES: WHERE wedding_id = ?
// DEPOIS: WHERE wedding_slug = ?
db.all('SELECT children_details FROM guests WHERE wedding_slug = ? AND children_details IS NOT NULL', [weddingSlug], ...)
db.get('SELECT COUNT(*) as total_confirmations, ... FROM guests WHERE wedding_slug = ?', [weddingSlug], ...)
```

#### `checkPhoneExists(slug, phone)`
```javascript
// ANTES: WHERE wedding_id = ? AND phone = ?
// DEPOIS: WHERE wedding_slug = ? AND phone = ?
db.get('SELECT id, name FROM guests WHERE wedding_slug = ? AND phone = ?', [weddingSlug, phone], ...)
```

#### `insertGuest(guestData)`
```javascript
// ANTES: INSERT INTO guests (wedding_id, ...)
// DEPOIS: INSERT INTO guests (wedding_slug, ...)
db.run('INSERT INTO guests (wedding_slug, name, adults, children, adults_names, children_details, phone) VALUES (?, ?, ?, ?, ?, ?, ?)', [wedding_slug, name, adults, children, adultsNamesJson, childrenDetailsJson, phone], ...)
```

### 2. **Server.js Atualizado**

#### Rotas corrigidas:
```javascript
// ANTES: const guests = await guestOperations.getGuestsByWedding(wedding.id);
// DEPOIS: const guests = await guestOperations.getGuestsByWedding(slug);

// ANTES: const existingGuest = await guestOperations.checkPhoneExists(wedding.id, phone);
// DEPOIS: const existingGuest = await guestOperations.checkPhoneExists(slug, phone);

// ANTES: wedding_id: wedding.id
// DEPOIS: wedding_slug: slug

// ANTES: if (guest.wedding_id !== wedding.id)
// DEPOIS: if (guest.wedding_slug !== slug)
```

### 3. **Dockerfile Otimizado**

#### Script de inicialização robusto:
```bash
# Cria tabela com estrutura correta
CREATE TABLE guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wedding_id INTEGER,                    -- Para foreign key
    wedding_slug TEXT NOT NULL,            -- Para queries diretas
    name TEXT NOT NULL,
    adults INTEGER NOT NULL,
    adults_names TEXT,
    children INTEGER NOT NULL,
    children_details TEXT,
    phone TEXT,
    confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wedding_id) REFERENCES weddings (id)
);

# Migração automática de colunas faltantes
ALTER TABLE guests ADD COLUMN wedding_id INTEGER;
ALTER TABLE guests ADD COLUMN phone TEXT;
ALTER TABLE guests ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
```

## 🚀 **Como Aplicar as Correções**

### Passo 1: Fazer Commit das Alterações
```bash
git add .
git commit -m "Fix: Corrigir inconsistências wedding_id/wedding_slug e erros 500"
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

## 🔍 **Estrutura Final das Tabelas**

### Tabela `weddings`:
```sql
CREATE TABLE weddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bride_name TEXT NOT NULL,
    groom_name TEXT NOT NULL,
    wedding_date TEXT,
    wedding_time TEXT,
    venue_address TEXT,
    venue_name TEXT,
    additional_info TEXT,
    header_image TEXT,
    header_text TEXT,
    color_scheme TEXT DEFAULT 'marsala',
    background_color TEXT DEFAULT '#9c2851',
    text_color TEXT DEFAULT '#ffffff',
    accent_color TEXT DEFAULT '#d4af37',
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `guests`:
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

## 📋 **Checklist de Verificação**

### Antes do Deploy
- [ ] Todas as funções do banco corrigidas para usar `wedding_slug`
- [ ] Server.js atualizado com chamadas corretas
- [ ] Dockerfile com script de inicialização robusto
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
- [ ] RSVP funciona corretamente

## 🎯 **Resultado Esperado**

**ANTES:** ❌ Erros 500 em múltiplas rotas
**DEPOIS:** ✅ Todas as funcionalidades funcionando

- ✅ Dashboard admin carrega normalmente
- ✅ Lista de casamentos é exibida
- ✅ Lista de convidados carrega
- ✅ Estatísticas são calculadas
- ✅ RSVP funciona corretamente
- ✅ Dados são persistidos entre deploys

## 🚨 **Troubleshooting**

### Se os erros persistirem:
1. ✅ Verifique os logs do Easypanel
2. ✅ Confirme que está usando `easypanel-compose.yml`
3. ✅ Verifique se o novo deploy foi aplicado
4. ✅ Confirme que o banco foi criado corretamente
5. ✅ Verifique se todas as colunas foram criadas
6. ✅ Confirme que as funções estão usando `wedding_slug`

---

**🎉 Com essas correções finais, todos os erros 500 devem ser resolvidos e o sistema deve funcionar perfeitamente!**
