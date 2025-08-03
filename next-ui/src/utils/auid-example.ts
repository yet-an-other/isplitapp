import { Auid } from './auid';

// Example usage of the AUID utility
export function demonstrateAuid() {
    console.log('=== AUID (Alphanumeric Unique ID) Demo ===');
    
    // Create a new AUID generator
    const auidGenerator = new Auid();
    
    // Generate some unique IDs
    console.log('\nGenerating 5 unique IDs:');
    for (let i = 0; i < 5; i++) {
        const id = auidGenerator.generate();
        console.log(`ID ${i + 1}: ${id}`);
        
        // Parse the ID to show its components
        const parsed = Auid.parse(id);
        if (parsed) {
            console.log(`  -> Timestamp: ${parsed.timestamp.toISOString()}`);
            console.log(`  -> Factory ID: ${parsed.factoryId}`);
            console.log(`  -> Sequence: ${parsed.sequence}`);
        }
        console.log('');
    }
    
    // Test validation
    console.log('=== Validation Tests ===');
    const validId = auidGenerator.generate();
    console.log(`Valid ID: ${validId} -> ${Auid.isValid(validId)}`);
    console.log(`Invalid ID: "invalid123" -> ${Auid.isValid('invalid123')}`);
    console.log(`Invalid ID: "12345@67890" -> ${Auid.isValid('12345@67890')}`);
}

// Export a simple function to generate a single AUID
export function generateAuid(): string {
    const generator = new Auid();
    return generator.generate();
}

// Export the main class for more advanced usage
export { Auid } from './auid';

// For debugging - run the demo
if (import.meta.env.NODE_ENV === 'development') {
    // demonstrateAuid();
}