'use strict';

const crypto = require('crypto');
const {
    v1,
    v3,
    v4,
    v5,
    v6,
    v7,
    validate: uuidValidate,
    version: uuidLibVersion,
    stringify: uuidStringify
} = require('uuid');
const { ulid, isValid: isValidUlid } = require('ulid');
const { createId, isCuid } = require('@paralleldrive/cuid2');
const { IDENTIFIER_CATALOG } = require('./identifier-catalog.js');

const QR_FORMAT_VERSION = 1;

/** Twitter Snowflake epoch (ms) */
const SNOWFLAKE_EPOCH = 1288834974657n;

class SnowflakeGenerator {
    constructor(datacenterId, workerId) {
        this.datacenterId = BigInt(datacenterId) & 31n;
        this.workerId = BigInt(workerId) & 31n;
        this.sequence = 0n;
        this.lastTs = -1n;
    }

    next() {
        let ts = BigInt(Date.now());
        if (ts === this.lastTs) {
            this.sequence = (this.sequence + 1n) & 4095n;
            if (this.sequence === 0n) {
                while (BigInt(Date.now()) <= ts) {
                    /* wait next ms */
                }
                ts = BigInt(Date.now());
            }
        } else {
            this.sequence = 0n;
        }
        this.lastTs = ts;
        const id =
            ((ts - SNOWFLAKE_EPOCH) << 22n) |
            (this.datacenterId << 17n) |
            (this.workerId << 12n) |
            this.sequence;
        return id.toString();
    }
}

function parseSnowflakeEnv() {
    const d = Number(process.env.SNOWFLAKE_DATACENTER_ID ?? process.env.SNOWFLAKE_DC_ID ?? 1);
    const w = Number(process.env.SNOWFLAKE_WORKER_ID ?? 1);
    const dc = Number.isFinite(d) ? Math.max(0, Math.min(31, Math.floor(d))) : 1;
    const wr = Number.isFinite(w) ? Math.max(0, Math.min(31, Math.floor(w))) : 1;
    return { datacenterId: dc, workerId: wr };
}

let _snowflake = null;
function getSnowflake() {
    if (!_snowflake) {
        const { datacenterId, workerId } = parseSnowflakeEnv();
        _snowflake = new SnowflakeGenerator(datacenterId, workerId);
    }
    return _snowflake;
}

function generateUuidV8() {
    const buf = Buffer.allocUnsafe(16);
    crypto.randomFillSync(buf);
    buf[6] = (buf[6] & 0x0f) | 0x80;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    return uuidStringify(buf);
}

const SUPPORTED_TYPES = new Set([
    'uuid-v1',
    'uuid-v2',
    'uuid-v3',
    'uuid-v4',
    'uuid-v5',
    'uuid-v6',
    'uuid-v7',
    'uuid-v8',
    'ulid',
    'cuid2',
    'snowflake'
]);

/**
 * @param {string} codeType
 * @param {{ namespace?: string, name?: string }} [options]
 */
function generateCode(codeType, options = {}) {
    if (!SUPPORTED_TYPES.has(codeType)) {
        const err = new Error(`Неподдържан тип: ${codeType}`);
        err.code = 'UNSUPPORTED_TYPE';
        throw err;
    }

    switch (codeType) {
        case 'uuid-v1':
            return v1();
        case 'uuid-v2':
            throw Object.assign(new Error('UUID v2 не се генерира (DCE/OS специфичен). Виж каталога.'), {
                code: 'UUID_V2_UNSUPPORTED'
            });
        case 'uuid-v3': {
            const ns = options.namespace || v3.DNS;
            const name = options.name || crypto.randomBytes(16).toString('hex');
            return v3(name, ns);
        }
        case 'uuid-v4':
            return v4();
        case 'uuid-v5': {
            const ns = options.namespace || v5.DNS;
            const name = options.name || crypto.randomBytes(16).toString('hex');
            return v5(name, ns);
        }
        case 'uuid-v6':
            return v6();
        case 'uuid-v7':
            return v7();
        case 'uuid-v8':
            return generateUuidV8();
        case 'ulid':
            return ulid();
        case 'cuid2':
            return createId();
        case 'snowflake':
            return getSnowflake().next();
        default:
            throw new Error('Unreachable');
    }
}

