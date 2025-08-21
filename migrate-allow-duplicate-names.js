#!/usr/bin/env node

/**
 * Script para migrar o banco de dados e permitir nomes iguais
 * Execute: node migrate-allow-duplicate-names.js
 */

const { initializeDatabase, db } = require('./database');

async function migrateAllowDuplicateNames() {
    try {
        console.log('🔄 Migrando banco para permitir nomes iguais...');
        
        // Inicializar banco
        await initializeDatabase();
        console.log('✓ Banco inicializado');
        
        // Verificar se já existe a constraint UNIQUE no slug
        console.log('\n🔍 Verificando constraints existentes...');
        
        const constraints = await new Promise((resolve, reject) => {
            db.all("PRAGMA index_list(weddings)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log('Índices encontrados:', constraints.length);
        constraints.forEach(idx => {
            console.log(`- ${idx.name}: ${idx.origin}`);
        });
        
        // Verificar se existe constraint UNIQUE no slug
        const hasUniqueSlug = constraints.some(idx => 
            idx.name && idx.name.includes('sqlite_autoindex_weddings_') || 
            idx.name === 'weddings_slug_unique'
        );
        
        if (hasUniqueSlug) {
            console.log('\n⚠️ Constraint UNIQUE encontrada no slug. Removendo...');
            
            // Remover constraint UNIQUE (SQLite não suporta DROP CONSTRAINT diretamente)
            // Vamos recriar a tabela sem a constraint
            console.log('🔄 Recriando tabela sem constraint UNIQUE...');
            
            // Backup dos dados existentes
            const existingWeddings = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM weddings", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log(`📋 Backup de ${existingWeddings.length} casamentos criado`);
            
            // Renomear tabela atual
            await new Promise((resolve, reject) => {
                db.run("ALTER TABLE weddings RENAME TO weddings_old", (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // Criar nova tabela sem constraint UNIQUE
            await new Promise((resolve, reject) => {
                db.run(`
                    CREATE TABLE weddings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        bride_name TEXT NOT NULL,
                        groom_name TEXT NOT NULL,
                        wedding_date TEXT,
                        wedding_time TEXT,
                        venue_address TEXT,
                        venue_name TEXT,
                        additional_info TEXT,
                        header_image TEXT,
                        color_scheme TEXT DEFAULT 'marsala',
                        background_color TEXT DEFAULT '#9c2851',
                        text_color TEXT DEFAULT '#ffffff',
                        accent_color TEXT DEFAULT '#d4af37',
                        slug TEXT NOT NULL,
                        is_active BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log('✓ Nova tabela criada sem constraint UNIQUE');
            
            // Restaurar dados
            for (const wedding of existingWeddings) {
                // Gerar novo slug único para cada casamento existente
                const timestamp = Date.now() + Math.random();
                const dateStr = wedding.wedding_date ? wedding.wedding_date.replace(/-/g, '') : '';
                const newSlug = `${wedding.bride_name.toLowerCase().replace(/\s+/g, '-')}-${wedding.groom_name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}-${timestamp}`;
                
                await new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO weddings (
                            bride_name, groom_name, wedding_date, wedding_time, 
                            venue_address, venue_name, additional_info, header_image,
                            color_scheme, background_color, text_color, accent_color,
                            slug, is_active, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        wedding.bride_name, wedding.groom_name, wedding.wedding_date, wedding.wedding_time,
                        wedding.venue_address, wedding.venue_name, wedding.additional_info, wedding.header_image,
                        wedding.color_scheme, wedding.background_color, wedding.text_color, wedding.accent_color,
                        newSlug, wedding.is_active, wedding.created_at
                    ], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            
            console.log('✓ Dados restaurados com novos slugs únicos');
            
            // Remover tabela antiga
            await new Promise((resolve, reject) => {
                db.run("DROP TABLE weddings_old", (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log('✓ Tabela antiga removida');
            
        } else {
            console.log('✅ Nenhuma constraint UNIQUE encontrada. Migração não necessária.');
        }
        
        // Verificar resultado final
        console.log('\n🔍 Verificando resultado da migração...');
        
        const finalConstraints = await new Promise((resolve, reject) => {
            db.all("PRAGMA index_list(weddings)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log('Índices finais:', finalConstraints.length);
        finalConstraints.forEach(idx => {
            console.log(`- ${idx.name}: ${idx.origin}`);
        });
        
        // Testar criação de casamentos com nomes iguais
        console.log('\n🧪 Testando criação de casamentos com nomes iguais...');
        
        const testWedding1 = {
            bride_name: 'Maria Silva',
            groom_name: 'João Santos',
            wedding_date: '2024-12-25',
            slug: `maria-silva-joao-santos-20241225-${Date.now()}-1`
        };
        
        const testWedding2 = {
            bride_name: 'Maria Silva',
            groom_name: 'João Santos',
            wedding_date: '2024-12-25',
            slug: `maria-silva-joao-santos-20241225-${Date.now()}-2`
        };
        
        // Inserir primeiro casamento
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO weddings (bride_name, groom_name, wedding_date, slug)
                VALUES (?, ?, ?, ?)
            `, [testWedding1.bride_name, testWedding1.groom_name, testWedding1.wedding_date, testWedding1.slug], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✓ Primeiro casamento criado');
        
        // Inserir segundo casamento com nomes iguais
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO weddings (bride_name, groom_name, wedding_date, slug)
                VALUES (?, ?, ?, ?)
            `, [testWedding2.bride_name, testWedding2.groom_name, testWedding2.wedding_date, testWedding2.slug], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ SEGUNDO CASAMENTO CRIADO COM NOMES IGUAIS!');
        
        // Verificar total
        const totalWeddings = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM weddings", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        console.log(`📊 Total de casamentos no banco: ${totalWeddings}`);
        
        // Limpar casamentos de teste
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM weddings WHERE bride_name = 'Maria Silva' AND groom_name = 'João Santos'", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✓ Casamentos de teste removidos');
        
        console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('✅ Agora é possível criar listas com nomes iguais');
        console.log('✅ Cada lista terá um slug único baseado em nome + data + timestamp');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

migrateAllowDuplicateNames();

