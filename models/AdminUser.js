const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username é obrigatório'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password_hash: {
        type: String,
        required: [true, 'Hash da senha é obrigatório']
    },
    is_active: {
        type: Boolean,
        default: true
    },
    last_login: {
        type: Date
    }
}, {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'admin_users' // Nome da coleção no MongoDB
});

// Índices para melhor performance
adminUserSchema.index({ username: 1 });
adminUserSchema.index({ is_active: 1 });

// Método para verificar senha
adminUserSchema.methods.verifyPassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
};

// Método estático para autenticar usuário
adminUserSchema.statics.authenticate = async function(username, password) {
    const user = await this.findOne({ username: username.toLowerCase(), is_active: true });
    if (!user) {
        return null;
    }
    
    const isValid = await user.verifyPassword(password);
    if (isValid) {
        // Atualizar último login
        user.last_login = new Date();
        await user.save();
        return user;
    }
    
    return null;
};

// Método estático para criar usuário padrão
adminUserSchema.statics.createDefaultAdmin = async function() {
    const count = await this.countDocuments();
    if (count === 0) {
        const defaultPassword = 'admin123'; // Senha padrão - deve ser alterada em produção
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        const defaultAdmin = new this({
            username: 'admin',
            password_hash: passwordHash
        });
        
        await defaultAdmin.save();
        console.log('✅ Usuário admin padrão criado');
        console.log('⚠️  Username: admin, Senha: admin123');
        console.log('🔒 IMPORTANTE: Altere a senha padrão em produção!');
    }
};

// Middleware para hash da senha antes de salvar
adminUserSchema.pre('save', async function(next) {
    // Só hash se a senha foi modificada
    if (!this.isModified('password_hash')) {
        return next();
    }
    
    try {
        // Se não é um hash bcrypt, fazer hash
        if (!this.password_hash.startsWith('$2b$')) {
            this.password_hash = await bcrypt.hash(this.password_hash, 10);
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('AdminUser', adminUserSchema);
