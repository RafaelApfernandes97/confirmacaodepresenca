#!/bin/bash

# Script de Deploy para Easypanel - Wedding RSVP
# Este script garante que os dados sejam preservados durante o deploy

echo "🚀 Iniciando deploy para Easypanel..."

# 1. Fazer backup dos dados existentes
echo "📦 Fazendo backup dos dados..."
if [ -f "backup.sh" ]; then
    chmod +x backup.sh
    ./backup.sh
else
    echo "⚠️  Script de backup não encontrado, criando backup manual..."
    mkdir -p backups
    if [ -f "data/wedding_rsvp.db" ]; then
        cp "data/wedding_rsvp.db" "backups/backup_$(date +%Y%m%d_%H%M%S)_database.db"
        echo "✅ Backup do banco criado"
    fi
fi

# 2. Verificar se os diretórios de dados existem
echo "🔍 Verificando estrutura de diretórios..."
if [ ! -d "data" ]; then
    mkdir -p data
    echo "✅ Diretório data criado"
fi

if [ ! -d "data/uploads" ]; then
    mkdir -p data/uploads
    echo "✅ Diretório uploads criado"
fi

# 3. Verificar se o banco de dados existe
if [ ! -f "data/wedding_rsvp.db" ]; then
    echo "⚠️  Banco de dados não encontrado em data/, copiando do diretório raiz..."
    if [ -f "wedding_rsvp.db" ]; then
        cp "wedding_rsvp.db" "data/wedding_rsvp.db"
        echo "✅ Banco de dados copiado para data/"
    else
        echo "❌ Banco de dados não encontrado em lugar nenhum!"
        echo "💡 Será criado um novo banco durante o primeiro deploy"
    fi
fi

# 4. Verificar arquivos de configuração
echo "🔧 Verificando arquivos de configuração..."
if [ ! -f "easypanel-compose.yml" ]; then
    echo "❌ easypanel-compose.yml não encontrado!"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile não encontrado!"
    exit 1
fi

# 5. Preparar para commit
echo "📝 Preparando para commit..."
git add .
git status

echo ""
echo "🎯 PRÓXIMOS PASSOS NO EASYPANEL:"
echo "1. Faça push para o repositório: git push origin main"
echo "2. No Easypanel, use o arquivo: easypanel-compose.yml"
echo "3. Certifique-se de que os volumes estão configurados corretamente"
echo "4. Execute o deploy"
echo ""
echo "📋 CONFIGURAÇÕES IMPORTANTES NO EASYPANEL:"
echo "- Use o arquivo: easypanel-compose.yml"
echo "- Configure as variáveis de ambiente:"
echo "  * SESSION_SECRET=sua-chave-super-secreta"
echo "  * NODE_ENV=production"
echo "  * PORT=3000"
echo ""
echo "💾 PERSISTÊNCIA DE DADOS:"
echo "- Os dados serão salvos em: /var/lib/easypanel/data/wedding-rsvp/"
echo "- Banco: /var/lib/easypanel/data/wedding-rsvp/database"
echo "- Uploads: /var/lib/easypanel/data/wedding-rsvp/uploads"
echo "- Logs: /var/lib/easypanel/data/wedding-rsvp/logs"
echo ""
echo "✅ Deploy preparado com sucesso!"
