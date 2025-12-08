import { calculateModelSize } from '@/lib/calculationParameters';
import { 
  MODEL_OPTIONS, 
  QUANTIZATION_OPTIONS, 
  CALCULATION_CONSTANTS, 
  HELPER_TEXT,
  UI_CONFIG,
  INFO_CONTENT 
} from '@/lib/config';
import { useHardwareGroups } from '@/hooks/useHardwareFilter';

interface CapacityPlannerProps {
  model: string;
  setModel: (value: string) => void;
  quantization: string;
  setQuantization: (value: string) => void;
  hardware: string;
  setHardware: (value: string) => void;
  users: number;
  setUsers: (value: number) => void;
  inputLength: number;
  setInputLength: (value: number) => void;
  tokensPerSec: number;
  setTokensPerSec: (value: number) => void;
  utilization: number;
  setUtilization: (value: number) => void;
  results: {
    unitsNeeded: number;
    throughputPerUnit: number;
    totalSystemThroughput: number;
    headroom: number;
    totalOverheadPercent: number;
    overheadBreakdown: string[];
    totalVRAM: number;
    totalFLOPS: number;
    modelSize: number;
    vramPerUnit: number;
  };
}

export default function CapacityPlanner({
  model,
  setModel,
  quantization,
  setQuantization,
  hardware,
  setHardware,
  users,
  setUsers,
  inputLength,
  setInputLength,
  tokensPerSec,
  setTokensPerSec,
  utilization,
  setUtilization,
  results,
}: CapacityPlannerProps) {
  const hardwareGroups = useHardwareGroups(quantization);
  
  return (
    <div className="calc-grid">
      {/* Input Panel */}
      <div className="calc-input-panel">
        <h3 style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          fontSize: UI_CONFIG.typography.subheadingSize,
          color: UI_CONFIG.colors.primary,
          fontWeight: '800',
          paddingBottom: '16px',
          borderBottom: `3px solid ${UI_CONFIG.colors.borderLight}`
        }}>
          <span>{UI_CONFIG.icons.requirements}</span> Requirements
        </h3>
        
        <div className="input-group">
          <label htmlFor="reverse_model">Model Size</label>
          <select id="reverse_model" value={model} onChange={(e) => setModel(e.target.value)}>
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
          <small>{HELPER_TEXT.modelSize(calculateModelSize(parseFloat(model), quantization))}</small>
        </div>

        <div className="input-group">
          <label htmlFor="reverse_quantization">Quantization Level</label>
          <select id="reverse_quantization" value={quantization} onChange={(e) => setQuantization(e.target.value)}>
            {QUANTIZATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
          <small>{HELPER_TEXT.quantizationNote}</small>
        </div>

        <div className="input-group">
          <label htmlFor="reverse_users">Required Concurrent Users</label>
          <input 
            type="number" 
            id="reverse_users" 
            value={users}
            onChange={(e) => setUsers(parseInt(e.target.value))}
            step={CALCULATION_CONSTANTS.steps.users}
            min="1" 
          />
          <small>{HELPER_TEXT.usersNote}</small>
        </div>

        <div className="input-group">
          <label htmlFor="reverse_input">Avg Input Length (tokens)</label>
          <input 
            type="number" 
            id="reverse_input" 
            value={inputLength}
            onChange={(e) => setInputLength(parseInt(e.target.value))}
            step={CALCULATION_CONSTANTS.steps.inputLength}
            min="1" 
          />
          <small>{HELPER_TEXT.inputLengthNote}</small>
        </div>

        <div className="input-group">
          <label htmlFor="reverse_tokens">Output Tokens/sec per User</label>
          <input 
            type="number" 
            id="reverse_tokens" 
            value={tokensPerSec}
            onChange={(e) => setTokensPerSec(parseFloat(e.target.value))}
            step={CALCULATION_CONSTANTS.steps.tokensPerSec}
            min="0.1" 
          />
          <small>{HELPER_TEXT.outputRateNote}</small>
        </div>

        <div className="input-group">
          <label htmlFor="reverse_hardware">Target Hardware</label>
          <select id="reverse_hardware" value={hardware} onChange={(e) => setHardware(e.target.value)}>
            {hardwareGroups.map((group: any) => (
              <optgroup key={group.family} label={group.family}>
                {group.options.map((hw: any, idx: number) => (
                  <option key={idx} value={hw.value}>{hw.name} - {hw.memory}GB</option>
                ))}
              </optgroup>
            ))}
          </select>
          <small>All hardware options available ({hardwareGroups.reduce((acc: number, g: any) => acc + g.options.length, 0)} total)</small>
        </div>

        <div className="input-group">
          <label htmlFor="reverse_util">Utilization Factor</label>
          <input 
            type="number" 
            id="reverse_util" 
            value={utilization}
            onChange={(e) => setUtilization(parseFloat(e.target.value))}
            step={CALCULATION_CONSTANTS.steps.utilization}
            min={CALCULATION_CONSTANTS.utilizationMin}
            max={CALCULATION_CONSTANTS.utilizationMax}
          />
          <small>{HELPER_TEXT.utilizationTypical}</small>
        </div>
      </div>

      {/* Results Panel */}
      <div className="calc-results-panel">
        <h3 style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          fontSize: UI_CONFIG.typography.subheadingSize,
          color: UI_CONFIG.colors.primary,
          fontWeight: '800',
          paddingBottom: '16px',
          borderBottom: `3px solid ${UI_CONFIG.colors.borderLight}`
        }}>
          <span>{UI_CONFIG.icons.capacity}</span> Infrastructure Requirements
        </h3>
      
        <div className="result-card">
          <div className="result-icon">{UI_CONFIG.icons.capacity}</div>
          <div className="result-content">
            <div className="result-label">Hardware Units Needed</div>
            <div className="result-value">{results.unitsNeeded}</div>
            <div className="result-sublabel">(Total overhead: {results.totalOverheadPercent.toFixed(0)}% | Breakdown: {results.overheadBreakdown.join(', ')})</div>
            <div className="result-equation">
              {users} users × {tokensPerSec} t/s = {(users * tokensPerSec).toFixed(1)} t/s → × {(1 + results.totalOverheadPercent / 100).toFixed(2)} ({results.totalOverheadPercent.toFixed(0)}% overhead) = {(users * tokensPerSec * (1 + results.totalOverheadPercent / 100)).toFixed(1)} t/s required → {results.unitsNeeded} units needed
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-icon">{UI_CONFIG.icons.performance}</div>
          <div className="result-content">
            <div className="result-label">Total Throughput</div>
            <div className="result-value">{results.totalSystemThroughput.toFixed(1)}</div>
            <div className="result-sublabel">
              ({results.throughputPerUnit.toFixed(1)} tokens/sec per unit, {results.headroom.toFixed(0)}% spare capacity)
            </div>
            <div className="result-equation">
              Base load: {(users * tokensPerSec).toFixed(1)} t/s | Production requirement: {(users * tokensPerSec * (1 + results.totalOverheadPercent / 100)).toFixed(1)} t/s | Deployed capacity: {results.totalSystemThroughput.toFixed(1)} t/s
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-icon">{UI_CONFIG.icons.memory}</div>
          <div className="result-content">
            <div className="result-label">Total VRAM Accumulated</div>
            <div className="result-value">{results.totalVRAM.toFixed(0)} GB</div>
            <div className="result-sublabel">
              ({results.vramPerUnit} GB per unit × {results.unitsNeeded} units | Model size: {results.modelSize.toFixed(1)} GB)
            </div>
            <div className="result-equation">
              Per-unit VRAM: {results.vramPerUnit} GB × {results.unitsNeeded} units = {results.totalVRAM.toFixed(0)} GB total
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-icon">{UI_CONFIG.icons.compute}</div>
          <div className="result-content">
            <div className="result-label">Total FLOPS Accumulated</div>
            <div className="result-value">{(results.totalFLOPS / 1e15).toFixed(2)} PFLOPS</div>
            <div className="result-sublabel">
              ({(results.totalFLOPS / results.unitsNeeded / 1e12).toFixed(1)} TFLOPS per unit × {results.unitsNeeded} units)
            </div>
            <div className="result-equation">
              Per-unit: {(results.totalFLOPS / results.unitsNeeded / 1e12).toFixed(1)} TFLOPS × {results.unitsNeeded} units = {(results.totalFLOPS / 1e15).toFixed(2)} PFLOPS
            </div>
          </div>
        </div>

        <div className="calc-info">
          <strong>{INFO_CONTENT.productionPlanning}</strong>
        </div>
      </div>
    </div>
  );
}
