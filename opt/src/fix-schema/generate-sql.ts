import { SQLGenerator } from './sql-generator';
import * as path from 'path';

/**
 * Example usage of the SQL Generator
 */
function main() {
  try {
    // Path to the ecommerce schema JSON file
    const schemaPath = path.join(__dirname, 'ecommerce-schema.json');
    const outputPath = path.join(__dirname, 'ecommerce-schema.sql');
    
    console.log('🚀 Generating SQL from ecommerce schema...');
    console.log(`📁 Schema file: ${schemaPath}`);
    console.log(`📄 Output file: ${outputPath}`);
    
    // Create generator instance
    const generator = new SQLGenerator(schemaPath);
    
    // Generate and save SQL
    generator.saveToFile(outputPath);
    
    // Display schema information
    console.log('\n📊 Schema Information:');
    console.log(`   Tables: ${generator.getTableNames().length}`);
    console.log(`   Table names: ${generator.getTableNames().join(', ')}`);
    
    // Generate SQL for specific tables (example)
    console.log('\n🔍 Example: Generate SQL for users table only:');
    const usersTableSQL = generator.generateTableSQL('users');
    console.log(usersTableSQL);
    
    // Generate SQL for multiple tables (example)
    console.log('\n🔍 Example: Generate SQL for auth-related tables:');
    const authTablesSQL = generator.generateTablesSQL(['users', 'addresses']);
    console.log(authTablesSQL);
    
    console.log('\n✅ SQL generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the example
main();
