#!/bin/bash

echo "🚀 Iniciando deploy da aplicação Wedding RSVP..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker e tente novamente."
    exit 1
fi

# Parar e remover containers existentes
echo "🔄 Parando containers existentes..."
docker-compose down

# Remover imagens antigas
echo "🧹 Removendo imagens antigas..."
docker system prune -f

# Fazer build da nova imagem
echo "🔨 Fazendo build da aplicação..."
docker-compose build --no-cache

# Iniciar a aplicação
echo "🚀 Iniciando a aplicação..."
docker-compose up -d

# Aguardar a aplicação inicializar
echo "⏳ Aguardando a aplicação inicializar..."
sleep 10

# Verificar status
echo "📊 Verificando status da aplicação..."
docker-compose ps

# Verificar logs
echo "📝 Últimos logs da aplicação:"
docker-compose logs --tail=20

echo "✅ Deploy concluído!"
echo "🌐 A aplicação está rodando em: http://localhost:3000"
echo "📱 Dashboard admin: http://localhost:3000/admin"
echo "🔗 Para parar: docker-compose down"
echo "🔍 Para ver logs: docker-compose logs -f"
