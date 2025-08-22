const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Criar/conectar ao banco de dados
const dbPath = path.join(__dirname, 'wedding_rsvp.db');
const db = new sqlite3.Database(dbPath);

// Inicializar tabelas
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Habilitar foreign keys
            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) {
                    console.error('Erro ao habilitar foreign keys:', err);
                } else {
                    console.log('✓ Foreign keys habilitadas');
                }
            });

            // Tabela de casamentos/listas
            db.run(`
                CREATE TABLE IF NOT EXISTS weddings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bride_name TEXT NOT NULL,
                    groom_name TEXT NOT NULL,
                    wedding_date TEXT,
                    wedding_time TEXT,
                    venue_address TEXT,
                    venue_name TEXT,
                    additional_info TEXT,
                    header_image TEXT, -- caminho para imagem de cabeçalho
                    header_text TEXT, -- texto formatado do cabeçalho
                    color_scheme TEXT DEFAULT 'marsala', -- esquema de cores (marsala, blue, green, etc)
                    background_color TEXT DEFAULT '#9c2851', -- cor de fundo personalizada
                    text_color TEXT DEFAULT '#ffffff', -- cor do texto personalizada
                    accent_color TEXT DEFAULT '#d4af37', -- cor de destaque personalizada
                    slug TEXT UNIQUE NOT NULL, -- URL amigável (ex: kawanne-pedro-2024-12-25)
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Erro ao criar tabela weddings:', err);
                    reject(err);
                } else {
                    console.log('✓ Tabela weddings criada/verificada');
                }
            });

            // Tabela de convidados (agora vinculada a um casamento)
            db.run(`
                CREATE TABLE IF NOT EXISTS guests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wedding_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    adults INTEGER NOT NULL DEFAULT 0,
                    children INTEGER NOT NULL DEFAULT 0,
                    adults_names TEXT, -- JSON array com nomes dos adultos
                    children_details TEXT, -- JSON array com {name, over6: boolean}
                    phone TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (wedding_id) REFERENCES weddings (id),
                    UNIQUE(wedding_id, phone) -- Telefone único por casamento
                )
            `, (err) => {
                if (err) {
                    console.error('Erro ao criar tabela guests:', err);
                    reject(err);
                } else {
                    console.log('✓ Tabela guests criada/verificada');
                    // Verificar e adicionar novas colunas se necessário
                    migrateDatabaseSchema().then(() => {
                        console.log('✓ Migração de schema concluída');
                    }).catch(migrateErr => {
                        console.error('Erro na migração:', migrateErr);
                    });
                }
            });

            // Tabela de usuários da assessoria (para login)
            db.run(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Erro ao criar tabela admin_users:', err);
                    reject(err);
                } else {
                    console.log('✓ Tabela admin_users criada/verificada');
                    
                    // Criar usuário padrão se não existir
                    createDefaultAdmin().then(() => {
                        resolve();
                    }).catch(reject);
                }
            });
        });
    });
}

// Função para migração do schema do banco
function migrateDatabaseSchema() {
    return new Promise((resolve, reject) => {
        // Migrar tabela guests
        db.all("PRAGMA table_info(guests)", (err, guestColumns) => {
            if (err) {
                reject(err);
                return;
            }
            
            const guestColumnNames = guestColumns.map(col => col.name);
            const hasAdultsNames = guestColumnNames.includes('adults_names');
            const hasChildrenDetails = guestColumnNames.includes('children_details');
            const hasWeddingId = guestColumnNames.includes('wedding_id');
            
            let guestMigrations = [];
            
            // Adicionar colunas de guests
            if (!hasAdultsNames) {
                guestMigrations.push(new Promise((resolveAdd, rejectAdd) => {
                    db.run("ALTER TABLE guests ADD COLUMN adults_names TEXT", (err) => {
                        if (err) {
                            console.error('Erro ao adicionar coluna adults_names:', err);
                            rejectAdd(err);
                        } else {
                            console.log('✓ Coluna adults_names adicionada');
                            resolveAdd();
                        }
                    });
                }));
            }
            
            if (!hasChildrenDetails) {
                guestMigrations.push(new Promise((resolveAdd, rejectAdd) => {
                    db.run("ALTER TABLE guests ADD COLUMN children_details TEXT", (err) => {
                        if (err) {
                            console.error('Erro ao adicionar coluna children_details:', err);
                            rejectAdd(err);
                        } else {
                            console.log('✓ Coluna children_details adicionada');
                            resolveAdd();
                        }
                    });
                }));
            }

            if (!hasWeddingId) {
                guestMigrations.push(new Promise((resolveAdd, rejectAdd) => {
                    db.run("ALTER TABLE guests ADD COLUMN wedding_id INTEGER", (err) => {
                        if (err) {
                            console.error('Erro ao adicionar coluna wedding_id:', err);
                            rejectAdd(err);
                        } else {
                            console.log('✓ Coluna wedding_id adicionada');
                            resolveAdd();
                        }
                    });
                }));
            }

            // Migrar tabela weddings
            db.all("PRAGMA table_info(weddings)", (err, weddingColumns) => {
                if (err) {
                    console.log('Tabela weddings não existe ainda, será criada');
                    weddingColumns = [];
                }
                
                const weddingColumnNames = weddingColumns.map(col => col.name);
                let weddingMigrations = [];
                
                // Adicionar novas colunas de customização se não existirem
                const newColumns = [
                    { name: 'header_image', type: 'TEXT' },
                    { name: 'header_text', type: 'TEXT' },
                    { name: 'color_scheme', type: 'TEXT DEFAULT "marsala"' },
                    { name: 'background_color', type: 'TEXT DEFAULT "#9c2851"' },
                    { name: 'text_color', type: 'TEXT DEFAULT "#ffffff"' },
                    { name: 'accent_color', type: 'TEXT DEFAULT "#d4af37"' }
                ];

                newColumns.forEach(column => {
                    if (!weddingColumnNames.includes(column.name)) {
                        weddingMigrations.push(new Promise((resolveAdd, rejectAdd) => {
                            db.run(`ALTER TABLE weddings ADD COLUMN ${column.name} ${column.type}`, (err) => {
                                if (err) {
                                    console.error(`Erro ao adicionar coluna ${column.name}:`, err);
                                    rejectAdd(err);
                                } else {
                                    console.log(`✓ Coluna ${column.name} adicionada`);
                                    resolveAdd();
                                }
                            });
                        }));
                    }
                });
                
                // Executar todas as migrações
                const allMigrations = [...guestMigrations, ...weddingMigrations];
                if (allMigrations.length > 0) {
                    Promise.all(allMigrations)
                        .then(() => {
                            console.log('✓ Todas as migrações concluídas');
                            resolve();
                        })
                        .catch(reject);
                } else {
                    console.log('✓ Schema já está atualizado');
                    resolve();
                }
            });
        });
    });
}

// Criar usuário admin padrão
async function createDefaultAdmin() {
    const bcrypt = require('bcrypt');
    const defaultUsername = 'admin';
    const defaultPassword = 'admin123'; // Senha padrão - deve ser alterada em produção
    
    return new Promise((resolve, reject) => {
        // Verificar se já existe um admin
        db.get('SELECT id FROM admin_users WHERE username = ?', [defaultUsername], async (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!row) {
                // Criar hash da senha
                try {
                    const passwordHash = await bcrypt.hash(defaultPassword, 10);
                    
                    db.run(
                        'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
                        [defaultUsername, passwordHash],
                        function(err) {
                            if (err) {
                                console.error('Erro ao criar usuário admin:', err);
                                reject(err);
                            } else {
                                console.log('✓ Usuário admin padrão criado (admin/admin123)');
                                resolve();
                            }
                        }
                    );
                } catch (error) {
                    reject(error);
                }
            } else {
                console.log('✓ Usuário admin já existe');
                resolve();
            }
        });
    });
}

// Funções para manipular casamentos
const weddingOperations = {
    // Criar novo casamento
    createWedding: (weddingData) => {
        return new Promise((resolve, reject) => {
            const { 
                bride_name, groom_name, wedding_date, wedding_time, venue_address, venue_name, 
                additional_info, header_image, header_text, slug, color_scheme, background_color, text_color, accent_color 
            } = weddingData;
            
            // Se não foi fornecido um slug, gerar um automático
            let finalSlug = slug;
            if (!finalSlug) {
                const timestamp = Date.now();
                const dateStr = wedding_date ? wedding_date.replace(/-/g, '') : '';
                finalSlug = `${bride_name.toLowerCase().replace(/\s+/g, '-')}-${groom_name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}-${timestamp}`;
            }
            
            console.log('🎨 Criando casamento com cores:', { color_scheme, background_color, text_color, accent_color });
            
            db.run(
                `INSERT INTO weddings (
                    bride_name, groom_name, wedding_date, wedding_time, venue_address, venue_name, 
                    additional_info, header_image, header_text, slug, color_scheme, background_color, text_color, accent_color
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [bride_name, groom_name, wedding_date, wedding_time, venue_address, venue_name, 
                 additional_info, header_image, header_text, finalSlug, color_scheme, background_color, text_color, accent_color],
                function(err) {
                    if (err) {
                        console.error('❌ Erro ao criar casamento:', err);
                        reject(err);
                    } else {
                        console.log('✅ Casamento criado com sucesso, ID:', this.lastID);
                        resolve({ id: this.lastID, ...weddingData, slug: finalSlug });
                    }
                }
            );
        });
    },

    // Buscar todos os casamentos
    getAllWeddings: () => {
        return new Promise((resolve, reject) => {
            console.log('🔍 Buscando todos os casamentos ativos...');
            
            db.all(
                'SELECT * FROM weddings WHERE is_active = 1 ORDER BY created_at DESC',
                [],
                (err, rows) => {
                    if (err) {
                        console.error('❌ Erro ao buscar casamentos:', err);
                        reject(err);
                    } else {
                        console.log(`✓ ${rows.length} casamentos ativos encontrados`);
                        resolve(rows);
                    }
                }
            );
        });
    },

    // Buscar casamento por slug
    getWeddingBySlug: (slug) => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM weddings WHERE slug = ? AND is_active = 1',
                [slug],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    // Atualizar casamento
    updateWedding: (id, weddingData) => {
        return new Promise((resolve, reject) => {
            console.log(`🔄 Atualizando casamento ID ${id} no banco:`);
            console.log('📋 Dados recebidos:', weddingData);
            
            // Primeiro buscar o casamento existente para preservar campos não fornecidos
            db.get('SELECT * FROM weddings WHERE id = ?', [id], (err, existingWedding) => {
                if (err) {
                    console.error('❌ Erro ao buscar casamento existente:', err);
                    reject(err);
                    return;
                }
                
                if (!existingWedding) {
                    console.error('❌ Casamento não encontrado para atualização');
                    reject(new Error('Casamento não encontrado'));
                    return;
                }
                
                // Mesclar dados existentes com novos dados
                const updatedData = {
                    bride_name: weddingData.bride_name || existingWedding.bride_name,
                    groom_name: weddingData.groom_name || existingWedding.groom_name,
                    wedding_date: weddingData.wedding_date || existingWedding.wedding_date,
                    wedding_time: weddingData.wedding_time || existingWedding.wedding_time,
                    venue_address: weddingData.venue_address || existingWedding.venue_address,
                    venue_name: weddingData.venue_name || existingWedding.venue_name,
                    additional_info: weddingData.additional_info || existingWedding.additional_info,
                    header_image: weddingData.header_image || existingWedding.header_image,
                    header_text: weddingData.header_text || existingWedding.header_text,
                    color_scheme: weddingData.color_scheme || existingWedding.color_scheme,
                    background_color: weddingData.background_color || existingWedding.background_color,
                    text_color: weddingData.text_color || existingWedding.text_color,
                    accent_color: weddingData.accent_color || existingWedding.accent_color
                };
                
                console.log('🎨 Cores mescladas:', { 
                    color_scheme: updatedData.color_scheme, 
                    background_color: updatedData.background_color, 
                    text_color: updatedData.text_color, 
                    accent_color: updatedData.accent_color 
                });
                
                db.run(
                    `UPDATE weddings SET 
                        bride_name = ?, groom_name = ?, wedding_date = ?, wedding_time = ?, 
                        venue_address = ?, venue_name = ?, additional_info = ?, header_image = ?, header_text = ?,
                        color_scheme = ?, background_color = ?, text_color = ?, accent_color = ?
                    WHERE id = ?`,
                    [updatedData.bride_name, updatedData.groom_name, updatedData.wedding_date, updatedData.wedding_time, 
                     updatedData.venue_address, updatedData.venue_name, updatedData.additional_info, updatedData.header_image, updatedData.header_text,
                     updatedData.color_scheme, updatedData.background_color, updatedData.text_color, updatedData.accent_color, id],
                    function(err) {
                        if (err) {
                            console.error('❌ Erro ao atualizar casamento:', err);
                            reject(err);
                        } else {
                            console.log(`✅ Casamento ID ${id} atualizado com sucesso. ${this.changes} linhas alteradas.`);
                            resolve({ id, changes: this.changes });
                        }
                    }
                );
            });
        });
    },

    // Buscar casamento por ID (para informações antes de deletar)
    getWeddingById: (id) => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM weddings WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    // Deletar casamento (exclusão real)
    deleteWedding: (id) => {
        return new Promise((resolve, reject) => {
            console.log(`🔍 Iniciando exclusão do casamento ID: ${id}`);
            
            db.serialize(() => {
                // Habilitar foreign keys para esta operação
                db.run('PRAGMA foreign_keys = ON', (err) => {
                    if (err) {
                        console.error('❌ Erro ao habilitar foreign keys:', err);
                    } else {
                        console.log('✓ Foreign keys habilitadas para exclusão');
                    }
                });
                
                // Primeiro verificar se o casamento existe
                db.get('SELECT id, bride_name, groom_name, is_active FROM weddings WHERE id = ?', [id], (err, wedding) => {
                    if (err) {
                        console.error('❌ Erro ao verificar casamento:', err);
                        reject(err);
                        return;
                    }
                    
                    if (!wedding) {
                        console.error(`❌ Casamento ID ${id} não encontrado`);
                        reject(new Error('Casamento não encontrado'));
                        return;
                    }
                    
                    console.log(`📋 Casamento encontrado: ${wedding.bride_name} & ${wedding.groom_name} (Ativo: ${wedding.is_active})`);
                    
                    // Verificar quantos convidados existem
                    db.get('SELECT COUNT(*) as count FROM guests WHERE wedding_id = ?', [id], (err, guestCount) => {
                        if (err) {
                            console.error('❌ Erro ao contar convidados:', err);
                            reject(err);
                            return;
                        }
                        
                        console.log(`👥 Convidados encontrados: ${guestCount.count}`);
                        
                        // Primeiro deletar todos os convidados do casamento
                        db.run(
                            'DELETE FROM guests WHERE wedding_id = ?',
                            [id],
                            function(err) {
                                if (err) {
                                    console.error('❌ Erro ao deletar convidados:', err);
                                    reject(err);
                                    return;
                                }
                                console.log(`✓ ${this.changes} convidados removidos do casamento ID ${id}`);
                                
                                // Depois deletar o casamento
                                db.run(
                                    'DELETE FROM weddings WHERE id = ?',
                                    [id],
                                    function(err) {
                                        if (err) {
                                            console.error('❌ Erro ao deletar casamento:', err);
                                            reject(err);
                                        } else {
                                            console.log(`✓ Casamento ID ${id} removido com sucesso (${this.changes} registros afetados)`);
                                            
                                            // Verificar se realmente foi deletado
                                            db.get('SELECT id FROM weddings WHERE id = ?', [id], (err, checkRow) => {
                                                if (err) {
                                                    console.error('❌ Erro ao verificar exclusão:', err);
                                                } else if (checkRow) {
                                                    console.error('❌ PROBLEMA: Casamento ainda existe após exclusão!');
                                                } else {
                                                    console.log('✅ Verificação confirmada: Casamento foi deletado');
                                                }
                                            });
                                            
                                            resolve({ 
                                                id, 
                                                changes: this.changes,
                                                message: 'Casamento e todos os convidados associados foram removidos'
                                            });
                                        }
                                    }
                                );
                            }
                        );
                    });
                });
            });
        });
    }
};

