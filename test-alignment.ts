/**
 * Calculator Alignment Test
 * 
 * Verifies that Capacity Planner and Performance Calculator
 * produce consistent results when inverted.
 */

import { calculateCore } from './lib/core/core';
import { EFFICIENCY, SERVING, CAPACITY } from './lib/core/constants';

// Test configuration - matching defaults
const testConfig = {
    modelParams: 70,  // 70B model
    quantType: 'int8' as const,
    peakFlops: 1.98e15,  // H100 @ 1979 TFLOPS INT8
    vramPerUnit: 80,
    device: 'gpu' as const,
    kernelEfficiency: 0.5,
    utilizationFactor: 0.8,
    attentionOverhead: 0.1,
    prefillOverhead: 0.1,
    tokensPerSecPerUser: 10,
    avgResponseTokensPerRequest: 50,
    newInputTokensPerRequest: 100,
    systemPromptTokens: 0,
    sessionHistoryTokens: 0,
    activeKvFraction: 0.05,
    offloadRatio: 0,
    targetHeadroom: 0.1,
};

console.log('=== Calculator Alignment Test ===\n');

// Test 1: Capacity Planning (users → GPUs)
console.log('Test 1: Capacity Planning (100 users → ? GPUs)');
const capacityResult = calculateCore({
    ...testConfig,
    numUsers: 100,
});
console.log(`  Required GPUs: ${capacityResult.units}`);
console.log(`  Max Users (with ${capacityResult.units} GPUs): ${capacityResult.maxUsers.toFixed(0)}`);
console.log(`  Effective FLOPs/GPU: ${(capacityResult.effectiveFlopsPerUnit / 1e12).toFixed(2)} TFLOPS`);
console.log(`  FLOPs/user/sec: ${(capacityResult.flopsPerUserPerSec / 1e12).toFixed(4)} TFLOPS`);

// Test 2: Performance Calculation (GPUs → users)
console.log(`\nTest 2: Performance Calculation (${capacityResult.units} GPUs → ? users)`);
const performanceResult = calculateCore({
    ...testConfig,
    numUnits: capacityResult.units,
});
console.log(`  Max Users: ${performanceResult.maxUsers.toFixed(0)}`);
console.log(`  Max Throughput: ${performanceResult.maxThroughput.toFixed(0)} tokens/sec`);
console.log(`  Effective FLOPs/GPU: ${(performanceResult.effectiveFlopsPerUnit / 1e12).toFixed(2)} TFLOPS`);
console.log(`  FLOPs/user/sec: ${(performanceResult.flopsPerUserPerSec / 1e12).toFixed(4)} TFLOPS`);

// Alignment check
console.log('\n=== Alignment Check ===');
const requestedUsers = 100;
const calculatedMaxUsers = performanceResult.maxUsers;
const alignmentRatio = calculatedMaxUsers / requestedUsers;

console.log(`  Requested users in Capacity Planner: ${requestedUsers}`);
console.log(`  GPUs calculated: ${capacityResult.units}`);
console.log(`  Max users from Performance Calculator: ${calculatedMaxUsers.toFixed(0)}`);
console.log(`  Alignment ratio: ${(alignmentRatio * 100).toFixed(1)}%`);

if (alignmentRatio >= 1.0 && alignmentRatio <= 1.5) {
    console.log('\n✅ PASS: Calculators are mathematically aligned!');
    console.log('   The Performance Calculator shows the system can support >= requested users');
} else if (alignmentRatio >= 0.9) {
    console.log('\n⚠️  CLOSE: Minor discrepancy (< 10%)');
} else {
    console.log('\n❌ FAIL: Significant alignment issue detected');
    console.log(`   Expected ratio >= 1.0, got ${alignmentRatio.toFixed(2)}`);
}

// Additional tests with different user counts
console.log('\n=== Additional Alignment Tests ===');
const testCases = [50, 200, 500, 1000];

for (const users of testCases) {
    const cap = calculateCore({ ...testConfig, numUsers: users });
    const perf = calculateCore({ ...testConfig, numUnits: cap.units });
    const ratio = perf.maxUsers / users;
    const status = ratio >= 1.0 ? '✅' : (ratio >= 0.9 ? '⚠️' : '❌');
    console.log(`  ${users} users → ${cap.units} GPUs → ${perf.maxUsers.toFixed(0)} max users (${(ratio * 100).toFixed(0)}%) ${status}`);
}
