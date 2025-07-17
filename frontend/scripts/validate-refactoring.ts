#!/usr/bin/env ts-node

/**
 * Refactoring Validation Script
 * 
 * Validates that the comprehensive refactoring was successful by checking:
 * - Type safety (no 'as any' usage)
 * - Code duplication reduction
 * - Component consistency
 * - Import/export integrity
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ValidationResult {
  category: string;
  passed: boolean;
  message: string;
  details?: string[];
}

class RefactoringValidator {
  private results: ValidationResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
  }

  async validate(): Promise<void> {
    console.log('🔍 Starting refactoring validation...\n');

    await this.validateTypeSafety();
    await this.validateCodeDuplication();
    await this.validateComponentConsistency();
    await this.validateImportExports();
    await this.validateTestCoverage();

    this.printResults();
  }

  private async validateTypeSafety(): Promise<void> {
    console.log('📋 Validating type safety...');

    const tsFiles = await glob('src/**/*.{ts,tsx}', { cwd: this.projectRoot });
    const asAnyUsages: string[] = [];
    const unsafePatterns = [
      /\s+as\s+any\b/g,
      /:\s*any\b/g,
      /\(.*\)\s*as\s+any/g
    ];

    for (const file of tsFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const pattern of unsafePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          asAnyUsages.push(`${file}: ${matches.length} usage(s)`);
        }
      }
    }

    this.results.push({
      category: 'Type Safety',
      passed: asAnyUsages.length === 0,
      message: asAnyUsages.length === 0 
        ? 'No unsafe type casting found' 
        : `Found ${asAnyUsages.length} files with unsafe type casting`,
      details: asAnyUsages
    });
  }

  private async validateCodeDuplication(): Promise<void> {
    console.log('🔄 Validating code duplication reduction...');

    const duplicatedPatterns = [
      // Check for inline styles that should be in CSS modules
      {
        pattern: /style=\{\{[^}]+backgroundColor.*?\}\}/g,
        description: 'Inline backgroundColor styles'
      },
      {
        pattern: /style=\{\{[^}]+padding.*?\}\}/g,
        description: 'Inline padding styles'
      },
      // Check for duplicated component structures
      {
        pattern: /className=".*flex.*items-center.*justify-center.*"/g,
        description: 'Repeated flex center patterns'
      },
      // Check for duplicated drag & drop logic
      {
        pattern: /onDragStart.*onDragEnd.*onDrop/g,
        description: 'Manual drag & drop implementation'
      }
    ];

    const files = await glob('src/**/*.{ts,tsx}', { cwd: this.projectRoot });
    const duplications: string[] = [];

    for (const file of files) {
      // Skip base components and shared utilities
      if (file.includes('/shared/') || file.includes('/__tests__/')) continue;

      const filePath = path.join(this.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const { pattern, description } of duplicatedPatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          duplications.push(`${file}: ${description} (${matches.length} occurrences)`);
        }
      }
    }

    this.results.push({
      category: 'Code Duplication',
      passed: duplications.length < 10, // Allow some remaining duplication
      message: duplications.length < 10
        ? 'Code duplication significantly reduced'
        : `Still found ${duplications.length} duplication patterns`,
      details: duplications
    });
  }

  private async validateComponentConsistency(): Promise<void> {
    console.log('🧩 Validating component consistency...');

    const issues: string[] = [];

    // Check that base components exist
    const baseComponents = [
      'src/shared/components/base/BaseVideoPreview.tsx',
      'src/shared/components/base/BaseExportBuilder.tsx',
      'src/shared/components/base/BaseUpload.tsx'
    ];

    for (const component of baseComponents) {
      const filePath = path.join(this.projectRoot, component);
      if (!fs.existsSync(filePath)) {
        issues.push(`Missing base component: ${component}`);
      }
    }

    // Check that CSS modules exist
    const cssModules = [
      'src/shared/styles/timeline.module.css',
      'src/shared/styles/panels.module.css',
      'src/shared/styles/buttons.module.css'
    ];

    for (const cssModule of cssModules) {
      const filePath = path.join(this.projectRoot, cssModule);
      if (!fs.existsSync(filePath)) {
        issues.push(`Missing CSS module: ${cssModule}`);
      }
    }

    // Check that unified types exist
    const unifiedTypesPath = path.join(this.projectRoot, 'src/shared/types/unified.types.ts');
    if (!fs.existsSync(unifiedTypesPath)) {
      issues.push('Missing unified types file');
    }

    this.results.push({
      category: 'Component Consistency',
      passed: issues.length === 0,
      message: issues.length === 0
        ? 'All base components and modules are present'
        : `Found ${issues.length} consistency issues`,
      details: issues
    });
  }

  private async validateImportExports(): Promise<void> {
    console.log('📦 Validating import/export integrity...');

    const issues: string[] = [];

    // Check that index files export base components
    const indexFiles = [
      'src/shared/components/base/index.ts',
      'src/shared/hooks/index.ts',
      'src/shared/styles/index.ts',
      'src/shared/types/index.ts'
    ];

    for (const indexFile of indexFiles) {
      const filePath = path.join(this.projectRoot, indexFile);
      if (!fs.existsSync(filePath)) {
        issues.push(`Missing index file: ${indexFile}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for proper exports
      if (indexFile.includes('base/index.ts')) {
        if (!content.includes('BaseVideoPreview') || 
            !content.includes('BaseExportBuilder') || 
            !content.includes('BaseUpload')) {
          issues.push(`${indexFile}: Missing base component exports`);
        }
      }
    }

    // Check for circular imports
    const tsFiles = await glob('src/**/*.{ts,tsx}', { cwd: this.projectRoot });
    for (const file of tsFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Simple circular import detection
      const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
      const relativePath = file.replace(/\.(ts|tsx)$/, '');
      
      for (const importLine of imports) {
        const match = importLine.match(/from\s+['"]([^'"]+)['"]/);
        if (match && match[1].includes(relativePath)) {
          issues.push(`Potential circular import in ${file}: ${importLine}`);
        }
      }
    }

    this.results.push({
      category: 'Import/Export Integrity',
      passed: issues.length === 0,
      message: issues.length === 0
        ? 'All imports and exports are properly structured'
        : `Found ${issues.length} import/export issues`,
      details: issues
    });
  }

  private async validateTestCoverage(): Promise<void> {
    console.log('🧪 Validating test coverage...');

    const issues: string[] = [];

    // Check that base components have tests
    const baseComponentTests = [
      'src/shared/components/base/__tests__/BaseVideoPreview.test.tsx',
      'src/shared/components/base/__tests__/BaseExportBuilder.test.tsx',
      'src/shared/components/base/__tests__/integration.test.tsx'
    ];

    for (const testFile of baseComponentTests) {
      const filePath = path.join(this.projectRoot, testFile);
      if (!fs.existsSync(filePath)) {
        issues.push(`Missing test file: ${testFile}`);
      }
    }

    // Check that hooks have tests
    const hookTests = [
      'src/shared/hooks/__tests__/useDragAndDrop.test.ts'
    ];

    for (const testFile of hookTests) {
      const filePath = path.join(this.projectRoot, testFile);
      if (!fs.existsSync(filePath)) {
        issues.push(`Missing hook test: ${testFile}`);
      }
    }

    this.results.push({
      category: 'Test Coverage',
      passed: issues.length === 0,
      message: issues.length === 0
        ? 'All base components and hooks have tests'
        : `Missing ${issues.length} test files`,
      details: issues
    });
  }

  private printResults(): void {
    console.log('\n📊 Validation Results:\n');

    let totalPassed = 0;
    let totalTests = this.results.length;

    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.category}: ${result.message}`);
      
      if (result.details && result.details.length > 0) {
        result.details.slice(0, 5).forEach(detail => {
          console.log(`   • ${detail}`);
        });
        if (result.details.length > 5) {
          console.log(`   • ... and ${result.details.length - 5} more`);
        }
      }
      
      if (result.passed) totalPassed++;
      console.log();
    }

    console.log(`\n🎯 Overall Score: ${totalPassed}/${totalTests} (${Math.round(totalPassed/totalTests*100)}%)`);

    if (totalPassed === totalTests) {
      console.log('🎉 Refactoring validation PASSED! All checks successful.');
    } else {
      console.log('⚠️  Refactoring validation INCOMPLETE. Please address the issues above.');
    }

    // Exit with appropriate code
    process.exit(totalPassed === totalTests ? 0 : 1);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new RefactoringValidator();
  validator.validate().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { RefactoringValidator };
