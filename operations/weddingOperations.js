const Wedding = require('../models/Wedding');

const weddingOperations = {
    // Buscar todos os casamentos ativos
    async getAllWeddings() {
        try {
            console.log('🔍 Buscando todos os casamentos ativos...');
            const weddings = await Wedding.findActive();
            console.log(`✓ ${weddings.length} casamentos ativos encontrados`);
            return weddings;
        } catch (error) {
            console.error('❌ Erro ao buscar casamentos:', error);
            throw error;
        }
    },

    // Buscar casamento por slug
    async getWeddingBySlug(slug) {
        try {
            const wedding = await Wedding.findBySlug(slug);
            return wedding;
        } catch (error) {
            console.error('❌ Erro ao buscar casamento por slug:', error);
            throw error;
        }
    },

    // Buscar casamento por ID
    async getWeddingById(id) {
        try {
            const wedding = await Wedding.findById(id);
            return wedding;
        } catch (error) {
            console.error('❌ Erro ao buscar casamento por ID:', error);
            throw error;
        }
    },

    // Criar novo casamento
    async createWedding(weddingData) {
        try {
            console.log('🆕 Criando novo casamento...');
            console.log('📋 Dados recebidos:', weddingData);
            
            // Verificar se já existe um casamento com o mesmo slug
            if (weddingData.slug) {
                const existingWedding = await Wedding.findBySlugIncludeInactive(weddingData.slug);
                if (existingWedding) {
                    throw new Error(`Já existe um casamento com o slug: ${weddingData.slug}`);
                }
            }
            
            const wedding = new Wedding(weddingData);
            await wedding.save();
            console.log(`✅ Casamento criado com sucesso: ${wedding.bride_name} & ${wedding.groom_name}`);
            return wedding;
        } catch (error) {
            console.error('❌ Erro ao criar casamento:', error);
            throw error;
        }
    },

    // Atualizar casamento
    async updateWedding(id, weddingData) {
        try {
            console.log(`🔄 Atualizando casamento ID: ${id}`);
            console.log('📋 Dados recebidos:', weddingData);
            
            const wedding = await Wedding.findByIdAndUpdate(
                id,
                weddingData,
                { 
                    new: true, 
                    runValidators: true,
                    context: 'query'
                }
            );
            
            if (!wedding) {
                throw new Error('Casamento não encontrado');
            }
            
            console.log(`✅ Casamento atualizado com sucesso: ${wedding.bride_name} & ${wedding.groom_name}`);
            return wedding;
        } catch (error) {
            console.error('❌ Erro ao atualizar casamento:', error);
            throw error;
        }
    },

    // Deletar casamento (soft delete)
    async deleteWedding(id) {
        try {
            console.log(`🗑️  Deletando casamento ID: ${id}`);
            
            const wedding = await Wedding.findById(id);
            if (!wedding) {
                throw new Error('Casamento não encontrado');
            }
            
            console.log(`📋 Casamento encontrado: ${wedding.bride_name} & ${wedding.groom_name} (Ativo: ${wedding.is_active})`);
            
            // Marcar como inativo em vez de deletar (soft delete)
            wedding.is_active = false;
            await wedding.save();
            
            console.log(`✅ Casamento marcado como inativo: ${wedding.bride_name} & ${wedding.groom_name}`);
            
            return {
                id: wedding._id,
                changes: 1,
                message: 'Casamento marcado como inativo'
            };
        } catch (error) {
            console.error('❌ Erro ao deletar casamento:', error);
            throw error;
        }
    },

    // Buscar casamento por slug (para compatibilidade)
    async findBySlug(slug) {
        return this.getWeddingBySlug(slug);
    }
};

module.exports = weddingOperations;
