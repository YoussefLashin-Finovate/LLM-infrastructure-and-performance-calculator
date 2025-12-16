'use client';
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
    pdf.text('Capacity Planning Analysis', leftMargin, 30);
    pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), leftMargin, 36);
    
    yPos = 55;
    pdf.setTextColor(0, 0, 0);
    
    // Section: Your Inputs
    pdf.setFillColor(59, 130, 246);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INPUT PARAMETERS', leftMargin, yPos);
    yPos += 12;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // Calculate effective model params
    const effectiveModelParams = inputs.model === 'custom' ? inputs.customTotalParamsReverse : parseFloat(inputs.model);
    
    const inputData = [
      ['Model Size:', `${effectiveModelParams.toFixed(1)}B parameters`],
      ['Quantization Type:', inputs.quantization.toUpperCase()],
      ['Hardware:', inputs.hardware.split('|')[0]],
      ['Utilization:', `${(inputs.utilization * 100).toFixed(0)}%`],
      ['Number of Users:', inputs.users.toString()],
      ['Tokens/sec per User:', inputs.tokensPerSec.toString()],
    ];
    
    if (inputs.useKVCache) {
      inputData.push(
        ['System Tokens:', `${inputs.systemPromptTokens} (cached)`],
        ['History Tokens:', `${inputs.sessionHistoryTokens} (cached)`],
        ['Input Tokens:', `${inputs.newInputTokens} (per request)`]
      );
    } else {
      inputData.push(['Output Length:', `${inputs.inputLength} tokens`]);
    }
    
    inputData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, leftMargin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, leftMargin + 60, yPos);
      yPos += lineHeight;
    });
    
    yPos += 5;
    
    // Section: Computed Results
    pdf.setFillColor(16, 185, 129);
    pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPUTED RESULTS', leftMargin, yPos);
    yPos += 12;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const flopsPerToken = parseFloat(inputs.model) * 2e9; // 2× for inference (forward pass only)
    const totalTokensPerSec = inputs.users * inputs.tokensPerSec;
    const totalFlopsPerSec = totalTokensPerSec * flopsPerToken;
    
    const resultsData = [
      ['FLOPs per Parameter per Token:', '2.0 (inference)'],
      ['FLOPs per Token:', formatFLOPS(flopsPerToken)],
      ['Total Tokens/sec:', totalTokensPerSec.toFixed(1)],
      ['Total FLOPs/sec:', formatFLOPS(totalFlopsPerSec)],
      ['', ''],
      ['Hardware Units Needed:', results.unitsNeeded.toString()],
      ['Total System Throughput:', `${results.totalSystemThroughput.toFixed(1)} tokens/sec`],
      ['Throughput per Unit:', `${results.throughputPerUnit.toFixed(1)} tokens/sec`],
      ['System Headroom:', `${results.headroom.toFixed(0)}%`],
      ['Total VRAM:', `${results.totalVRAM.toFixed(0)} GB`],
      ['VRAM per Unit:', `${results.vramPerUnit} GB`],
      ['Model Size:', `${results.modelSize.toFixed(1)} GB`],
    ];
    
    if (results.vramAllocation && results.vramAllocation.kvCacheGB > 0) {
      resultsData.push(['KV Cache Memory:', `${results.vramAllocation.kvCacheGB.toFixed(2)} GB`]);
      resultsData.push(['Total VRAM per Unit:', `${results.vramAllocation.totalUsedGB.toFixed(1)} GB`]);
    }
    
    if (results.vramAllocation && results.vramAllocation.offloadedMemoryGB !== undefined && results.vramAllocation.offloadedMemoryGB > 0) {
      const offloadedMem = results.vramAllocation.offloadedMemoryGB >= 1000 
        ? `${(results.vramAllocation.offloadedMemoryGB / 1000).toFixed(2)} TB`
        : `${results.vramAllocation.offloadedMemoryGB.toFixed(1)} GB`;
      resultsData.push(['CPU/NVMe Memory (KV Offloading):', offloadedMem]);
    }
    
    resultsData.push(
      ['Total Overhead:', `${results.totalOverheadPercent.toFixed(0)}%`],
    );
    
    resultsData.forEach(([label, value]) => {
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
    
    // Section: Overhead Breakdown
    if (results.overheadBreakdown && results.overheadBreakdown.length > 0) {
      pdf.setFillColor(100, 116, 139);
      pdf.rect(leftMargin - 5, yPos - 5, 170, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OVERHEAD BREAKDOWN', leftMargin, yPos);
      yPos += 12;
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      results.overheadBreakdown.forEach((overhead: string) => {
        pdf.text(`• ${overhead}`, leftMargin + 5, yPos);
        yPos += lineHeight;
      });
    }
    
    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Generated by LLM Infrastructure Calculator', leftMargin, 275);
    pdf.text(`Report ID: CAP-${Date.now()}`, leftMargin, 280);
    pdf.text('© 2025 Finovate Team. All rights reserved.', leftMargin, 285);
    
    pdf.save(`Infrastructure-Capacity-Report-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

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
  useKVCache: boolean;
  setUseKVCache: (value: boolean) => void;
  kvOffloading: boolean;
  setKvOffloading: (value: boolean) => void;
  kvOffloadingPercentage: number;
  setKvOffloadingPercentage: (value: number) => void;
  systemPromptTokens: number;
  setSystemPromptTokens: (value: number) => void;
  sessionHistoryTokens: number;
  setSessionHistoryTokens: (value: number) => void;
  newInputTokens: number;
  setNewInputTokens: (value: number) => void;
  useMoeArchitecture: boolean;
  setUseMoeArchitecture: (value: boolean) => void;
  useCustomModelReverse: boolean;
  setUseCustomModelReverse: (value: boolean) => void;
  customTotalParamsReverse: number;
  setCustomTotalParamsReverse: (value: number) => void;
  customActiveParamsReverse: number;
  setCustomActiveParamsReverse: (value: number) => void;
  customTotalExpertsReverse: number;
  setCustomTotalExpertsReverse: (value: number) => void;
  customActiveExpertsReverse: number;
  setCustomActiveExpertsReverse: (value: number) => void;
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
    vramAllocation?: {
      modelWeightsGB: number;
      kvCacheGB: number;
      safetyBufferGB: number;
      totalUsedGB: number;
      availableGB: number;
      canFitModel: boolean;
      warnings: string[];
      offloadedMemoryGB?: number;
      offloadingPercentage?: number;
      kvCacheInVRAM?: number;
      kvCacheOffloaded?: number;
    };
    kvCache?: {
      totalSessionTokens: number;
      kvMemoryGB: number;
      maxSessionsPerGPU: number;
      kvUtilizationPercent: number;
    };
    batchingStrategy?: {
      maxBatchSizePerGPU: number;
      optimalBatchSize: number;
      numBatchesPerGPU: number;
      totalBatches: number;
      requestsPerBatch: number;
      kvCachePerBatch: number;
      latencyMs: number;
      throughputPerGPU: number;
      utilizationPercent: number;
      constraints: {
        vramLimited: boolean;
        computeLimited: boolean;
        latencyLimited: boolean;
      };
      recommendations: string[];
    };
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
  useKVCache,
  setUseKVCache,
  kvOffloading,
  setKvOffloading,
  kvOffloadingPercentage,
  setKvOffloadingPercentage,
  systemPromptTokens,
  setSystemPromptTokens,
  sessionHistoryTokens,
  setSessionHistoryTokens,
  newInputTokens,
  setNewInputTokens,
  useMoeArchitecture,
  setUseMoeArchitecture,
  useCustomModelReverse,
  setUseCustomModelReverse,
  customTotalParamsReverse,
  setCustomTotalParamsReverse,
  customActiveParamsReverse,
  setCustomActiveParamsReverse,
  customTotalExpertsReverse,
  setCustomTotalExpertsReverse,
  customActiveExpertsReverse,
  setCustomActiveExpertsReverse,
  results,
}: CapacityPlannerProps) {
  const hardwareGroups = useHardwareGroups(quantization);
  
  // Calculate effective model params for display
  const effectiveModelParams = (useCustomModelReverse || model === 'custom') ? customTotalParamsReverse : parseFloat(model);
  
  // Debug log to check if vramAllocation exists
  if (typeof window !== 'undefined') {
    console.log('🔍 CapacityPlanner Results:', {
      hasVramAllocation: !!results.vramAllocation,
      hasKvCache: !!results.kvCache,
      vramAllocation: results.vramAllocation,
      kvCache: results.kvCache,
      useKVCache,
      allResults: results
    });
  }
  
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
          Requirements
        </h3>
        
        <div className="input-group">
          <label htmlFor="reverse_model">Model Size</label>
          <select id="reverse_model" value={model} onChange={(e) => {
            setModel(e.target.value);
            setUseCustomModelReverse(e.target.value === 'custom');
          }}>
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
          <small>{model !== 'custom' && HELPER_TEXT.modelSize(calculateModelSize(parseFloat(model), quantization))}</small>
        </div>

        {/* Custom Model Configuration */}
        {useCustomModelReverse && (
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
              <label htmlFor="custom_total_params_reverse">Total Parameters (Billions)</label>
              <input 
                type="number" 
                id="custom_total_params_reverse" 
                value={customTotalParamsReverse} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomTotalParamsReverse(isNaN(val) ? 1 : val);
                  // Auto-set active params to match total for dense models
                  if (!useMoeArchitecture) {
                    setCustomActiveParamsReverse(isNaN(val) ? 1 : val);
                  }
                }}
                min={0.1}
                step={0.1}
              />
              <small>Total model parameters including all experts (if MoE)</small>
            </div>

            <div className="input-group">
              <label htmlFor="custom_active_params_reverse">Active Parameters (Billions)</label>
              <input 
                type="number" 
                id="custom_active_params_reverse" 
                value={customActiveParamsReverse} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCustomActiveParamsReverse(isNaN(val) ? 1 : val);
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
                  <label htmlFor="custom_total_experts_reverse">Total Experts</label>
                  <input 
                    type="number" 
                    id="custom_total_experts_reverse" 
                    value={customTotalExpertsReverse} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomTotalExpertsReverse(isNaN(val) ? 1 : val);
                    }}
                    min={1}
                    step={1}
                  />
                  <small>Total number of expert networks</small>
                </div>

                <div className="input-group">
                  <label htmlFor="custom_active_experts_reverse">Active Experts per Token</label>
                  <input 
                    type="number" 
                    id="custom_active_experts_reverse" 
                    value={customActiveExpertsReverse} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomActiveExpertsReverse(isNaN(val) ? 1 : val);
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
                    <li>Total: {customTotalParamsReverse}B params → VRAM: {(customTotalParamsReverse * (quantization === 'fp16' ? 2 : quantization === 'int8' ? 1 : 0.5)).toFixed(1)}GB</li>
                    <li>Active: {customActiveParamsReverse}B params ({((customActiveParamsReverse / customTotalParamsReverse) * 100).toFixed(1)}% of total)</li>
                    <li>Experts: {customActiveExpertsReverse}/{customTotalExpertsReverse} active ({((customActiveExpertsReverse / customTotalExpertsReverse) * 100).toFixed(1)}%)</li>
                    <li>Compute reduction: {((1 - customActiveParamsReverse / customTotalParamsReverse) * 100).toFixed(1)}%</li>
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
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setUsers(isNaN(val) ? 1 : val);
            }}
            step={CALCULATION_CONSTANTS.steps.users}
            min="1" 
          />
          <small>{HELPER_TEXT.usersNote}</small>
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
                ? '✓ GPU count optimized with KV cache offloading'
                : '✗ GPU count based on VRAM (model + KV cache must fit in GPU memory)'}
            </small>
            
            {kvOffloading && (
              <div style={{ marginTop: '16px', marginLeft: '30px', paddingLeft: '16px', borderLeft: '3px solid rgba(59, 130, 246, 0.3)' }}>
                <label htmlFor="offloading_percentage" style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Offloading Percentage: {kvOffloadingPercentage}%
                </label>
                <input
                  id="offloading_percentage"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={kvOffloadingPercentage}
                  onChange={(e) => setKvOffloadingPercentage(Number(e.target.value))}
                  style={{ 
                    width: '100%', 
                    height: '6px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  <span>0% (All in VRAM)</span>
                  <span>50% (Balanced)</span>
                  <span>100% (All offloaded)</span>
                </div>
                <small style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                  {kvOffloadingPercentage === 0 && '💾 All KV cache in GPU VRAM (high performance, high VRAM usage)'}
                  {kvOffloadingPercentage > 0 && kvOffloadingPercentage < 50 && '⚡ Mostly in VRAM (good performance, moderate offloading)'}
                  {kvOffloadingPercentage >= 50 && kvOffloadingPercentage < 100 && '⚖️ Balanced split (reduces GPU memory, some CPU overhead)'}
                  {kvOffloadingPercentage === 100 && '🔄 Fully offloaded (minimal VRAM, compute-based GPU count)'}
                </small>
              </div>
            )}
          </div>
        )}

        {!useKVCache ? (
          <div className="input-group">
            <label htmlFor="reverse_input">Avg Input Length (tokens)</label>
            <input 
              type="number" 
              id="reverse_input" 
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
              <label htmlFor="reverse_system_prompt">System Prompt (tokens) - Per Session</label>
              <input 
                type="number" 
                id="reverse_system_prompt" 
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
              <label htmlFor="reverse_history">Session History (tokens) - Per Session</label>
              <input 
                type="number" 
                id="reverse_history" 
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
              <label htmlFor="reverse_new_input">New Input (tokens) - Per Request</label>
              <input 
                type="number" 
                id="reverse_new_input" 
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
          <label htmlFor="reverse_tokens">Output Tokens/sec per User</label>
          <input 
            type="number" 
            id="reverse_tokens" 
            value={tokensPerSec}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setTokensPerSec(isNaN(val) ? 0.1 : val);
            }}
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
      </div>

      {/* Results Panel */}
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
            Infrastructure Requirements
          </h3>
          <button
            onClick={() => exportToPDF({
              model, quantization, hardware, users, tokensPerSec, inputLength,
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

        {/* Your Inputs Section */}
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.05)',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid rgba(59, 130, 246, 0.2)',
          marginBottom: '20px'
        }}>
          <h4 style={{ 
            fontSize: '16px',
            fontWeight: '700',
            color: '#3b82f6',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Your Inputs
          </h4>
          <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <span style={{ color: '#64748b' }}>Model Size:</span>
              <span style={{ fontWeight: '600' }}>{effectiveModelParams.toFixed(1)}B params</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <span style={{ color: '#64748b' }}>Quantization Type:</span>
              <span style={{ fontWeight: '600' }}>{quantization.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <span style={{ color: '#64748b' }}>Hardware FLOPS:</span>
              <span style={{ fontWeight: '600' }}>{hardware.split('|')[0]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <span style={{ color: '#64748b' }}>Number of Users:</span>
              <span style={{ fontWeight: '600' }}>{users}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <span style={{ color: '#64748b' }}>Tokens/sec per User:</span>
              <span style={{ fontWeight: '600' }}>{tokensPerSec}</span>
            </div>
            {useKVCache ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>System Tokens:</span>
                  <span style={{ fontWeight: '600' }}>{systemPromptTokens}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>History Tokens:</span>
                  <span style={{ fontWeight: '600' }}>{sessionHistoryTokens}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>Input Tokens:</span>
                  <span style={{ fontWeight: '600' }}>{newInputTokens}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
                <span style={{ color: '#64748b' }}>Output Length:</span>
                <span style={{ fontWeight: '600' }}>{inputLength} tokens</span>
              </div>
            )}
          </div>
        </div>

        {/* Internally Computed Values Section */}
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.05)',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid rgba(16, 185, 129, 0.2)',
          marginBottom: '20px'
        }}>
          <h4 style={{ 
            fontSize: '16px',
            fontWeight: '700',
            color: '#10b981',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
           Internally Computed Values
          </h4>
          <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <span style={{ color: '#64748b' }}>Model Size after Quantization:</span>
              <span style={{ fontWeight: '600' }}>{results.modelSize.toFixed(1)} GB ({quantization.toUpperCase()})</span>
            </div>
            {useKVCache && results.vramAllocation && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>KV Cache Memory per Session:</span>
                  <span style={{ fontWeight: '600' }}>{results.vramAllocation.kvCacheGB.toFixed(2)} GB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>Total KV Cache for {users} Users:</span>
                  <span style={{ fontWeight: '600' }}>{(results.vramAllocation.kvCacheGB * users).toFixed(2)} GB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>Total VRAM per Unit (Model + All KV + Buffer):</span>
                  <span style={{ fontWeight: '600' }}>{(results.modelSize + (results.vramAllocation.kvCacheGB * users) + results.vramAllocation.safetyBufferGB).toFixed(1)} GB</span>
                </div>
              </>
            )}
            {useKVCache && !results.vramAllocation && results.kvCache && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>KV Cache Memory per Session:</span>
                  <span style={{ fontWeight: '600' }}>{results.kvCache.kvMemoryGB.toFixed(2)} GB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>KV Cache Total ({users} users):</span>
                  <span style={{ fontWeight: '600' }}>{(results.kvCache.kvMemoryGB * users).toFixed(2)} GB</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <span style={{ color: '#64748b' }}>FLOPs per Parameter per Token:</span>
              <span style={{ fontWeight: '600' }}>2.0 (inference)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <span style={{ color: '#64748b' }}>FLOPs per Token:</span>
              <span style={{ fontWeight: '600' }}>{formatFLOPS(effectiveModelParams * 2e9)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <span style={{ color: '#64748b' }}>Total Tokens/sec:</span>
              <span style={{ fontWeight: '600' }}>{(users * tokensPerSec).toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <span style={{ color: '#64748b' }}>Total FLOPs/sec:</span>
              <span style={{ fontWeight: '600' }}>{formatFLOPS((users * tokensPerSec) * effectiveModelParams * 2e9)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <span style={{ color: '#64748b' }}>Hardware Units Needed:</span>
              <span style={{ fontWeight: '600', fontSize: '18px', color: '#10b981' }}>{results.unitsNeeded}</span>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="result-card">
          <div className="result-content">
            <div className="result-label">Total System Throughput</div>
            <div className="result-value">{results.totalSystemThroughput.toFixed(1)} t/s</div>
            <div className="result-sublabel">
              ({results.throughputPerUnit.toFixed(1)} tokens/sec per unit, {results.headroom.toFixed(0)}% spare capacity)
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-content">
            <div className="result-label">Total VRAM Accumulated</div>
            <div className="result-value">{results.totalVRAM.toFixed(0)} GB</div>
            <div className="result-sublabel">
              Model Size: {results.modelSize.toFixed(1)} GB ({quantization.toUpperCase()}) per unit
              {results.vramAllocation && results.vramAllocation.kvCacheGB > 0 && (
                <>
                  <br/>
                  + KV Cache: {results.vramAllocation.kvCacheGB.toFixed(2)} GB per unit
                </>
              )}
              <br/>
              ({results.vramPerUnit} GB × {results.unitsNeeded} units)
            </div>
            {results.vramAllocation && results.vramAllocation.kvCacheGB > 0 ? (
              <div className="result-equation">
                Per unit: {results.vramAllocation.modelWeightsGB.toFixed(1)} GB (model) + 
                {results.vramAllocation.kvCacheGB.toFixed(2)} GB (KV) + 
                {results.vramAllocation.safetyBufferGB.toFixed(1)} GB (buffer) = 
                {results.vramAllocation.totalUsedGB.toFixed(1)} GB × {results.unitsNeeded} units
              </div>
            ) : (
              <div className="result-equation">
                Model: {results.modelSize.toFixed(1)} GB after {quantization.toUpperCase()} × {results.unitsNeeded} units = {results.totalVRAM.toFixed(0)} GB total
              </div>
            )}
          </div>
        </div>

        {/* Offloaded Memory Section (when KV cache offloading is enabled) */}
        {results.vramAllocation && results.vramAllocation.offloadedMemoryGB !== undefined && results.vramAllocation.offloadedMemoryGB > 0 && (
          <div className="result-card">
            <div className="result-content">
              <div className="result-label">
                {results.vramAllocation.offloadingPercentage === 100 
                  ? 'CPU/NVMe Memory Required' 
                  : `Partial KV Cache Offloading (${results.vramAllocation.offloadingPercentage}%)`
                }
              </div>
              <div className="result-value">
                {results.vramAllocation.offloadedMemoryGB >= 1000 
                  ? `${(results.vramAllocation.offloadedMemoryGB / 1000).toFixed(2)} TB`
                  : `${results.vramAllocation.offloadedMemoryGB.toFixed(1)} GB`
                }
              </div>
              <div className="result-sublabel">
                {results.vramAllocation.offloadingPercentage === 100 ? (
                  <>
                    All KV cache offloaded from GPU VRAM to system memory
                    <br/>
                    ({users} users × {results.vramAllocation.offloadedMemoryGB / users < 1 
                      ? `${(results.vramAllocation.offloadedMemoryGB / users * 1024).toFixed(0)} MB` 
                      : `${(results.vramAllocation.offloadedMemoryGB / users).toFixed(2)} GB`} per user)
                  </>
                ) : (
                  <>
                    {results.vramAllocation.offloadingPercentage}% of KV cache offloaded to CPU/NVMe
                    <br/>
                    {results.vramAllocation.kvCacheInVRAM !== undefined && (
                      <>{results.vramAllocation.kvCacheInVRAM.toFixed(1)} GB remaining in GPU VRAM</>
                    )}
                  </>
                )}
              </div>
              {results.vramAllocation.offloadingPercentage === 100 ? (
                <div className="result-equation">
                  Total KV Cache: {results.vramAllocation.offloadedMemoryGB.toFixed(1)} GB stored in CPU RAM or NVMe
                </div>
              ) : (
                <div className="result-equation">
                  Split: {results.vramAllocation.kvCacheInVRAM?.toFixed(1)} GB in VRAM + {results.vramAllocation.offloadedMemoryGB.toFixed(1)} GB in CPU/NVMe
                </div>
              )}
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                backgroundColor: results.vramAllocation.offloadingPercentage === 100 
                  ? 'rgba(59, 130, 246, 0.1)' 
                  : 'rgba(168, 85, 247, 0.1)', 
                borderRadius: '8px',
                fontSize: '13px',
                color: results.vramAllocation.offloadingPercentage === 100 ? '#3b82f6' : '#a855f7'
              }}>
                <strong>💡 Tip:</strong> {results.vramAllocation.offloadingPercentage === 100 
                  ? 'Ensure your system has sufficient RAM or fast NVMe storage for optimal performance'
                  : 'Partial offloading reduces GPU memory pressure while maintaining some KV cache in fast VRAM'
                }
              </div>
            </div>
          </div>
        )}

        {/* Batching Strategy Section */}
        {results.batchingStrategy && (
          <div className="result-card">
            <div className="result-content">
              <div className="result-label" style={{ marginBottom: '16px' }}>Batching Strategy</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>Batch Size per GPU:</span>
                  <span style={{ fontWeight: '600' }}>{results.batchingStrategy.requestsPerBatch} requests</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>Max Batch Size (VRAM-limited):</span>
                  <span style={{ fontWeight: '600' }}>{results.batchingStrategy.maxBatchSizePerGPU} requests</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>Batches per GPU:</span>
                  <span style={{ fontWeight: '600' }}>{results.batchingStrategy.numBatchesPerGPU}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>Total Batches (all GPUs):</span>
                  <span style={{ fontWeight: '600' }}>{results.batchingStrategy.totalBatches}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>KV Cache per Batch:</span>
                  <span style={{ fontWeight: '600' }}>{results.batchingStrategy.kvCachePerBatch.toFixed(2)} GB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>Expected Batch Latency:</span>
                  <span style={{ fontWeight: '600' }}>{results.batchingStrategy.latencyMs.toFixed(0)} ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>Throughput per GPU:</span>
                  <span style={{ fontWeight: '600' }}>{results.batchingStrategy.throughputPerGPU.toFixed(1)} tokens/sec</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#64748b' }}>GPU Utilization:</span>
                  <span style={{ fontWeight: '600' }}>{results.batchingStrategy.utilizationPercent.toFixed(0)}%</span>
                </div>
                
                {/* Constraints */}
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#10b981' }}>Constraints:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                    {results.batchingStrategy.constraints.vramLimited && (
                      <div style={{ color: '#ef4444' }}>⚠️ VRAM-Limited</div>
                    )}
                    {results.batchingStrategy.constraints.computeLimited && (
                      <div style={{ color: '#3b82f6' }}>💻 Compute-Limited</div>
                    )}
                    {results.batchingStrategy.constraints.latencyLimited && (
                      <div style={{ color: '#f59e0b' }}>⏱️ Latency-Limited</div>
                    )}
                  </div>
                </div>
                
                {/* Recommendations */}
                {results.batchingStrategy.recommendations.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#3b82f6' }}>Recommendations:</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#64748b' }}>
                      {results.batchingStrategy.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="calc-info">
          <strong>{INFO_CONTENT.productionPlanning}</strong>
        </div>
      </div>
    </div>
  );
}
