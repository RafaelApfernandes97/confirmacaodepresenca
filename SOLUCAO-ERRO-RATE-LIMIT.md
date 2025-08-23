# Solução para Erro de Rate Limit - X-Forwarded-For

## Problema Identificado

O erro `ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false` ocorre quando:

1. A aplicação está rodando em Docker/container
2. Está atrás de um proxy reverso ou load balancer
3. O Express recebe o header `X-Forwarded-For` mas não está configurado para confiar nele
4. O `express-rate-limit` tenta usar esse header para identificar usuários

## Solução Implementada

### 1. Configuração do Trust Proxy

```javascript
// Configurar trust proxy para funcionar corretamente com Docker/proxy
app.set('trust proxy', true);
```

Esta configuração faz o Express confiar nos headers de proxy como `X-Forwarded-For`, `X-Forwarded-Proto`, etc.

### 2. Configuração Robusta do Rate Limiting

```javascript
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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
```

### 3. Função Personalizada de Key Generation

A função `keyGenerator` personalizada:
- Prioriza o header `X-Forwarded-For` (primeiro IP da lista)
- Fallback para `req.ip` (configurado pelo trust proxy)
- Fallback final para `req.connection.remoteAddress`

## Por que isso acontece?

Em ambientes Docker/proxy:
- O proxy reverso recebe a requisição original
- Adiciona o header `X-Forwarded-For` com o IP real do cliente
- Encaminha para o container da aplicação
- Sem `trust proxy`, o Express não confia nesse header
- O rate limit falha ao tentar identificar o IP real do usuário

## Benefícios da Solução

1. **Rate Limiting Funcional**: O rate limiting agora funciona corretamente em Docker
2. **Identificação Correta de IPs**: Usuários são identificados pelo IP real, não pelo IP do proxy
3. **Compatibilidade**: Funciona tanto em desenvolvimento local quanto em produção Docker
4. **Segurança**: Mantém a proteção contra abuso sem quebrar a funcionalidade

## Arquivos Modificados

- `server.js`: Adicionada configuração `trust proxy` e melhorias no rate limiting

## Teste da Solução

Após aplicar as mudanças:
1. Reconstrua o container Docker: `docker-compose build`
2. Reinicie o serviço: `docker-compose up -d`
3. Verifique os logs: `docker-compose logs -f`
4. O erro de rate limit não deve mais aparecer

## Referências

- [Express Trust Proxy](https://expressjs.com/en/guide/behind-proxies.html)
- [Express Rate Limit - X-Forwarded-For Error](https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/)
