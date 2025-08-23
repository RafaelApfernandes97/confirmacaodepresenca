const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    guest_number: {
        type: Number,
        required: true,
        unique: true
    },
    wedding_slug: {
        type: String,
        required: [true, 'Slug do casamento é obrigatório'],
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    adults: {
        type: Number,
        required: [true, 'Quantidade de adultos é obrigatória'],
        min: [1, 'Deve ter pelo menos 1 adulto'],
        default: 1
    },
    children: {
        type: Number,
        required: [true, 'Quantidade de crianças é obrigatória'],
        min: [0, 'Quantidade de crianças não pode ser negativa'],
        default: 0
    },
    adults_names: {
        type: [String],
        default: [],
        validate: {
            validator: function(v) {
                return v.length === this.adults;
            },
            message: 'Quantidade de nomes deve corresponder à quantidade de adultos'
        }
    },
    children_details: {
        type: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            over6: {
                type: Boolean,
                required: true
            }
        }],
        default: [],
        validate: {
            validator: function(v) {
                return v.length === this.children;
            },
            message: 'Quantidade de detalhes das crianças deve corresponder à quantidade de crianças'
        }
    },
    phone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        trim: true
    }
}, {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'guests' // Nome da coleção no MongoDB
});

// Middleware para gerar número sequencial de convidado
guestSchema.pre('save', async function(next) {
    if (this.isNew && !this.guest_number) {
        try {
            // Buscar o maior número de convidado existente
            const lastGuest = await this.constructor.findOne({}, {}, { sort: { 'guest_number': -1 } });
            this.guest_number = lastGuest ? lastGuest.guest_number + 1 : 1;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Índices para melhor performance
guestSchema.index({ wedding_slug: 1 });
guestSchema.index({ phone: 1 });
guestSchema.index({ createdAt: -1 });
guestSchema.index({ wedding_slug: 1, phone: 1 }, { unique: true }); // Telefone único por casamento

// Método estático para buscar convidados por casamento
guestSchema.statics.findByWeddingSlug = function(weddingSlug) {
    return this.find({ wedding_slug: weddingSlug }).sort({ createdAt: -1 });
};

// Método estático para verificar se telefone já existe em um casamento
guestSchema.statics.checkPhoneExists = function(weddingSlug, phone) {
    return this.findOne({ wedding_slug: weddingSlug, phone: phone });
};

// Método estático para buscar estatísticas por casamento
guestSchema.statics.getStatsByWedding = function(weddingSlug) {
    return this.aggregate([
        { $match: { wedding_slug: weddingSlug } },
        {
            $group: {
                _id: null,
                total_confirmations: { $sum: 1 },
                total_adults: { $sum: '$adults' },
                total_children: { $sum: '$children' },
                total_people: { $sum: { $add: ['$adults', '$children'] } }
            }
        },
        {
            $project: {
                _id: 0,
                total_confirmations: 1,
                total_adults: 1,
                total_children: 1,
                total_people: 1
            }
        }
    ]);
};

// Método estático para buscar estatísticas detalhadas de crianças
guestSchema.statics.getChildrenStatsByWedding = function(weddingSlug) {
    return this.aggregate([
        { $match: { wedding_slug: weddingSlug, children: { $gt: 0 } } },
        { $unwind: '$children_details' },
        {
            $group: {
                _id: '$children_details.over6',
                count: { $sum: 1 }
            }
        }
    ]);
};

module.exports = mongoose.model('Guest', guestSchema);
