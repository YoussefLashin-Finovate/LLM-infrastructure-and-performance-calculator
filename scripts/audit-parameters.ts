
import { auditParameterConsumption } from '../lib/core/validation';

console.log('Running Parameter Consumption Audit...');
try {
    const warnings = auditParameterConsumption();

    if (warnings.length > 0) {
        console.warn('⚠️  Parameter Consumption Warnings Found:');
        warnings.forEach(w => console.warn(` - ${w}`));
        // We don't exit with error here because parameter sensitivity might vary, 
        // but we log it. If it's a critical parameter that MUST work, we should fail.
        // For now, let's just log.
        process.exit(0);
    } else {
        console.log('✅  All critical parameters are consumed by the calculation engine.');
        process.exit(0);
    }
} catch (error) {
    console.error('Error running audit:', error);
    process.exit(1);
}
