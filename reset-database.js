#!/usr/bin/env node

/**
 * Script para recriar o banco de dados com a nova estrutura
 * Execute: node reset-database.js
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'wedding_rsvp.db');

console.log('🔄 Recriando banco de dados...');

// Deletar banco existente
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✓ Banco antigo removido');
}

// Importar e inicializar novo banco
const { initializeDatabase } = require('./database');

initializeDatabase()
    .then(() => {
        console.log('✅ Banco de dados recriado com sucesso!');
        console.log('📋 Nova estrutura:');
        console.log('   - Tabela weddings: para gerenciar múltiplas listas de casamentos');
        console.log('   - Tabela guests: vinculada aos casamentos, com nomes individuais');
        console.log('   - Tabela admin_users: com usuário padrão admin/admin123');
        console.log('');
        console.log('🎯 Sistema multi-casamentos ativo!');
        console.log('🚀 Execute: npm start');
        console.log('📱 Acesse: http://localhost:3000/admin');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erro ao recriar banco:', error);
        process.exit(1);
    });

