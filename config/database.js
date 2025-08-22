const mongoose = require('mongoose');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin@164.68.109.41:3080/?tls=false';

// Opções de conexão
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'wedding_rsvp', // Nome do banco de dados
    maxPoolSize: 10, // Máximo de conexões no pool
    serverSelectionTimeoutMS: 5000, // Timeout para seleção do servidor
    socketTimeoutMS: 45000, // Timeout para operações de socket
};

// Função para conectar ao MongoDB
async function connectToMongoDB() {
    try {
        await mongoose.connect(MONGODB_URI, options);
        console.log('✅ Conectado ao MongoDB com sucesso!');
        console.log(`📊 Banco: ${mongoose.connection.db.databaseName}`);
        console.log(`🔗 URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`); // Oculta credenciais nos logs
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}

// Eventos de conexão
mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose conectado ao MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 Erro na conexão Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose desconectado do MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ Conexão MongoDB fechada através do app termination');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro ao fechar conexão MongoDB:', err);
        process.exit(1);
    }
});

module.exports = {
    connectToMongoDB,
    mongoose
};
