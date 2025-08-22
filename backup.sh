#!/bin/bash

# Script de Backup para Wedding RSVP
# Execute este script antes de cada deploy para preservar os dados

echo "🔄 Iniciando backup dos dados..."

# Criar diretório de backup se não existir
mkdir -p backups

# Nome do arquivo de backup com timestamp
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"

echo "📦 Criando backup: $BACKUP_NAME"

# Backup do banco de dados
if [ -f "data/wedding_rsvp.db" ]; then
    cp "data/wedding_rsvp.db" "backups/${BACKUP_NAME}_database.db"
    echo "✅ Banco de dados backup criado"
else
    echo "⚠️  Banco de dados não encontrado em data/wedding_rsvp.db"
fi

# Backup dos uploads
if [ -d "data/uploads" ] && [ "$(ls -A data/uploads)" ]; then
    tar -czf "backups/${BACKUP_NAME}_uploads.tar.gz" -C data uploads
    echo "✅ Uploads backup criado"
else
    echo "⚠️  Diretório de uploads vazio ou não encontrado"
fi

# Backup dos exports
if [ -d "exports" ] && [ "$(ls -A exports)" ]; then
    tar -czf "backups/${BACKUP_NAME}_exports.tar.gz" exports
    echo "✅ Exports backup criado"
else
    echo "⚠️  Diretório de exports vazio ou não encontrado"
fi

# Criar arquivo de informações do backup
echo "Backup criado em: $(date)" > "backups/${BACKUP_NAME}_info.txt"
echo "Arquivos incluídos:" >> "backups/${BACKUP_NAME}_info.txt"
ls -la "backups/${BACKUP_NAME}_*" >> "backups/${BACKUP_NAME}_info.txt"

echo "🎉 Backup concluído: $BACKUP_NAME"
echo "📁 Local: backups/$BACKUP_NAME"

# Manter apenas os últimos 5 backups
echo "🧹 Limpando backups antigos..."
cd backups
ls -t | tail -n +6 | xargs -r rm -rf
cd ..

echo "✨ Backup finalizado com sucesso!"
