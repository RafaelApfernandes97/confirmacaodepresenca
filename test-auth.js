const axios = require('axios');

// Configurar axios para incluir cookies
const client = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true
});

async function testAuthFlow() {
    try {
        console.log('🚀 Testando fluxo de autenticação...\n');
        
        // 1. Testar health check
        console.log('1. Health check...');
        const health = await client.get('/health');
        console.log('✅ Health:', health.data.status);
        
        // 2. Tentar acessar casamentos sem login (deve dar 401)
        console.log('\n2. Tentando acessar casamentos sem login...');
        try {
            const weddings = await client.get('/api/admin/weddings');
            console.log('❌ Erro: Acesso permitido sem autenticação');
            return;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Acesso negado corretamente (401)');
            } else {
                console.log('❌ Erro inesperado:', error.message);
                return;
            }
        }
        
        // 3. Fazer login
        console.log('\n3. Fazendo login...');
        const loginResponse = await client.post('/api/admin/login', {
            username: 'admin',
            password: 'admin123'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login realizado com sucesso');
            console.log('📋 Resposta:', loginResponse.data);
        } else {
            console.log('❌ Login falhou:', loginResponse.data.error);
            return;
        }
        
        // 4. Tentar acessar casamentos com login
        console.log('\n4. Acessando casamentos com login...');
        const weddingsResponse = await client.get('/api/admin/weddings');
        
        if (weddingsResponse.status === 200) {
            console.log('✅ Casamentos carregados com sucesso');
            console.log(`📊 Total de casamentos: ${weddingsResponse.data.length}`);
            
            if (weddingsResponse.data.length > 0) {
                console.log('📋 Primeiro casamento:', {
                    id: weddingsResponse.data[0]._id,
                    bride: weddingsResponse.data[0].bride_name,
                    groom: weddingsResponse.data[0].groom_name,
                    slug: weddingsResponse.data[0].slug
                });
            }
        } else {
            console.log('❌ Erro ao carregar casamentos:', weddingsResponse.status);
        }
        
        // 5. Fazer logout
        console.log('\n5. Fazendo logout...');
        const logoutResponse = await client.post('/api/admin/logout');
        
        if (logoutResponse.data.success) {
            console.log('✅ Logout realizado com sucesso');
        } else {
            console.log('❌ Logout falhou:', logoutResponse.data.error);
        }
        
        // 6. Verificar se logout funcionou
        console.log('\n6. Verificando se logout funcionou...');
        try {
            const testResponse = await client.get('/api/admin/weddings');
            console.log('❌ Erro: Ainda consegue acessar após logout');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Logout funcionou corretamente (401)');
            } else {
                console.log('❌ Erro inesperado após logout:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📋 Dados:', error.response.data);
        }
    }
}

// Executar teste
testAuthFlow().then(() => {
    console.log('\n✨ Teste concluído!');
}).catch(console.error);
