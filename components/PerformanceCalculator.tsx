import { hardwareDatabase } from '@/lib/hardwareDatabase';
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

interface PerformanceCalculatorProps {
  model: string;
  setModel: (value: string) => void;
  quantization: string;
  setQuantization: (value: string) => void;
  hardware: string;
  setHardware: (value: string) => void;
  utilization: number;
  setUtilization: (value: number) => void;
  inputLength: number;
  setInputLength: (value: number) => void;
  responseLength: number;
  setResponseLength: (value: number) => void;
  thinkTime: number;
  setThinkTime: (value: number) => void;
  results: {
    theoretical: number;
    realistic: number;
    users: number;
    words: number;
    tokensPerSecPerUser: number;
    isMemoryBound: boolean;
    prefillOverhead: number;
    attentionOverhead: number;
  };
}

export default function PerformanceCalculator({
  model,
  setModel,
  quantization,
  setQuantization,
  hardware,
  setHardware,
  utilization,
  setUtilization,
  inputLength,
  setInputLength,
  responseLength,
  setResponseLength,
  thinkTime,
  setThinkTime,
  results,
}: PerformanceCalculatorProps) {
  const hardwareGroups = useHardwareGroups(quantization);
  const { theoretical, realistic, users, words, tokensPerSecPerUser, isMemoryBound, prefillOverhead, attentionOverhead } = results;
  
  const performanceNotes = [];
  if (isMemoryBound) performanceNotes.push('Memory-bound');
  if (prefillOverhead > 0) performanceNotes.push(`${(prefillOverhead * 100).toFixed(0)}% prefill overhead`);
  if (attentionOverhead > 0) performanceNotes.push(`${(attentionOverhead * 100).toFixed(0)}% attention overhead`);
  const noteText = performanceNotes.length > 0 ? ` (${performanceNotes.join(', ')})` : '';

  return (
    <div className="calc-grid">
      {/* Workload Settings Panel */}
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
          <span>{UI_CONFIG.icons.settings}</span> Workload Settings
        </h3>
      
        <div className="input-group">
          <label htmlFor="calc_model">Model Size</label>
          <select id="calc_model" value={model} onChange={(e) => setModel(e.target.value)}>
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
          <small>{HELPER_TEXT.modelSize(calculateModelSize(parseFloat(model), quantization))}</small>
        </div>

        <div className="input-group">
          <label htmlFor="calc_quantization">Quantization Level</label>
          <select id="calc_quantization" value={quantization} onChange={(e) => setQuantization(e.target.value)}>
            {QUANTIZATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
          <small>{HELPER_TEXT.quantizationNote}</small>
        </div>

        <div className="input-group">
          <label htmlFor="calc_hardware">Hardware Configuration</label>
          <select id="calc_hardware" value={hardware} onChange={(e) => setHardware(e.target.value)}>
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
          <label htmlFor="calc_util">Utilization Factor</label>
          <input 
            type="number" 
            id="calc_util" 
            value={utilization} 
            onChange={(e) => setUtilization(parseFloat(e.target.value))}
            step={CALCULATION_CONSTANTS.steps.utilization}
            min={CALCULATION_CONSTANTS.utilizationMin}
            max={CALCULATION_CONSTANTS.utilizationMax}
          />
          <small>{HELPER_TEXT.utilizationTypical}</small>
        </div>

        <div className="input-group">
          <label htmlFor="calc_input">Avg Input Length (tokens)</label>
          <input 
            type="number" 
            id="calc_input" 
            value={inputLength}
            onChange={(e) => setInputLength(parseInt(e.target.value))}
            step={CALCULATION_CONSTANTS.steps.inputLength}
            min="1" 
          />
          <small>{HELPER_TEXT.inputLengthNote}</small>
        </div>

        <div className="input-group">
          <label htmlFor="calc_response">Avg Response Length (tokens)</label>
          <input 
            type="number" 
            id="calc_response" 
            value={responseLength}
            onChange={(e) => setResponseLength(parseInt(e.target.value))}
            step={CALCULATION_CONSTANTS.steps.responseLength}
            min="10" 
          />
        </div>

        <div className="input-group">
          <label htmlFor="calc_think">Think Time (seconds)</label>
          <input 
            type="number" 
            id="calc_think" 
            value={thinkTime}
            onChange={(e) => setThinkTime(parseFloat(e.target.value))}
            step={CALCULATION_CONSTANTS.steps.thinkTime}
            min={CALCULATION_CONSTANTS.minThinkTime}
          />
          <small>{HELPER_TEXT.thinkTimeNote}</small>
        </div>
      </div>

      {/* Performance Results Panel */}
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
          <span>{UI_CONFIG.icons.performance}</span> Performance Analysis
        </h3>
        
        <div className="result-card">
          <div className="result-icon">{UI_CONFIG.icons.target}</div>
          <div className="result-content">
            <div className="result-label">Theoretical Tokens/sec</div>
            <div className="result-value">{theoretical.toFixed(1)}</div>
            <div className="result-equation">
              {parseFloat(hardware.split(',')[0]).toFixed(1)}e12 ÷ (6 × {model} × 10⁹) = {theoretical.toFixed(1)} tokens/sec
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-icon">{UI_CONFIG.icons.performance}</div>
          <div className="result-content">
            <div className="result-label">Realistic Tokens/sec</div>
            <div className="result-value">{realistic.toFixed(1)}</div>
            <div className="result-sublabel">≈{words.toFixed(1)} words/sec{noteText}</div>
            <div className="result-equation">
              {theoretical.toFixed(1)} × [{utilization} (util) × {QUANTIZATION_OPTIONS.find(q => q.value === quantization)?.efficiency || 0.95} (quant)] = {realistic.toFixed(1)} tokens/sec
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-icon">{UI_CONFIG.icons.users}</div>
          <div className="result-content">
            <div className="result-label">Concurrent Users</div>
            <div className="result-value">{users.toFixed(1)}</div>
            <div className="result-sublabel">({tokensPerSecPerUser.toFixed(1)} tokens/sec per user, {thinkTime}s think time)</div>
            <div className="result-equation">
              {realistic.toFixed(1)} ÷ ({responseLength} ÷ {thinkTime}) = {users.toFixed(1)} concurrent users
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-icon">{UI_CONFIG.icons.memory}</div>
          <div className="result-content">
            <div className="result-label">Hardware Resources</div>
            <div className="result-value">{(() => {
              const selectedHW = hardwareDatabase.find(hw => hw.value === hardware);
              return selectedHW ? `${selectedHW.memory} GB VRAM` : 'N/A';
            })()}</div>
            <div className="result-sublabel">
              Model: {calculateModelSize(parseFloat(model), quantization).toFixed(1)} GB | 
              FLOPS: {parseFloat(hardware.split(',')[0])} TFLOPS
            </div>
            <div className="result-equation">
              Single unit: {(() => {
                const selectedHW = hardwareDatabase.find(hw => hw.value === hardware);
                return selectedHW ? selectedHW.memory : 'N/A';
              })()} GB VRAM, {parseFloat(hardware.split(',')[0])} TFLOPS compute
            </div>
          </div>
        </div>

        <div className="calc-info">
          <strong>{INFO_CONTENT.performanceCalculation}</strong>
        </div>
      </div>
    </div>
  );
}
