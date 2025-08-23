const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Importar configuração do MongoDB
const { connectToMongoDB } = require('./config/database');

// Importar operações do MongoDB
const weddingOperations = require('./operations/weddingOperations');
const guestOperations = require('./operations/guestOperations');
const adminOperations = require('./operations/adminOperations');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar trust proxy para funcionar corretamente com Docker/proxy
app.set('trust proxy', true);

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Desabilitar CSP para permitir Tailwind CDN
}));

// Configuração de sessão (deve vir antes do CORS)
app.use(session({
    secret: 'wedding-rsvp-secret-key-change-in-production',
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Configuração do CORS para permitir cookies e sessões
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela
    message: 'Muitas tentativas. Tente novamente em 15 minutos.',
    // Configurações adicionais para ambientes Docker/proxy
    standardHeaders: true,
    legacyHeaders: false,
    // Usar função personalizada para gerar chave do rate limit
    keyGenerator: (req) => {
        // Priorizar X-Forwarded-For se disponível, senão usar IP direto
        return req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection.remoteAddress;
    }
});
app.use(limiter);

// Rate limiting específico para RSVP
const rsvpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // máximo 5 tentativas de RSVP por minuto
    message: { error: 'Muitas tentativas de confirmação. Tente novamente em 1 minuto.' },
    // Configurações adicionais para ambientes Docker/proxy
    standardHeaders: true,
    legacyHeaders: false,
    // Usar função personalizada para gerar chave do rate limit
    keyGenerator: (req) => {
        // Priorizar X-Forwarded-For se disponível, senão usar IP direto
        return req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection.remoteAddress;
    }
});

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Gerar nome único para o arquivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'header-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        // Aceitar apenas imagens
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
        }
    }
});

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para verificar autenticação admin
function requireAuth(req, res, next) {
    console.log('🔐 Verificando autenticação...');
    console.log('📋 Sessão:', {
        sessionId: req.sessionID,
        adminId: req.session?.adminId,
        adminUsername: req.session?.adminUsername,
        sessionKeys: req.session ? Object.keys(req.session) : 'Nenhuma sessão'
    });
    
    if (req.session && req.session.adminId) {
        console.log('✅ Usuário autenticado:', req.session.adminUsername);
        next();
    } else {
        console.log('❌ Usuário não autenticado');
        res.status(401).json({ error: 'Acesso negado. Faça login.' });
    }
}

// ==================== ROTAS PÚBLICAS ====================

// Página inicial - redirecionar para admin
app.get('/', (req, res) => {
    res.redirect('/admin');
});

