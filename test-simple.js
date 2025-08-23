const axios = require('axios');

// Teste simples de sessão
async function testSession() {
    try {
        console.log('🧪 Teste simples de sessão...\n');
        
        // 1. Verificar sessão inicial
        console.log('1. Verificando sessão inicial...');
        const session1 = await axios.get('http://localhost:3000/debug-session');
        console.log('✅ Sessão inicial:', {
            sessionID: session1.data.sessionID,
            hasSession: !!session1.data.session,
            sessionKeys: session1.data.sessionKeys
        });
        
        // 2. Fazer login
        console.log('\n2. Fazendo login...');
        const login = await axios.post('http://localhost:3000/api/admin/login', {
            username: 'admin',
            password: 'admin123'
        }, {
            withCredentials: true
        });
        
        if (login.data.success) {
            console.log('✅ Login realizado');
        } else {
            console.log('❌ Login falhou:', login.data.error);
            return;
        }
        
        // 3. Verificar sessão após login
        console.log('\n3. Verificando sessão após login...');
        const session2 = await axios.get('http://localhost:3000/debug-session', {
            withCredentials: true
        });
        console.log('✅ Sessão após login:', {
            sessionID: session2.data.sessionID,
            hasSession: !!session2.data.session,
            sessionKeys: session2.data.sessionKeys,
            adminId: session2.data.session?.adminId,
            adminUsername: session2.data.session?.adminUsername
        });
        
        // 4. Tentar acessar casamentos
        console.log('\n4. Tentando acessar casamentos...');
        try {
            const weddings = await axios.get('http://localhost:3000/api/admin/weddings', {
                withCredentials: true
            });
            console.log('✅ Casamentos carregados:', weddings.data.length);
        } catch (error) {
            console.log('❌ Erro ao carregar casamentos:', error.response?.status, error.response?.data);
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
testSession().then(() => {
    console.log('\n✨ Teste concluído!');
}).catch(console.error);
