/**
 * AUID (Alphanumeric Unique ID) - TypeScript implementation
 * Compatible with the C# version in isplitapp-core/Utils/Ids
 * 
 * Structure: 63 bits total
 * - 41 bits: timestamp (milliseconds since epoch 2020-01-01 00:00:00 UTC)
 * - 12 bits: factory/machine ID (random for client-side)
 * - 10 bits: sequence number
 * 
 * Result is encoded as 11-character base62 string
 */
export class Auid {
    private static readonly EPOCH = new Date('2020-01-01T00:00:00.000Z').getTime();
    private static readonly TIMESTAMP_BITS = 41;
    private static readonly FACTORY_ID_BITS = 12;
    private static readonly SEQUENCE_BITS = 10;
    private static readonly ID_LENGTH = 11;
    
    // Maximum values for each component
    private static readonly MAX_TIMESTAMP = (1n << BigInt(Auid.TIMESTAMP_BITS)) - 1n;
    private static readonly MAX_FACTORY_ID = (1 << Auid.FACTORY_ID_BITS) - 1;
    private static readonly MAX_SEQUENCE = (1 << Auid.SEQUENCE_BITS) - 1;
    
    // Bit shifts
    private static readonly SHIFT_TIMESTAMP = Auid.FACTORY_ID_BITS + Auid.SEQUENCE_BITS;
    private static readonly SHIFT_FACTORY_ID = Auid.SEQUENCE_BITS;
    
    // Base62 alphabet - same order as C# implementation
    private static readonly BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    private static readonly BASE62_VALUES: Record<string, number> = {};
    
    // Instance variables for sequence management
    private factoryId: number;
    private lastTimestamp = -1n;
    private sequence = 0;
    
    static {
        // Initialize base62 lookup table
        for (let i = 0; i < Auid.BASE62_ALPHABET.length; i++) {
            Auid.BASE62_VALUES[Auid.BASE62_ALPHABET[i]] = i;
        }
    }
    
    constructor() {
        // Generate a random factory ID for client-side use
        this.factoryId = Math.floor(Math.random() * (Auid.MAX_FACTORY_ID + 1));
    }
    
    /**
     * Generates a new unique AUID string
     * @returns 11-character base62 encoded unique ID
     */
    generate(): string {
        const longId = this.createInt64Id();
        return this.toBase62(longId, Auid.ID_LENGTH);
    }
    
    private createInt64Id(): bigint {
        const now = BigInt(Date.now());
        const epochTimestamp = now - BigInt(Auid.EPOCH);
        const timestamp = epochTimestamp & Auid.MAX_TIMESTAMP;
        
        // Check for clock moving backwards
        if (timestamp < this.lastTimestamp) {
            throw new Error(`Clock moved backwards. Refusing to generate ID for ${this.lastTimestamp - timestamp} milliseconds`);
        }
        
        // Handle sequence within the same timestamp
        if (timestamp === this.lastTimestamp) {
            if (this.sequence >= Auid.MAX_SEQUENCE) {
                // Wait for next millisecond
                while (this.lastTimestamp === timestamp) {
                    const newNow = BigInt(Date.now());
                    const newEpochTimestamp = newNow - BigInt(Auid.EPOCH);
                    const newTimestamp = newEpochTimestamp & Auid.MAX_TIMESTAMP;
                    if (newTimestamp !== timestamp) {
                        return this.createInt64Id(); // Try again with new timestamp
                    }
                }
                return this.createInt64Id(); // Try again
            }
            this.sequence++;
        } else {
            this.sequence = 0;
            this.lastTimestamp = timestamp;
        }
        
        // Combine all parts into a single 63-bit number
        const timestampPart = timestamp << BigInt(Auid.SHIFT_TIMESTAMP);
        const factoryIdPart = BigInt(this.factoryId) << BigInt(Auid.SHIFT_FACTORY_ID);
        const sequencePart = BigInt(this.sequence);
        
        return timestampPart | factoryIdPart | sequencePart;
    }
    
    private toBase62(value: bigint, length: number): string {
        const base = BigInt(Auid.BASE62_ALPHABET.length);
        const buffer = new Array(length);
        let workingValue = value;
        
        for (let i = length - 1; i >= 0; i--) {
            buffer[i] = Auid.BASE62_ALPHABET[Number(workingValue % base)];
            workingValue = workingValue / base;
        }
        
        return buffer.join('');
    }
    
    /**
     * Validates if a string is a valid AUID format
     * @param auid The string to validate
     * @returns true if valid AUID format
     */
    static isValid(auid: string): boolean {
        if (!auid || auid.length !== Auid.ID_LENGTH) {
            return false;
        }
        
        for (const char of auid) {
            if (!(char in Auid.BASE62_VALUES)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Parses an AUID string back to its component parts
     * @param auid The AUID string to parse
     * @returns Object containing timestamp, factoryId, and sequence
     */
    static parse(auid: string): { timestamp: Date; factoryId: number; sequence: number } | null {
        if (!Auid.isValid(auid)) {
            return null;
        }
        
        const longId = Auid.fromBase62(auid);
        
        // Extract components using bit masks and shifts
        const timestamp = (longId >> BigInt(Auid.SHIFT_TIMESTAMP)) & Auid.MAX_TIMESTAMP;
        const factoryId = Number((longId >> BigInt(Auid.SHIFT_FACTORY_ID)) & BigInt(Auid.MAX_FACTORY_ID));
        const sequence = Number(longId & BigInt(Auid.MAX_SEQUENCE));
        
        // Convert timestamp back to Date
        const timestampMs = Number(timestamp) + Auid.EPOCH;
        const date = new Date(timestampMs);
        
        return {
            timestamp: date,
            factoryId,
            sequence
        };
    }
    
    private static fromBase62(base62: string): bigint {
        const base = BigInt(Auid.BASE62_ALPHABET.length);
        let value = 0n;
        const length = base62.length;
        
        for (let i = 0; i < length; i++) {
            const char = base62[i];
            const charValue = BigInt(Auid.BASE62_VALUES[char]);
            value += charValue * (base ** BigInt(length - 1 - i));
        }
        
        return value;
    }
}