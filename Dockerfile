# Usar Node.js 18 LTS
FROM node:18-alpine

# Instalar dependências necessárias
RUN apk add --no-cache sqlite

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação (excluindo banco de dados e uploads)
COPY server.js ./
COPY database.js ./
COPY public/ ./public/
COPY exports/ ./exports/

# Criar diretórios necessários
RUN mkdir -p public/uploads
RUN mkdir -p data

# Criar script de inicialização de forma mais robusta
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Checking database..."' >> /app/start.sh && \
    echo 'if [ ! -f /app/wedding_rsvp.db ]; then' >> /app/start.sh && \
    echo '    echo "Database not found, creating new one..."' >> /app/start.sh && \
    echo '    sqlite3 /app/wedding_rsvp.db "CREATE TABLE IF NOT EXISTS weddings (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, location TEXT NOT NULL, description TEXT, slug TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);"' >> /app/start.sh && \
    echo '    sqlite3 /app/wedding_rsvp.db "CREATE TABLE IF NOT EXISTS guests (id INTEGER PRIMARY KEY AUTOINCREMENT, wedding_slug TEXT NOT NULL, name TEXT NOT NULL, adults INTEGER NOT NULL, adults_names TEXT, children INTEGER NOT NULL, children_details TEXT, confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (wedding_slug) REFERENCES weddings (slug));"' >> /app/start.sh && \
    echo '    sqlite3 /app/wedding_rsvp.db "CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);"' >> /app/start.sh && \
    echo '    echo "Database created successfully!"' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '    echo "Database found, using existing one..."' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh

# Tornar o script executável
RUN chmod +x /app/start.sh

# Verificar se o script foi criado corretamente
RUN ls -la /app/start.sh && cat /app/start.sh

# Expor porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["/app/start.sh"]
