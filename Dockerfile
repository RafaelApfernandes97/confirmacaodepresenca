# Usar Node.js 18 LTS
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p public/uploads
RUN mkdir -p exports

# Expor porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
