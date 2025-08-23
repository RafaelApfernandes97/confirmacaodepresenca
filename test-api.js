const axios = require('axios');

// Testar a API de casamentos
async function testWeddingsAPI() {
    try {
        console.log('🧪 Testando API de casamentos...');
        
        // Testar endpoint público de health
        console.log('\n1. Testando health check...');
        const healthResponse = await axios.get('http://localhost:3000/health');
        console.log('✅ Health check:', healthResponse.data);
        
        // Testar endpoint de casamentos (deve retornar 401 se não autenticado)
        console.log('\n2. Testando endpoint de casamentos sem autenticação...');
        try {
            const weddingsResponse = await axios.get('http://localhost:3000/api/admin/weddings');
            console.log('❌ Erro: Endpoint retornou dados sem autenticação:', weddingsResponse.data);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Endpoint protegido corretamente (401 Unauthorized)');
            } else {
                console.log('❌ Erro inesperado:', error.message);
            }
        }
        
        // Testar endpoint público de casamento por slug
        console.log('\n3. Testando endpoint público de casamento...');
        try {
            const publicResponse = await axios.get('http://localhost:3000/api/wedding/test-slug');
            console.log('✅ Endpoint público funcionando:', publicResponse.status);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Endpoint público funcionando (404 esperado para slug inexistente)');
            } else {
                console.log('❌ Erro no endpoint público:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral nos testes:', error.message);
    }
}

// Testar conexão com MongoDB
async function testMongoConnection() {
    try {
        console.log('\n🗄️  Testando conexão com MongoDB...');
        
        // Importar configuração do banco
        const { connectToMongoDB, mongoose } = require('./config/database');
        
        // Tentar conectar
        await connectToMongoDB();
        
        // Verificar status da conexão
        console.log('✅ Status da conexão:', mongoose.connection.readyState);
        console.log('📊 Nome do banco:', mongoose.connection.db.databaseName);
        
        // Listar coleções
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Coleções encontradas:', collections.map(c => c.name));
        
        // Verificar se há dados na coleção weddings
        if (collections.some(c => c.name === 'weddings')) {
            const Wedding = require('./models/Wedding');
            const count = await Wedding.countDocuments();
            console.log(`👰🤵 Casamentos no banco: ${count}`);
            
            if (count > 0) {
                const sampleWedding = await Wedding.findOne();
                console.log('📋 Exemplo de casamento:', {
                    id: sampleWedding._id,
                    bride: sampleWedding.bride_name,
                    groom: sampleWedding.groom_name,
                    slug: sampleWedding.slug,
                    active: sampleWedding.is_active
                });
            }
        }
        
        // Fechar conexão
        await mongoose.connection.close();
        console.log('✅ Conexão fechada');
        
    } catch (error) {
        console.error('❌ Erro na conexão MongoDB:', error.message);
    }
}

// Executar testes
async function runTests() {
    console.log('🚀 Iniciando testes da API e banco de dados...\n');
    
    await testWeddingsAPI();
    await testMongoConnection();
    
    console.log('\n✨ Testes concluídos!');
}

// Executar se chamado diretamente
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testWeddingsAPI, testMongoConnection };
