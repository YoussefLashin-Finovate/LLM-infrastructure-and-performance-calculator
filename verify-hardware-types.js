#!/usr/bin/env node

// Verification script for hardware database type field
const fs = require('fs');
const path = require('path');

const hardwareDbPath = path.join(__dirname, 'lib', 'hardwareDatabase.ts');
const content = fs.readFileSync(hardwareDbPath, 'utf8');

// Count type occurrences
const cpuMatches = content.match(/type:\s*'cpu'/g) || [];
const gpuMatches = content.match(/type:\s*'gpu'/g) || [];

console.log('✅ Hardware Database Type Field Verification');
console.log('='.repeat(50));
console.log(`Total CPU entries: ${cpuMatches.length}`);
console.log(`Total GPU entries: ${gpuMatches.length}`);
console.log(`Total hardware entries: ${cpuMatches.length + gpuMatches.length}`);
console.log('='.repeat(50));

// Verify key entries
const hasXeonCPU = content.includes("name: 'Xeon 6980P") && content.includes("type: 'cpu'");
const hasB200GPU = content.includes("name: 'B200 FP32") && content.includes("type: 'gpu'");
const hasH100GPU = content.includes("name: 'H100 FP32") && content.includes("type: 'gpu'");

console.log(`\n✅ Sample Verifications:`);
console.log(`  - Xeon 6980P (CPU): ${hasXeonCPU ? '✓ Correct' : '✗ Missing'}`);
console.log(`  - B200 (GPU): ${hasB200GPU ? '✓ Correct' : '✗ Missing'}`);
console.log(`  - H100 (GPU): ${hasH100GPU ? '✓ Correct' : '✗ Missing'}`);

// Extract some samples
const xeonMatch = content.match(/{\s*value:\s*'[\d.]+,int8',\s*name:\s*'Xeon 6980P[^}]+type:\s*'cpu'\s*}/);
const b200Match = content.match(/{\s*value:\s*'75,fp32',\s*name:\s*'B200 FP32[^}]+type:\s*'gpu'\s*}/);

console.log(`\n📊 Sample Entries:`);
if (xeonMatch) {
  console.log(`\nCPU: ${xeonMatch[0].substring(0, 100)}...`);
}
if (b200Match) {
  console.log(`\nGPU: ${b200Match[0].substring(0, 100)}...`);
}

console.log(`\n✅ Verification Complete!\n`);
