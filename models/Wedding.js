const mongoose = require('mongoose');

const weddingSchema = new mongoose.Schema({
    bride_name: {
        type: String,
        required: [true, 'Nome da noiva é obrigatório'],
        trim: true
    },
    groom_name: {
        type: String,
        required: [true, 'Nome do noivo é obrigatório'],
        trim: true
    },
    wedding_date: {
        type: String,
        trim: true
    },
    wedding_time: {
        type: String,
        trim: true
    },
    venue_address: {
        type: String,
        trim: true
    },
    venue_name: {
        type: String,
        trim: true
    },
    additional_info: {
        type: String,
        trim: true
    },
    header_image: {
        type: String,
        trim: true
    },
    header_text: {
        type: String,
        trim: true
    },
    color_scheme: {
        type: String,
        default: 'marsala',
        trim: true
    },
    background_color: {
        type: String,
        default: '#9c2851',
        trim: true
    },
    text_color: {
        type: String,
        default: '#ffffff',
        trim: true
    },
    accent_color: {
        type: String,
        default: '#d4af37',
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Slug é obrigatório'],
        unique: true,
        trim: true,
        index: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    collection: 'weddings' // Nome da coleção no MongoDB
});

// Índices para melhor performance
weddingSchema.index({ slug: 1 });
weddingSchema.index({ is_active: 1 });
weddingSchema.index({ createdAt: -1 });

// Método para gerar slug automático
weddingSchema.methods.generateSlug = function() {
    const timestamp = Date.now();
    const dateStr = this.wedding_date ? this.wedding_date.replace(/-/g, '') : '';
    return `${this.bride_name.toLowerCase().replace(/\s+/g, '-')}-${this.groom_name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}-${timestamp}`;
};

// Middleware para gerar slug se não fornecido (APENAS na criação)
weddingSchema.pre('save', function(next) {
    // Só gerar slug se for um novo documento E não tiver slug
    if (this.isNew && !this.slug) {
        this.slug = this.generateSlug();
    }
    next();
});

// Método estático para buscar casamentos ativos
weddingSchema.statics.findActive = function() {
    return this.find({ is_active: true }).sort({ createdAt: -1 });
};

// Método estático para buscar por slug
weddingSchema.statics.findBySlug = function(slug) {
    return this.findOne({ slug, is_active: true });
};

// Método estático para buscar por slug (incluindo inativos)
weddingSchema.statics.findBySlugIncludeInactive = function(slug) {
    return this.findOne({ slug });
};

module.exports = mongoose.model('Wedding', weddingSchema);