// Página RSVP específica do casamento
app.get('/rsvp/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        
        if (!wedding) {
            return res.status(404).send('Lista de casamento não encontrada');
        }
        
        res.sendFile(path.join(__dirname, 'public', 'rsvp.html'));
    } catch (error) {
        console.error('Erro ao carregar página RSVP:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// API: Obter dados públicos do casamento (para página RSVP)
app.get('/api/wedding/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        
        if (!wedding) {
            return res.status(404).json({ error: 'Casamento não encontrado' });
        }
        
        // Retornar apenas dados públicos (sem IDs internos)
        res.json({
            bride_name: wedding.bride_name,
            groom_name: wedding.groom_name,
            wedding_date: wedding.wedding_date,
            wedding_time: wedding.wedding_time,
            venue_name: wedding.venue_name,
            venue_address: wedding.venue_address,
            additional_info: wedding.additional_info,
            header_image: wedding.header_image,
            header_text: wedding.header_text,
            background_color: wedding.background_color || '#9c2851',
            text_color: wedding.text_color || '#ffffff',
            accent_color: wedding.accent_color || '#d4af37'
        });
    } catch (error) {
        console.error('Erro ao buscar dados do casamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// API: Confirmar presença (RSVP)
app.post('/api/rsvp/:slug', rsvpLimiter, async (req, res) => {
    try {
        const { slug } = req.params;
        const { name, adults, children, adults_names, children_details, phone } = req.body;

        // Verificar se o casamento existe
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        if (!wedding) {
            return res.status(404).json({
                error: 'Lista de casamento não encontrada.'
            });
        }

        // Validação básica
        if (!name || !phone || adults === undefined || children === undefined) {
            return res.status(400).json({
                error: 'Todos os campos são obrigatórios.'
            });
        }

        // Validar tipos
        const adultsNum = parseInt(adults);
        const childrenNum = parseInt(children);

        if (isNaN(adultsNum) || isNaN(childrenNum) || adultsNum < 0 || childrenNum < 0) {
            return res.status(400).json({
                error: 'Quantidades devem ser números válidos.'
            });
        }

        // Validar se pelo menos uma pessoa
        if (adultsNum + childrenNum === 0) {
            return res.status(400).json({
                error: 'Deve haver pelo menos uma pessoa confirmada.'
            });
        }

        // Validar nomes dos adultos
        if (adultsNum > 0) {
            if (!adults_names || !Array.isArray(adults_names) || adults_names.length !== adultsNum) {
                return res.status(400).json({
                    error: 'Todos os nomes dos adultos devem ser informados.'
                });
            }
            
            // Verificar se todos os nomes estão preenchidos
            for (const adultName of adults_names) {
                if (!adultName || typeof adultName !== 'string' || adultName.trim().length === 0) {
                    return res.status(400).json({
                        error: 'Todos os nomes dos adultos devem ser preenchidos.'
                    });
                }
            }
        }

        // Validar detalhes das crianças
        if (childrenNum > 0) {
            if (!children_details || !Array.isArray(children_details) || children_details.length !== childrenNum) {
                return res.status(400).json({
                    error: 'Todos os detalhes das crianças devem ser informados.'
                });
            }
            
            // Verificar se todos os detalhes estão preenchidos
            for (const child of children_details) {
                if (!child || typeof child !== 'object' || 
                    !child.name || typeof child.name !== 'string' || child.name.trim().length === 0 ||
                    typeof child.over6 !== 'boolean') {
                    return res.status(400).json({
                        error: 'Todos os dados das crianças devem ser preenchidos corretamente.'
                    });
                }
            }
        }

        // Verificar se telefone já existe neste casamento
        const existingGuest = await guestOperations.checkPhoneExists(slug, phone);
        if (existingGuest) {
            return res.status(409).json({
                error: 'Você já confirmou sua presença. Obrigado!',
                guest: existingGuest.name
            });
        }

        // Inserir novo convidado
        const newGuest = await guestOperations.insertGuest({
            wedding_slug: slug,
            name: name.trim(),
            adults: adultsNum,
            children: childrenNum,
            adults_names: adultsNum > 0 ? adults_names.map(n => n.trim()) : [],
            children_details: childrenNum > 0 ? children_details.map(c => ({
                name: c.name.trim(),
                over6: c.over6
            })) : [],
            phone: phone.trim()
        });

        res.status(201).json({
            success: true,
            message: 'Presença confirmada com sucesso!',
            guest: newGuest
        });

    } catch (error) {
        console.error('Erro ao confirmar presença:', error);
        res.status(500).json({
            error: 'Erro interno do servidor. Tente novamente.'
        });
    }
});

// ==================== ROTAS DE ADMIN ====================

// Página de login admin
app.get('/admin', (req, res) => {
    if (req.session && req.session.adminId) {
        // Se já está logado, redirecionar para lista de casamentos
        res.redirect('/admin/weddings');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
    }
});

// Página de gerenciamento de casamentos (novo dashboard principal)
app.get('/admin/weddings', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-weddings.html'));
});

// Dashboard específico de um casamento
app.get('/admin/wedding/:slug', requireAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        
        if (!wedding) {
            return res.status(404).send('Casamento não encontrado');
        }
        
        res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
    } catch (error) {
        console.error('Erro ao carregar dashboard do casamento:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// Health check para monitoramento
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// Endpoint de teste para debug da sessão
app.get('/debug-session', (req, res) => {
    res.json({
        sessionID: req.sessionID,
        session: req.session,
        sessionKeys: req.session ? Object.keys(req.session) : [],
        cookies: req.headers.cookie,
        userAgent: req.headers['user-agent']
    });
});

// Dashboard público compartilhável (sem autenticação)
app.get('/share/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        
        if (!wedding) {
            return res.status(404).send('Casamento não encontrado');
        }
        
        res.sendFile(path.join(__dirname, 'public', 'shared-dashboard.html'));
    } catch (error) {
        console.error('Erro ao carregar dashboard compartilhado:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// API pública para buscar convidados de um casamento (sem autenticação)
app.get('/api/guests/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        
        if (!wedding) {
            return res.status(404).json({ error: 'Casamento não encontrado' });
        }
        
        const guests = await guestOperations.getGuestsByWedding(slug);
        res.json(guests);
    } catch (error) {
        console.error('Erro ao buscar convidados:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// API para remover convidado (requer autenticação admin)
app.delete('/api/admin/wedding/:slug/guests/:guestId', requireAuth, async (req, res) => {
    try {
        const { slug, guestId } = req.params;
        
        // Verificar se o casamento existe
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        if (!wedding) {
            return res.status(404).json({ error: 'Casamento não encontrado' });
        }
        
        // Verificar se o convidado existe
        const guest = await guestOperations.getGuestById(guestId);
        if (!guest) {
            return res.status(404).json({ error: 'Convidado não encontrado' });
        }
        
        // Verificar se o convidado pertence ao casamento
        if (guest.wedding_slug !== slug) {
            return res.status(403).json({ error: 'Convidado não pertence a este casamento' });
        }
        
        // Remover o convidado
        await guestOperations.deleteGuest(guestId);
        
        res.json({ success: true, message: 'Convidado removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover convidado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// API: Login admin
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Usuário e senha são obrigatórios.'
            });
        }

        const admin = await adminOperations.authenticate(username, password);
        
        if (admin) {
            console.log('👤 Admin encontrado:', { 
                id: admin._id, 
                idType: typeof admin._id,
                username: admin.username,
                adminObject: admin
            });
            
            // Forçar o save da sessão
            req.session.adminId = admin._id.toString();
            req.session.adminUsername = admin.username;
            
            console.log('🔐 Sessão configurada:', {
                sessionId: req.sessionID,
                adminId: req.session.adminId,
                adminUsername: req.session.adminUsername,
                sessionKeys: Object.keys(req.session)
            });
            
            // Forçar o save da sessão
            req.session.save((err) => {
                if (err) {
                    console.error('❌ Erro ao salvar sessão:', err);
                    return res.status(500).json({ error: 'Erro ao criar sessão' });
                }
                
                console.log('✅ Sessão salva com sucesso');
                res.json({
                    success: true,
                    message: 'Login realizado com sucesso!',
                    redirectTo: '/admin/weddings'
                });
            });
        } else {
            res.status(401).json({
                error: 'Usuário ou senha incorretos.'
            });
        }

    } catch (error) {
        console.error('Erro no login admin:', error);
        res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
});

// API: Logout admin
app.post('/api/admin/logout', requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao fazer logout:', err);
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.json({ success: true, message: 'Logout realizado com sucesso!' });
    });
});

// APIs para gerenciar casamentos
app.get('/api/admin/weddings', requireAuth, async (req, res) => {
    try {
        const weddings = await weddingOperations.getAllWeddings();
        res.json(weddings);
    } catch (error) {
        console.error('Erro ao buscar casamentos:', error);
        res.status(500).json({ error: 'Erro ao buscar casamentos' });
    }
});

app.post('/api/admin/weddings', requireAuth, upload.single('header_image'), async (req, res) => {
    try {
        const weddingData = req.body;
        
        console.log('🆕 Criando novo casamento...');
        console.log('📋 Dados recebidos:', weddingData);
        
        // Validação básica
        if (!weddingData.bride_name || !weddingData.groom_name) {
            return res.status(400).json({
                error: 'Nome da noiva e noivo são obrigatórios.'
            });
        }

        // Gerar slug automático se não foi fornecido
        if (!weddingData.slug) {
            const timestamp = Date.now();
            const dateStr = weddingData.wedding_date ? weddingData.wedding_date.replace(/-/g, '') : '';
            weddingData.slug = `${weddingData.bride_name.toLowerCase().replace(/\s+/g, '-')}-${weddingData.groom_name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}-${timestamp}`;
        }

        // Adicionar caminho da imagem se foi feito upload
        if (req.file) {
            weddingData.header_image = `/uploads/${req.file.filename}`;
        }

        console.log('🔗 Slug gerado:', weddingData.slug);
        
        const newWedding = await weddingOperations.createWedding(weddingData);
        console.log('✅ Casamento criado com sucesso:', newWedding._id);
        
        res.status(201).json(newWedding);
    } catch (error) {
        console.error('❌ Erro ao criar casamento:', error);
        
        // Se for erro de slug duplicado, retornar erro específico
        if (error.message.includes('Já existe um casamento com o slug')) {
            return res.status(409).json({ 
                error: 'Já existe uma lista com esses nomes. Tente usar nomes diferentes ou adicionar mais informações.' 
            });
        }
        
        res.status(500).json({ error: 'Erro ao criar casamento: ' + error.message });
    }
});

app.put('/api/admin/weddings/:id', requireAuth, upload.single('header_image'), async (req, res) => {
    try {
        const { id } = req.params;
        const weddingData = req.body;
        
        console.log('🔄 Atualizando casamento ID:', id);
        console.log('📋 Dados recebidos:', weddingData);
        console.log('🎨 Cores recebidas:', {
            color_scheme: weddingData.color_scheme,
            background_color: weddingData.background_color,
            text_color: weddingData.text_color,
            accent_color: weddingData.accent_color
        });
        
        // Adicionar caminho da imagem se foi feito upload
        if (req.file) {
            weddingData.header_image = `/uploads/${req.file.filename}`;
            console.log('📸 Nova imagem:', weddingData.header_image);
            
            // TODO: Remover imagem antiga se existir
        }

        const result = await weddingOperations.updateWedding(id, weddingData);
        console.log('✅ Casamento atualizado com sucesso:', result);
        
        res.json({ success: true, message: 'Casamento atualizado com sucesso!' });
    } catch (error) {
        console.error('❌ Erro ao atualizar casamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar casamento' });
    }
});



app.delete('/api/admin/weddings/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🗑️  Deletando casamento ID: ${id}`);
        
        // Primeiro, buscar dados do casamento para pegar o caminho da imagem
        const wedding = await weddingOperations.getWeddingById(id);
        
        if (!wedding) {
            console.log(`❌ Casamento não encontrado: ${id}`);
            return res.status(404).json({ error: 'Casamento não encontrado' });
        }
        
        console.log(`📋 Casamento encontrado: ${wedding.bride_name} & ${wedding.groom_name}`);
        
        // Deletar o casamento e convidados do banco de dados
        const result = await weddingOperations.deleteWedding(id);
        
        console.log(`✅ Resultado da deleção:`, result);
        
        // Se tinha imagem, tentar deletar o arquivo
        if (wedding.header_image) {
            try {
                const imagePath = path.join(__dirname, 'public', wedding.header_image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log(`✓ Imagem removida: ${wedding.header_image}`);
                }
            } catch (imageError) {
                console.warn('⚠️  Aviso: Não foi possível remover a imagem:', imageError.message);
                // Não falhamos a operação se não conseguir deletar a imagem
            }
        }
        
        res.json({ 
            success: true, 
            message: `Lista de ${wedding.bride_name} & ${wedding.groom_name} foi removida com sucesso!`,
            details: result.message
        });
    } catch (error) {
        console.error('❌ Erro ao deletar casamento:', error);
        res.status(500).json({ error: 'Erro ao deletar casamento: ' + error.message });
    }
});

// API: Buscar convidados de um casamento específico
app.get('/api/admin/wedding/:slug/guests', requireAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        
        if (!wedding) {
            return res.status(404).json({ error: 'Casamento não encontrado' });
        }
        
        const guests = await guestOperations.getGuestsByWedding(slug);
        res.json(guests);
    } catch (error) {
        console.error('Erro ao buscar convidados:', error);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

// API: Buscar estatísticas de um casamento específico
app.get('/api/admin/wedding/:slug/stats', requireAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        
        if (!wedding) {
            return res.status(404).json({ error: 'Casamento não encontrado' });
        }
        
        const stats = await guestOperations.getStatsByWedding(slug);
        res.json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// API: Buscar dados do casamento
app.get('/api/admin/wedding/:slug', requireAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        
        if (!wedding) {
            return res.status(404).json({ error: 'Casamento não encontrado' });
        }
        
        res.json(wedding);
    } catch (error) {
        console.error('Erro ao buscar casamento:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do casamento' });
    }
});

// API: Exportar dados para CSV de um casamento específico
app.get('/api/admin/wedding/:slug/export', requireAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const wedding = await weddingOperations.getWeddingBySlug(slug);
        
        if (!wedding) {
            return res.status(404).json({ error: 'Casamento não encontrado' });
        }
        
        const guests = await guestOperations.getGuestsByWedding(slug);
        
        // Preparar dados para exportação
        const exportData = guests.map(guest => ({
            id: guest.guest_number,
            name: guest.name,
            adults: guest.adults,
            children: guest.children,
            adults_names: guest.adults_names ? guest.adults_names.join(', ') : '',
            children_details: guest.children_details ? 
                guest.children_details.map(child => 
                    `${child.name} (${child.over6 ? 'Maior de 6' : 'Menor de 6'})`
                ).join(', ') : '',
            phone: guest.phone,
            created_at: guest.createdAt
        }));

        // Configurar CSV writer
        const csvWriter = createCsvWriter({
            path: path.join(__dirname, 'exports', `convidados-${slug}.csv`),
            header: [
                { id: 'id', title: 'ID' },
                { id: 'name', title: 'Responsável' },
                { id: 'adults', title: 'Qtd Adultos' },
                { id: 'adults_names', title: 'Nomes dos Adultos' },
                { id: 'children', title: 'Qtd Crianças' },
                { id: 'children_details', title: 'Detalhes das Crianças' },
                { id: 'phone', title: 'Telefone' },
                { id: 'created_at', title: 'Data Confirmação' }
            ],
            encoding: 'utf8'
        });

        // Criar diretório de exports se não existir
        const fs = require('fs');
        const exportDir = path.join(__dirname, 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        // Escrever CSV
        await csvWriter.writeRecords(exportData);
        
        // Enviar arquivo para download
        res.download(path.join(__dirname, 'exports', `convidados-${slug}.csv`), `convidados-${wedding.bride_name}-${wedding.groom_name}.csv`, (err) => {
            if (err) {
                console.error('Erro ao enviar arquivo:', err);
                res.status(500).json({ error: 'Erro ao gerar arquivo' });
            }
        });

    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        res.status(500).json({ error: 'Erro ao exportar dados' });
    }
});

// ==================== INICIALIZAÇÃO ====================

// Inicializar banco de dados e iniciar servidor
async function startServer() {
    try {
        await connectToMongoDB();
        console.log('✓ Banco de dados MongoDB inicializado');
        
        // Criar usuário admin padrão se não existir
        await adminOperations.createDefaultAdmin();
        console.log('✓ Usuário admin padrão verificado');
        
        app.listen(PORT, () => {
            console.log(`\n🎉 Servidor rodando na porta ${PORT}`);
            console.log(`📱 Página RSVP: http://localhost:${PORT}`);
            console.log(`👥 Painel Admin: http://localhost:${PORT}/admin`);
            console.log(`🔑 Login padrão: admin / admin123\n`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejeitada não tratada:', reason);
    process.exit(1);
});

// Iniciar servidor
startServer();