// Funções para manipular convidados
const guestOperations = {
    // Verificar se telefone já está cadastrado em um casamento específico
    checkPhoneExists: (weddingId, phone) => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id, name FROM guests WHERE wedding_id = ? AND phone = ?',
                [weddingId, phone],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    // Inserir novo convidado
    insertGuest: (guestData) => {
        return new Promise((resolve, reject) => {
            const { wedding_id, name, adults, children, adults_names, children_details, phone } = guestData;
            
            // Converter arrays para JSON strings
            const adultsNamesJson = adults_names ? JSON.stringify(adults_names) : null;
            const childrenDetailsJson = children_details ? JSON.stringify(children_details) : null;
            
            db.run(
                'INSERT INTO guests (wedding_id, name, adults, children, adults_names, children_details, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [wedding_id, name, adults, children, adultsNamesJson, childrenDetailsJson, phone],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...guestData });
                    }
                }
            );
        });
    },

    // Buscar todos os convidados de um casamento
    getGuestsByWedding: (weddingId) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM guests WHERE wedding_id = ? ORDER BY created_at DESC',
                [weddingId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Converter JSON strings de volta para arrays
                        const processedRows = rows.map(row => ({
                            ...row,
                            adults_names: row.adults_names ? JSON.parse(row.adults_names) : [],
                            children_details: row.children_details ? JSON.parse(row.children_details) : []
                        }));
                        resolve(processedRows);
                    }
                }
            );
        });
    },

    // Buscar todos os convidados (para compatibilidade)
    getAllGuests: () => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM guests ORDER BY created_at DESC',
                [],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Converter JSON strings de volta para arrays
                        const processedRows = rows.map(row => ({
                            ...row,
                            adults_names: row.adults_names ? JSON.parse(row.adults_names) : [],
                            children_details: row.children_details ? JSON.parse(row.children_details) : []
                        }));
                        resolve(processedRows);
                    }
                }
            );
        });
    },

    // Buscar estatísticas de um casamento específico
    getStatsByWedding: (weddingId) => {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT 
                    COUNT(*) as total_confirmations,
                    SUM(adults) as total_adults,
                    SUM(children) as total_children,
                    SUM(adults + children) as total_people
                FROM guests WHERE wedding_id = ?`,
                [weddingId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    // Buscar estatísticas gerais (todos os casamentos)
    getStats: () => {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT 
                    COUNT(*) as total_confirmations,
                    SUM(adults) as total_adults,
                    SUM(children) as total_children,
                    SUM(adults + children) as total_people
                FROM guests`,
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    // Buscar convidado por ID
    getGuestById: (guestId) => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM guests WHERE id = ?',
                [guestId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        // Converter JSON strings de volta para arrays
                        const processedRow = {
                            ...row,
                            adults_names: row.adults_names ? JSON.parse(row.adults_names) : [],
                            children_details: row.children_details ? JSON.parse(row.children_details) : []
                        };
                        resolve(processedRow);
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    },

    // Remover convidado por ID
    deleteGuest: (guestId) => {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM guests WHERE id = ?',
                [guestId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ deletedRows: this.changes });
                    }
                }
            );
        });
    }
};

// Funções para usuários admin
const adminOperations = {
    // Verificar credenciais de login
    authenticate: (username, password) => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id, username, password_hash FROM admin_users WHERE username = ?',
                [username],
                async (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!row) {
                        resolve(false);
                        return;
                    }
                    
                    try {
                        const bcrypt = require('bcrypt');
                        const isValid = await bcrypt.compare(password, row.password_hash);
                        resolve(isValid ? { id: row.id, username: row.username } : false);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    }
};

module.exports = {
    db,
    initializeDatabase,
    weddingOperations,
    guestOperations,
    adminOperations
};

