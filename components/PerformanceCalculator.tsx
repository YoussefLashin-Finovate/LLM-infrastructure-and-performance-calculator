'use client';
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

// Format FLOPS to readable units
function formatFLOPS(flops: number): string {
  if (flops >= 1e15) {
    return `${(flops / 1e15).toFixed(2)} PFLOPS`;
  } else if (flops >= 1e12) {
    return `${(flops / 1e12).toFixed(2)} TFLOPS`;
  } else if (flops >= 1e9) {
    return `${(flops / 1e9).toFixed(2)} GFLOPS`;
  } else {
    return `${flops.toFixed(2)} FLOPS`;
  }
}

// Export calculation results as professional PDF for client tenders
async function exportToPDF(inputs: any, results: any) {
  try {
    const jsPDF = (await import('jspdf')).default;
    
    // Calculate model size based on inputs
    const effectiveModelParams = inputs.model === 'custom' ? inputs.customTotalParams : parseFloat(inputs.model);
    const modelSizeGB = calculateModelSize(effectiveModelParams, inputs.quantization);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    let yPos = 20;
    const leftMargin = 20;
    const rightMargin = 190;
    const lineHeight = 7;
    
    // Header
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, 210, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LLM Infrastructure Report', leftMargin, 20);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Performance Analysis', leftMargin, 30);
    pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), leftMargin, 36);
    
    yPos = 55;
    pdf.setTextColor(0, 0, 0);
    
    // Section: Configuration
    pdf.setFillColor(59, 130, 246);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONFIGURATION', leftMargin, yPos);
    yPos += 12;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const selectedHW = hardwareDatabase.find(hw => hw.value === inputs.hardware);
    
    const configData = [
      ['Model Size:', `${parseFloat(inputs.model).toFixed(1)}B parameters`],
      ['Quantization:', inputs.quantization.toUpperCase()],
      ['Hardware:', selectedHW?.name || 'N/A'],
      ['Hardware VRAM:', `${selectedHW?.memory || 'N/A'} GB`],
      ['Hardware FLOPS:', formatFLOPS(parseFloat(inputs.hardware.split(',')[0]) * 1e12)],
      ['Utilization Factor:', `${(inputs.utilization * 100).toFixed(0)}%`],
      ['Input Length:', `${inputs.inputLength} tokens`],
      ['Response Length:', `${inputs.responseLength} tokens`],
      ['Think Time:', `${inputs.thinkTime}s`],
    ];
    
    if (inputs.useKVCache) {
      configData.push(
        ['System Tokens:', `${inputs.systemPromptTokens} (cached)`],
        ['History Tokens:', `${inputs.sessionHistoryTokens} (cached)`],
        ['Input Tokens:', `${inputs.newInputTokens} (per request)`]
      );
    }
    
    configData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, leftMargin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, leftMargin + 60, yPos);
      yPos += lineHeight;
    });
    
    yPos += 5;
    
    // Section: Performance Results
    pdf.setFillColor(16, 185, 129);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PERFORMANCE METRICS', leftMargin, yPos);
    yPos += 12;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const metricsData = [
      ['Theoretical Throughput:', `${results.theoretical.toFixed(1)} tokens/sec`],
      ['Realistic Throughput:', `${results.realistic.toFixed(1)} tokens/sec`],
      ['Words per Second:', `${results.words.toFixed(1)} words/sec`],
      ['', ''],
      ['Concurrent Users Supported:', results.users.toFixed(1)],
      ['Tokens/sec per User:', `${results.tokensPerSecPerUser.toFixed(1)}`],
      ['', ''],
      ['Model Memory Footprint:', `${modelSizeGB.toFixed(1)} GB`],
    ];
    
    if (results.vramAllocation && results.vramAllocation.kvCacheGB > 0) {
      metricsData.push(['KV Cache Memory:', `${results.vramAllocation.kvCacheGB.toFixed(2)} GB`]);
      metricsData.push(['Total VRAM Used:', `${results.vramAllocation.totalUsedGB.toFixed(1)} GB`]);
    }
    
    metricsData.push(
      ['Available VRAM:', `${selectedHW?.memory || 'N/A'} GB`],
      ['Memory Bound:', results.isMemoryBound ? 'Yes' : 'No'],
    );
    
    if (results.prefillOverhead > 0) {
      metricsData.push(['Prefill Overhead:', `${(results.prefillOverhead * 100).toFixed(1)}%`]);
    }
    
    if (results.attentionOverhead > 0) {
      metricsData.push(['Attention Overhead:', `${(results.attentionOverhead * 100).toFixed(1)}%`]);
    }
    
    metricsData.forEach(([label, value]) => {
      if (label === '') {
        yPos += 3;
        return;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, leftMargin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, leftMargin + 70, yPos);
      yPos += lineHeight;
    });
    
    yPos += 5;
    
    // Section: Summary
    pdf.setFillColor(100, 116, 139);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUMMARY', leftMargin, yPos);
    yPos += 12;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const summaryText = `This ${parseFloat(inputs.model).toFixed(1)}B parameter model running on ${selectedHW?.name || 'selected hardware'} ` +
      `can support ${results.users.toFixed(1)} concurrent users with ${results.realistic.toFixed(1)} tokens/sec throughput ` +
      `(${results.words.toFixed(1)} words/sec). Each user receives ${results.tokensPerSecPerUser.toFixed(1)} tokens/sec ` +
      `with a ${inputs.thinkTime}s think time between requests.`;
    
    const splitText = pdf.splitTextToSize(summaryText, 170);
    splitText.forEach((line: string) => {
      pdf.text(line, leftMargin, yPos);
      yPos += lineHeight;
    });
    
    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Generated by LLM Infrastructure Calculator', leftMargin, 275);
    pdf.text(`Report ID: PERF-${Date.now()}`, leftMargin, 280);
    pdf.text('© 2025 Finovate Team. All rights reserved.', leftMargin, 285);
    
    pdf.save(`Infrastructure-Performance-Report-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

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
  useKVCache: boolean;
  setUseKVCache: (value: boolean) => void;
  kvOffloading: boolean;
  setKvOffloading: (value: boolean) => void;
  systemPromptTokens: number;
  setSystemPromptTokens: (value: number) => void;
  sessionHistoryTokens: number;
  setSessionHistoryTokens: (value: number) => void;
  newInputTokens: number;
  setNewInputTokens: (value: number) => void;
  useMoeArchitecture: boolean;
  setUseMoeArchitecture: (value: boolean) => void;
  useCustomModel: boolean;
  setUseCustomModel: (value: boolean) => void;
  customTotalParams: number;
  setCustomTotalParams: (value: number) => void;
  customActiveParams: number;
  setCustomActiveParams: (value: number) => void;
  customTotalExperts: number;
  setCustomTotalExperts: (value: number) => void;
  customActiveExperts: number;
  setCustomActiveExperts: (value: number) => void;
  results: {
    theoretical: number;
    realistic: number;
    users: number;
    words: number;
    tokensPerSecPerUser: number;
    isMemoryBound: boolean;
    prefillOverhead: number;
    attentionOverhead: number;
    vramAllocation?: {
      modelWeightsGB: number;
      kvCacheGB: number;
      safetyBufferGB: number;
      totalUsedGB: number;
      availableGB: number;
      canFitModel: boolean;
      warnings: string[];
    };
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
  useKVCache,
  setUseKVCache,
  kvOffloading,
  setKvOffloading,
  systemPromptTokens,
  setSystemPromptTokens,
  sessionHistoryTokens,
  setSessionHistoryTokens,
  newInputTokens,
  setNewInputTokens,
  useMoeArchitecture,
  setUseMoeArchitecture,
  useCustomModel,
  setUseCustomModel,
  customTotalParams,
  setCustomTotalParams,
  customActiveParams,
  setCustomActiveParams,
  customTotalExperts,
  setCustomTotalExperts,
  customActiveExperts,
  setCustomActiveExperts,
  results,
}: PerformanceCalculatorProps) {
  const hardwareGroups = useHardwareGroups(quantization);
  
  // Calculate model size for display
  const effectiveModelParams = (useCustomModel || model === 'custom') ? customTotalParams : parseFloat(model);
  const modelSizeGB = calculateModelSize(effectiveModelParams, quantization);
  
  const { theoretical, realistic, users, words, tokensPerSecPerUser, isMemoryBound, prefillOverhead, attentionOverhead, vramAllocation } = results;
  
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
          Input Parameters
        </h3>
      
        <div className="input-group">
          <label htmlFor="calc_model">Model Size</label>
          <select id="calc_model" value={model} onChange={(e) => {
            setModel(e.target.value);
            setUseCustomModel(e.target.value === 'custom');
          }}>
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
          <small>{model !== 'custom' && HELPER_TEXT.modelSize(calculateModelSize(parseFloat(model), quantization))}</small>
        </div>

        {/* Custom Model Configuration */}
        {useCustomModel && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
            padding: '20px',
            borderRadius: '12px',
            border: '3px solid rgba(16, 185, 129, 0.3)',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: UI_CONFIG.colors.primary, marginBottom: '16px', fontWeight: '700' }}>
              🎨 Custom Model Configuration
            </h4>
            
            <div className="input-group">
              <label htmlFor="custom_total_params">Total Parameters (Billions)</label>
              <input 
                type="number" 
                id="custom_total_params" 
                value={customTotalParams} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomTotalParams(isNaN(val) ? 1 : val);
                  // Auto-set active params to match total for dense models
                  if (!useMoeArchitecture) {
                    setCustomActiveParams(isNaN(val) ? 1 : val);
                  }
                }}
                min={0.1}
                step={0.1}
              />
              <small>Total model parameters including all experts (if MoE)</small>
            </div>

            <div className="input-group">
              <label htmlFor="custom_active_params">Active Parameters (Billions)</label>
              <input 
                type="number" 
                id="custom_active_params" 
                value={customActiveParams} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomActiveParams(isNaN(val) ? 1 : val);
                }}
                min={0.1}
                step={0.1}
                disabled={!useMoeArchitecture}
              />
              <small>Parameters used per token {!useMoeArchitecture && '(same as total for dense models)'}</small>
            </div>

            {useMoeArchitecture && (
              <>
                <div className="input-group">
                  <label htmlFor="custom_total_experts">Total Experts</label>
                  <input 
                    type="number" 
                    id="custom_total_experts" 
                    value={customTotalExperts} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomTotalExperts(isNaN(val) ? 1 : val);
                    }}
                    min={1}
                    step={1}
                  />
                  <small>Total number of expert networks</small>
                </div>

                <div className="input-group">
                  <label htmlFor="custom_active_experts">Active Experts per Token</label>
                  <input 
                    type="number" 
                    id="custom_active_experts" 
                    value={customActiveExperts} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomActiveExperts(isNaN(val) ? 1 : val);
                    }}
                    min={1}
                    step={1}
                  />
                  <small>Number of experts activated per token</small>
                </div>

                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginTop: '12px'
                }}>
                  <strong style={{ color: UI_CONFIG.colors.primary }}>📊 Configuration Summary:</strong>
                  <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                    <li>Total: {customTotalParams}B params → VRAM: {(customTotalParams * (quantization === 'fp16' ? 2 : quantization === 'int8' ? 1 : 0.5)).toFixed(1)}GB</li>
                    <li>Active: {customActiveParams}B params ({((customActiveParams / customTotalParams) * 100).toFixed(1)}% of total)</li>
                    <li>Experts: {customActiveExperts}/{customTotalExperts} active ({((customActiveExperts / customTotalExperts) * 100).toFixed(1)}%)</li>
                    <li>Compute reduction: {((1 - customActiveParams / customTotalParams) * 100).toFixed(1)}%</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        <div className="input-group" style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
          padding: '16px',
          borderRadius: '8px',
          border: '2px solid rgba(99, 102, 241, 0.2)'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700' }}>
            <input 
              type="checkbox" 
              checked={useMoeArchitecture}
              onChange={(e) => setUseMoeArchitecture(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span>Enable MoE Architecture</span>
          </label>
          <small style={{ display: 'block', marginTop: '8px', marginLeft: '30px', color: '#4f46e5', fontWeight: '600' }}>
            Use Mixture-of-Experts architecture calculations (affects compute and memory usage)
          </small>
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
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setUtilization(isNaN(val) ? 0.1 : val);
            }}
            step={CALCULATION_CONSTANTS.steps.utilization}
            min={CALCULATION_CONSTANTS.utilizationMin}
            max={CALCULATION_CONSTANTS.utilizationMax}
          />
          <small>{HELPER_TEXT.utilizationTypical}</small>
        </div>

        <div className="input-group" style={{ 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
          padding: '16px',
          borderRadius: '8px',
          border: '2px solid rgba(16, 185, 129, 0.2)'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700' }}>
            <input 
              type="checkbox" 
              checked={useKVCache}
              onChange={(e) => setUseKVCache(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span>Enable KV Cache Mode (Token-Aware)</span>
          </label>
          <small style={{ display: 'block', marginTop: '8px', marginLeft: '30px' }}>
            Split tokens into per-session (cached) and per-request (new) for accurate compute modeling
          </small>
        </div>

        {useKVCache && (
          <div className="input-group" style={{ 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
            padding: '16px',
            borderRadius: '8px',
            border: '2px solid rgba(59, 130, 246, 0.2)',
            marginTop: '-8px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700' }}>
              <input 
                type="checkbox" 
                checked={kvOffloading}
                onChange={(e) => setKvOffloading(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span>Enable KV Cache Offloading (CPU/NVMe)</span>
            </label>
            <small style={{ display: 'block', marginTop: '8px', marginLeft: '30px' }}>
              {kvOffloading 
                ? '✓ GPU count based on COMPUTE only (KV cache stored in CPU RAM/NVMe)'
                : '✗ GPU count based on VRAM (model + KV cache must fit in GPU memory)'}
            </small>
          </div>
        )}

        {!useKVCache ? (
          <div className="input-group">
            <label htmlFor="calc_input">Avg Input Length (tokens)</label>
            <input 
              type="number" 
              id="calc_input" 
              value={inputLength}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setInputLength(isNaN(val) ? 1 : val);
              }}
              step={CALCULATION_CONSTANTS.steps.inputLength}
              min="1" 
            />
            <small>{HELPER_TEXT.inputLengthNote}</small>
          </div>
        ) : (
          <>
            <div className="input-group" style={{ borderLeft: '3px solid rgba(16, 185, 129, 0.5)', paddingLeft: '12px' }}>
              <label htmlFor="calc_system_prompt">System Prompt (tokens) - Per Session</label>
              <input 
                type="number" 
                id="calc_system_prompt" 
                value={systemPromptTokens}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setSystemPromptTokens(Math.min(Math.max(val, 0), 100000));
                }}
                step="100"
                min="0"
                max="100000"
              />
              <small>Cached once per session (e.g., instructions, RAG context)</small>
            </div>

            <div className="input-group" style={{ borderLeft: '3px solid rgba(16, 185, 129, 0.5)', paddingLeft: '12px' }}>
              <label htmlFor="calc_history">Session History (tokens) - Per Session</label>
              <input 
                type="number" 
                id="calc_history" 
                value={sessionHistoryTokens}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setSessionHistoryTokens(Math.min(Math.max(val, 0), 200000));
                }}
                step="100"
                min="0"
                max="200000"
              />
              <small>Conversation history cached in session (grows over time)</small>
            </div>

            <div className="input-group" style={{ borderLeft: '3px solid rgba(59, 130, 246, 0.5)', paddingLeft: '12px' }}>
              <label htmlFor="calc_new_input">New Input (tokens) - Per Request</label>
              <input 
                type="number" 
                id="calc_new_input" 
                value={newInputTokens}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setNewInputTokens(Math.min(Math.max(val, 1), 100000));
                }}
                step="50"
                min="1"
                max="100000"
              />
              <small>User's new input requiring prefill compute every request</small>
            </div>
          </>
        )}

        <div className="input-group">
          <label htmlFor="calc_response">Avg Response Length (tokens)</label>
          <input 
            type="number" 
            id="calc_response" 
            value={responseLength}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setResponseLength(isNaN(val) ? 10 : val);
            }}
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
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setThinkTime(isNaN(val) ? 0.5 : val);
            }}
            step={CALCULATION_CONSTANTS.steps.thinkTime}
            min={CALCULATION_CONSTANTS.minThinkTime}
          />
          <small>{HELPER_TEXT.thinkTimeNote}</small>
        </div>
      </div>

      {/* Performance Results Panel */}
      <div className="calc-results-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontSize: UI_CONFIG.typography.subheadingSize,
            color: UI_CONFIG.colors.primary,
            fontWeight: '800',
            paddingBottom: '16px',
            borderBottom: `3px solid ${UI_CONFIG.colors.borderLight}`,
            flex: 1
          }}>
            Performance Analysis
          </h3>
          <button
            onClick={() => exportToPDF({
              model, quantization, hardware, utilization, inputLength, responseLength, thinkTime,
              systemPromptTokens, sessionHistoryTokens, newInputTokens, useKVCache
            }, results)}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              marginBottom: '16px'
            }}
          >
            Export Report
          </button>
        </div>
        
        <div className="result-card">
          <div className="result-content">
            <div className="result-label">Theoretical Tokens/sec</div>
            <div className="result-value">{theoretical.toFixed(1)}</div>
            <div className="result-equation">
              {formatFLOPS(parseFloat(hardware.split(',')[0]) * 1e12)} ÷ (6 × {model}B × 1e9) = {theoretical.toFixed(1)} tokens/sec
            </div>
          </div>
        </div>

        <div className="result-card">
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
          <div className="result-content">
            <div className="result-label">Hardware Resources</div>
            <div className="result-value">{(() => {
              const selectedHW = hardwareDatabase.find(hw => hw.value === hardware);
              return selectedHW ? `${selectedHW.memory} GB VRAM` : 'N/A';
            })()}</div>
            <div className="result-sublabel">
              Model Size: {modelSizeGB.toFixed(1)} GB ({quantization.toUpperCase()})
              {vramAllocation && vramAllocation.kvCacheGB > 0 && (
                <><br/>+ KV Cache: {vramAllocation.kvCacheGB.toFixed(2)} GB = Total: {vramAllocation.totalUsedGB.toFixed(1)} GB</>
              )}
              {!vramAllocation && (
                <><br/>FLOPS: {formatFLOPS(parseFloat(hardware.split(',')[0]) * 1e12)}</>
              )}
            </div>
            <div className="result-equation">
              {vramAllocation ? (
                <>
                  Model Weights: {vramAllocation.modelWeightsGB.toFixed(1)} GB + 
                  KV Cache: {vramAllocation.kvCacheGB.toFixed(2)} GB + 
                  Safety Buffer: {vramAllocation.safetyBufferGB.toFixed(1)} GB = 
                  {vramAllocation.totalUsedGB.toFixed(1)} GB total VRAM needed
                </>
              ) : (
                <>
                  Model: {modelSizeGB.toFixed(1)} GB after {quantization.toUpperCase()} quantization | 
                  Available: {(() => {
                    const selectedHW = hardwareDatabase.find(hw => hw.value === hardware);
                    return selectedHW ? selectedHW.memory : 'N/A';
                  })()} GB VRAM
                </>
              )}
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
