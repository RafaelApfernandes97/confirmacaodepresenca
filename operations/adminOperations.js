const AdminUser = require('../models/AdminUser');

const adminOperations = {
    // Autenticar usuário admin
    async authenticate(username, password) {
        try {
            const admin = await AdminUser.authenticate(username, password);
            return admin;
        } catch (error) {
            console.error('❌ Erro na autenticação admin:', error);
            throw error;
        }
    },

    // Criar usuário admin padrão
    async createDefaultAdmin() {
        try {
            await AdminUser.createDefaultAdmin();
        } catch (error) {
            console.error('❌ Erro ao criar admin padrão:', error);
            throw error;
        }
    },

    // Buscar usuário admin por ID
    async getAdminById(id) {
        try {
            const admin = await AdminUser.findById(id);
            return admin;
        } catch (error) {
            console.error('❌ Erro ao buscar admin por ID:', error);
            throw error;
        }
    },

    // Criar novo usuário admin
    async createAdmin(adminData) {
        try {
            console.log('🆕 Criando novo usuário admin...');
            const admin = new AdminUser(adminData);
            await admin.save();
            console.log(`✅ Usuário admin criado com sucesso: ${admin.username}`);
            return admin;
        } catch (error) {
            console.error('❌ Erro ao criar usuário admin:', error);
            throw error;
        }
    },

    // Atualizar usuário admin
    async updateAdmin(id, adminData) {
        try {
            console.log(`🔄 Atualizando usuário admin ID: ${id}`);
            const admin = await AdminUser.findByIdAndUpdate(
                id,
                adminData,
                { 
                    new: true, 
                    runValidators: true,
                    context: 'query'
                }
            );
            
            if (!admin) {
                throw new Error('Usuário admin não encontrado');
            }
            
            console.log(`✅ Usuário admin atualizado com sucesso: ${admin.username}`);
            return admin;
        } catch (error) {
            console.error('❌ Erro ao atualizar usuário admin:', error);
            throw error;
        }
    },

    // Deletar usuário admin
    async deleteAdmin(id) {
        try {
            console.log(`🗑️  Deletando usuário admin ID: ${id}`);
            const admin = await AdminUser.findByIdAndDelete(id);
            
            if (!admin) {
                throw new Error('Usuário admin não encontrado');
            }
            
            console.log(`✅ Usuário admin deletado com sucesso: ${admin.username}`);
            return admin;
        } catch (error) {
            console.error('❌ Erro ao deletar usuário admin:', error);
            throw error;
        }
    },

    // Listar todos os usuários admin
    async getAllAdmins() {
        try {
            const admins = await AdminUser.find({ is_active: true }).select('-password_hash');
            return admins;
        } catch (error) {
            console.error('❌ Erro ao listar usuários admin:', error);
            throw error;
        }
    },

    // Alterar senha do usuário admin
    async changePassword(id, newPassword) {
        try {
            console.log(`🔐 Alterando senha do usuário admin ID: ${id}`);
            const admin = await AdminUser.findById(id);
            
            if (!admin) {
                throw new Error('Usuário admin não encontrado');
            }
            
            admin.password_hash = newPassword;
            await admin.save();
            
            console.log(`✅ Senha alterada com sucesso para: ${admin.username}`);
            return admin;
        } catch (error) {
            console.error('❌ Erro ao alterar senha:', error);
            throw error;
        }
    }
};

module.exports = adminOperations;