function detectCodeType(code) {
    const s = String(code).trim();
    if (!s) return null;
    if (uuidValidate(s)) {
        const ver = uuidLibVersion(s);
        return `uuid-v${ver}`;
    }
    if (isValidUlid(s)) return 'ulid';
    if (isCuid(s)) return 'cuid2';
    if (/^\d{15,20}$/.test(s)) return 'snowflake';
    return null;
}

/**
 * @param {string} code
 * @param {string} [codeType] - ако липсва, авто-разпознаване
 */
function validateCode(code, codeType) {
    const s = String(code).trim();
    if (!s) {
        return { valid: false, reason: 'Празен код', detectedType: null };
    }

    const detected = detectCodeType(s);
    if (!detected) {
        return { valid: false, reason: 'Неизвестен формат', detectedType: null };
    }

    if (!codeType || codeType === detected) {
        return finishValidate(s, detected);
    }

    if (codeType.startsWith('uuid-v') && detected.startsWith('uuid-v')) {
        const wanted = parseInt(codeType.replace('uuid-v', ''), 10);
        const got = uuidLibVersion(s);
        if (Number.isFinite(wanted) && got !== wanted) {
            return {
                valid: false,
                reason: `Очакван UUID v${wanted}, открит v${got}`,
                detectedType: `uuid-v${got}`
            };
        }
        return finishValidate(s, detected);
    }

    if (codeType !== detected) {
        return {
            valid: false,
            reason: `Очакван тип ${codeType}, открит ${detected}`,
            detectedType: detected
        };
    }

    return finishValidate(s, detected);
}

function finishValidate(s, detected) {
    if (detected === 'snowflake') {
        try {
            BigInt(s);
        } catch {
            return { valid: false, reason: 'Невалиден Snowflake', detectedType: 'snowflake' };
        }
    }
    return { valid: true, reason: null, detectedType: detected };
}

function buildQrPayload({ code, codeType, humanDescription, codeGroup }) {
    const payload = {
        mf: QR_FORMAT_VERSION,
        t: codeType,
        c: code,
        d: humanDescription != null ? String(humanDescription) : '',
        g: codeGroup != null ? String(codeGroup) : ''
    };
    const json = JSON.stringify(payload);
    return { payloadJson: payload, qrRawString: json };
}

/**
 * Отделя каноничния код от QR съдържание (JSON или само код).
 */
function parseQrPayload(raw) {
    const text = String(raw).trim();
    if (!text) {
        return { ok: false, error: 'Празен низ', code: null };
    }

    if (text.startsWith('{')) {
        try {
            const o = JSON.parse(text);
            if (o && typeof o === 'object' && o.c != null) {
                return {
                    ok: true,
                    formatVersion: o.mf,
                    codeType: o.t || null,
                    code: String(o.c).trim(),
                    humanDescription: o.d != null ? String(o.d) : '',
                    codeGroup: o.g != null ? String(o.g) : ''
                };
            }
        } catch {
            return { ok: false, error: 'Невалиден JSON', code: null };
        }
    }

    const detected = detectCodeType(text);
    if (detected) {
        return {
            ok: true,
            formatVersion: null,
            codeType: detected,
            code: text,
            humanDescription: '',
            codeGroup: '',
            note: 'Суров идентификатор без MamaFood JSON обвивка'
        };
    }

    return { ok: false, error: 'Не може да се извлече валиден идентификатор', code: null };
}

const GENERATABLE_TYPES = Array.from(SUPPORTED_TYPES).filter((t) => t !== 'uuid-v2');

module.exports = {
    IDENTIFIER_CATALOG,
    QR_FORMAT_VERSION,
    SUPPORTED_TYPES: Array.from(SUPPORTED_TYPES),
    GENERATABLE_TYPES,
    generateCode,
    validateCode,
    detectCodeType,
    buildQrPayload,
    parseQrPayload,
    getSnowflake
};
