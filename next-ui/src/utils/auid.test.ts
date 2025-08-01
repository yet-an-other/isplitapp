import { describe, it, expect } from 'vitest';
import { Auid } from './auid';

describe('Auid', () => {
    it('should generate unique IDs', () => {
        const auid = new Auid();
        const id1 = auid.generate();
        const id2 = auid.generate();
        
        expect(id1).not.toBe(id2);
        expect(id1).toHaveLength(11);
        expect(id2).toHaveLength(11);
    });
    
    it('should generate valid base62 strings', () => {
        const auid = new Auid();
        const id = auid.generate();
        
        // Should be 11 characters long
        expect(id).toHaveLength(11);
        console.log(id);
        
        // Should only contain base62 characters
        const base62Pattern = /^[0-9A-Za-z]+$/;
        expect(id).toMatch(base62Pattern);
    });
    
    it('should validate AUID strings correctly', () => {
        const auid = new Auid();
        const validId = auid.generate();
        
        expect(Auid.isValid(validId)).toBe(true);
        expect(Auid.isValid('invalid')).toBe(false);
        expect(Auid.isValid('')).toBe(false);
        expect(Auid.isValid('12345678901')).toBe(true); // Valid length and characters
        expect(Auid.isValid('123456789@1')).toBe(false); // Invalid character
        expect(Auid.isValid('1234567890')).toBe(false); // Wrong length
    });
    
    it('should parse AUID strings correctly', () => {
        const auid = new Auid();
        const id = auid.generate();
        const parsed = Auid.parse(id);
        
        expect(parsed).not.toBeNull();
        expect(parsed!.timestamp).toBeInstanceOf(Date);
        expect(parsed!.factoryId).toBeGreaterThanOrEqual(0);
        expect(parsed!.sequence).toBeGreaterThanOrEqual(0);
        
        // Timestamp should be recent (within last minute)
        const now = new Date();
        const timeDiff = now.getTime() - parsed!.timestamp.getTime();
        expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    });
    
    it('should generate multiple unique IDs in sequence', () => {
        const auid = new Auid();
        const ids = new Set<string>();
        
        // Generate 1000 IDs to test sequence handling
        for (let i = 0; i < 1000; i++) {
            const id = auid.generate();
            expect(ids.has(id)).toBe(false); // Should be unique
            ids.add(id);
        }
        
        expect(ids.size).toBe(1000);
    });
    
    it('should handle epoch correctly', () => {
        const auid = new Auid();
        const id = auid.generate();
        const parsed = Auid.parse(id);
        
        expect(parsed).not.toBeNull();
        // Timestamp should be after the epoch (2020-01-01)
        const epoch = new Date('2020-01-01T00:00:00.000Z');
        expect(parsed!.timestamp.getTime()).toBeGreaterThan(epoch.getTime());
    });
    
    it('should parse invalid AUIDs as null', () => {
        expect(Auid.parse('invalid')).toBeNull();
        expect(Auid.parse('')).toBeNull();
        expect(Auid.parse('123456789@1')).toBeNull();
    });
});