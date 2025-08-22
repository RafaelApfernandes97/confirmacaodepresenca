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

# Criar script de inicialização
RUN echo '#!/bin/sh\n\
if [ ! -f /app/wedding_rsvp.db ]; then\n\
    echo "Database not found, creating new one..."\n\
    sqlite3 /app/wedding_rsvp.db "CREATE TABLE IF NOT EXISTS weddings (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, location TEXT NOT NULL, description TEXT, slug TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);"\n\
    sqlite3 /app/wedding_rsvp.db "CREATE TABLE IF NOT EXISTS guests (id INTEGER PRIMARY KEY AUTOINCREMENT, wedding_slug TEXT NOT NULL, name TEXT NOT NULL, adults INTEGER NOT NULL, adults_names TEXT, children INTEGER NOT NULL, children_details TEXT, confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (wedding_slug) REFERENCES weddings (slug));"\n\
    sqlite3 /app/wedding_rsvp.db "CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);"\n\
    echo "Database created successfully!"\n\
else\n\
    echo "Database found, using existing one..."\n\
fi\n\
\n\
echo "Starting application..."\n\
exec node server.js' > /app/start.sh

# Tornar o script executável
RUN chmod +x /app/start.sh

# Expor porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["/app/start.sh"]
