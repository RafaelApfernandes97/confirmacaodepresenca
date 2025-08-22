const Guest = require('../models/Guest');

const guestOperations = {
    // Verificar se telefone já está cadastrado em um casamento específico
    async checkPhoneExists(weddingSlug, phone) {
        try {
            const guest = await Guest.checkPhoneExists(weddingSlug, phone);
            return guest;
        } catch (error) {
            console.error('❌ Erro ao verificar telefone:', error);
            throw error;
        }
    },

    // Inserir novo convidado
    async insertGuest(guestData) {
        try {
            console.log('🆕 Inserindo novo convidado...');
            const guest = new Guest(guestData);
            await guest.save();
            console.log(`✅ Convidado inserido com sucesso: ${guest.name}`);
            return guest;
        } catch (error) {
            console.error('❌ Erro ao inserir convidado:', error);
            throw error;
        }
    },

    // Buscar todos os convidados de um casamento
    async getGuestsByWedding(weddingSlug) {
        try {
            console.log(`🔍 Buscando convidados para casamento: ${weddingSlug}`);
            const guests = await Guest.findByWeddingSlug(weddingSlug);
            console.log(`✓ ${guests.length} convidados encontrados para o casamento ${weddingSlug}`);
            return guests;
        } catch (error) {
            console.error('❌ Erro ao buscar convidados:', error);
            throw error;
        }
    },

    // Buscar todos os convidados (para compatibilidade)
    async getAllGuests() {
        try {
            const guests = await Guest.find().sort({ createdAt: -1 });
            return guests;
        } catch (error) {
            console.error('❌ Erro ao buscar todos os convidados:', error);
            throw error;
        }
    },

    // Buscar estatísticas de um casamento específico
    async getStatsByWedding(weddingSlug) {
        try {
            console.log(`📊 Buscando estatísticas para casamento: ${weddingSlug}`);
            
            // Buscar estatísticas básicas
            const basicStats = await Guest.getStatsByWedding(weddingSlug);
            
            // Buscar estatísticas detalhadas de crianças
            const childrenStats = await Guest.getChildrenStatsByWedding(weddingSlug);
            
            // Processar estatísticas de crianças
            let totalChildrenOver6 = 0;
            let totalChildrenUnder6 = 0;
            
            childrenStats.forEach(stat => {
                if (stat._id === true) { // over6 = true
                    totalChildrenOver6 = stat.count;
                } else { // over6 = false
                    totalChildrenUnder6 = stat.count;
                }
            });
            
            // Combinar estatísticas
            const combinedStats = {
                total_confirmations: basicStats[0]?.total_confirmations || 0,
                total_adults: basicStats[0]?.total_adults || 0,
                total_children: basicStats[0]?.total_children || 0,
                total_people: basicStats[0]?.total_people || 0,
                total_children_over6: totalChildrenOver6,
                total_children_under6: totalChildrenUnder6
            };
            
            console.log(`✓ Estatísticas calculadas para casamento ${weddingSlug}:`, combinedStats);
            return combinedStats;
        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error);
            throw error;
        }
    },

    // Buscar convidado por ID
    async getGuestById(guestId) {
        try {
            const guest = await Guest.findById(guestId);
            return guest;
        } catch (error) {
            console.error('❌ Erro ao buscar convidado por ID:', error);
            throw error;
        }
    },

    // Deletar convidado
    async deleteGuest(guestId) {
        try {
            console.log(`🗑️  Deletando convidado ID: ${guestId}`);
            const guest = await Guest.findByIdAndDelete(guestId);
            
            if (!guest) {
                throw new Error('Convidado não encontrado');
            }
            
            console.log(`✅ Convidado deletado com sucesso: ${guest.name}`);
            return guest;
        } catch (error) {
            console.error('❌ Erro ao deletar convidado:', error);
            throw error;
        }
    },

    // Atualizar convidado
    async updateGuest(guestId, guestData) {
        try {
            console.log(`🔄 Atualizando convidado ID: ${guestId}`);
            const guest = await Guest.findByIdAndUpdate(
                guestId,
                guestData,
                { 
                    new: true, 
                    runValidators: true,
                    context: 'query'
                }
            );
            
            if (!guest) {
                throw new Error('Convidado não encontrado');
            }
            
            console.log(`✅ Convidado atualizado com sucesso: ${guest.name}`);
            return guest;
        } catch (error) {
            console.error('❌ Erro ao atualizar convidado:', error);
            throw error;
        }
    }
};

module.exports = guestOperations;
