const quantSpec = { fp16: 1, int8: 0.6, q4_k_s: 0.4, int4: 0.35 };

const hardwareMultipliers = {
    cpu_gold: { throughput: 0.03, latency: 20, ramMultiplier: 4, isCPU: true, users: 0.1, batch: 0.25, context: 0.5 },
    cpu_platinum: { throughput: 0.05, latency: 15, ramMultiplier: 5, isCPU: true, users: 0.15, batch: 0.3, context: 0.5 },
    a5000: { throughput: 0.65, latency: 1.4, vramMultiplier: 0.3, isCPU: false, users: 0.6, batch: 0.75, context: 1.0 },
    a6000: { throughput: 0.85, latency: 1.15, vramMultiplier: 0.6, isCPU: false, users: 0.85, batch: 0.9, context: 1.0 },
    a100_40: { throughput: 1.1, latency: 0.85, vramMultiplier: 0.5, isCPU: false, users: 0.9, batch: 0.95, context: 0.75 },
    a100_80: { throughput: 1.0, latency: 1.0, vramMultiplier: 1.0, isCPU: false, users: 1.0, batch: 1.0, context: 1.0 },
    h100_80: { throughput: 1.8, latency: 0.6, vramMultiplier: 1.0, isCPU: false, users: 1.4, batch: 1.2, context: 1.0 }
};

const modelCategories = [
    {
        models: ["Phi-3", "Gemma 2"],
        arabicModels: [],
        params: "3.8B-9B",
        vram: [4,10],
        throughput: [150,400], // Based on MLPerf Llama 3.1 8B results scaled down
        latency: [80,200], // Realistic ranges from MLPerf data
        ttft: [25,60],
        users: [20,80],
        batch: [8,16],
        context: [1024,2048]
    },
    {
        models: ["Mistral 7B", "Llama 3.1 8B", "Qwen 2.5 7B", "Gemma 2 9B", "DeepSeek 7B"],
        arabicModels: [],
        params: "7B-9B",
        vram: [8,18],
        throughput: [200,800], // MLPerf Llama 3.1 8B: 50k-140k tokens/s on high-end GPUs
        latency: [120,250],
        ttft: [35,85],
        users: [15,60],
        batch: [4,12],
        context: [2048,4096]
    },
    {
        models: ["Jais 13B", "Llama 2 13B", "Llama 3.1 13B", "DeepSeek 14B"],
        arabicModels: ["Jais 13B"],
        params: "13B-14B",
        vram: [16,28],
        throughput: [150,600], // Scaled from Llama 2 70B results
        latency: [200,500],
        ttft: [70,180],
        users: [8,30],
        batch: [2,8],
        context: [2048,4096]
    },
    {
        models: ["Gemma 2 27B", "Qwen 2.5 32B"],
        arabicModels: [],
        params: "27B-32B",
        vram: [24,65],
        throughput: [100,400], // Scaled from MLPerf results
        latency: [400,1000],
        ttft: [150,400],
        users: [4,15],
        batch: [1,4],
        context: [4096,8192]
    },
    {
        models: ["CodeLlama 34B"],
        arabicModels: [],
        params: "34B",
        vram: [40,70],
        throughput: [80,350],
        latency: [500,1200],
        ttft: [180,450],
        users: [6,18],
        batch: [1,3],
        context: [4096,8192]
    },
    {
        models: ["Mixtral 8x7B"],
        arabicModels: [],
        params: "46.7B MoE",
        vram: [90,120],
        throughput: [150,500], // MLPerf Mixtral 8x7B: ~30k-50k tokens/s on 8x GPUs
        latency: [300,800],
        ttft: [100,250],
        users: [8,35],
        batch: [2,6],
        context: [8192,16384]
    },
    {
        models: ["Llama 3.1 70B", "Qwen 2.5 72B"],
        arabicModels: [],
        params: "70B-72B",
        vram: [80,145],
        throughput: [200,600], // MLPerf Llama 2 70B: ~30k-60k tokens/s on 8x GPUs
        latency: [800,2000],
        ttft: [250,650],
        users: [25,70],
        batch: [1,2],
        context: [8192,32768]
    }
];

let chart;

function updateViews() {
    updateTable();
    updateChart();
}

function updateTable() {
    const quant = document.getElementById("quantization").value;
    const hardware = document.getElementById("hardware").value;
    const quantName = quant.toUpperCase();
    document.getElementById("quantInfo").textContent = quantName;
    
    const speedBoosts = { fp16: "1.0x", int8: "1.4x", q4_k_s: "2.0x", int4: "2.2x" };
    const qualityImpact = { 
        fp16: "no quality loss (full precision)", 
        int8: "minimal quality degradation (~1-2% accuracy loss)", 
        q4_k_s: "minimal quality degradation (~2-3% accuracy loss)",
        int4: "moderate quality degradation (~3-5% accuracy loss)" 
    };
    document.getElementById("speedBoost").textContent = speedBoosts[quant];
    document.getElementById("vramReduction").textContent = (quantSpec[quant] * 100).toFixed(0) + "%";
    document.getElementById("qualityImpact").textContent = qualityImpact[quant];

    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    modelCategories.forEach(cat => {
        const hwMult = hardwareMultipliers[hardware];
        let vramMin, vramMax, vramLabel;
        if (hwMult.isCPU) {
            // CPUs use system RAM
            vramMin = Math.round(cat.vram[0] * quantSpec[quant] * hwMult.ramMultiplier);
            vramMax = Math.round(cat.vram[1] * quantSpec[quant] * hwMult.ramMultiplier);
            vramLabel = `${vramMin}-${vramMax} GB RAM`;
        } else {
            // GPUs use VRAM
            vramMin = Math.round(cat.vram[0] * quantSpec[quant] * hwMult.vramMultiplier);
            vramMax = Math.round(cat.vram[1] * quantSpec[quant] * hwMult.vramMultiplier);
            vramLabel = `${vramMin}-${vramMax} GB`;
        }
        
        // Build model list with Arabic highlighting
        const modelList = cat.models.map(model => {
            if (cat.arabicModels.includes(model)) {
                return `<span class="arabic-model">${model}</span>`;
            }
            return model;
        }).join(' • ');
        
        // Calculate performance multiplier based on quantization and hardware
        const perfMultiplier = quant === "fp16" ? 1 : quant === "int8" ? 1.4 : 2.2;
        const totalThroughputMult = perfMultiplier * hwMult.throughput;
        const totalLatencyMult = (quant === "fp16" ? 1 : quant === "int8" ? 1/1.4 : 1/2.2) * hwMult.latency;
        const throughputMin = Math.round(cat.throughput[0] * totalThroughputMult);
        const throughputMax = Math.round(cat.throughput[1] * totalThroughputMult);
        const latencyMin = Math.round(cat.latency[0] * totalLatencyMult);
        const latencyMax = Math.round(cat.latency[1] * totalLatencyMult);
        const ttftMin = Math.round(cat.ttft[0] * totalLatencyMult);
        const ttftMax = Math.round(cat.ttft[1] * totalLatencyMult);
        const usersMin = Math.round(cat.users[0] * hwMult.users);
        const usersMax = Math.round(cat.users[1] * hwMult.users);
        const batchMin = Math.round(cat.batch[0] * hwMult.batch);
        const batchMax = Math.round(cat.batch[1] * hwMult.batch);
        const contextMin = Math.round(cat.context[0] * hwMult.context);
        const contextMax = Math.round(cat.context[1] * hwMult.context);
        
        tableBody.innerHTML += `
            <tr>
                <td style="line-height: 1.8;">${modelList}</td>
                <td><strong>${cat.params}</strong></td>
                <td><strong>${vramLabel}</strong></td>
                <td><strong>${throughputMin.toLocaleString()}-${throughputMax.toLocaleString()}</strong></td>
                <td>${latencyMin}-${latencyMax}</td>
                <td>${ttftMin}-${ttftMax}</td>
                <td>${usersMin}-${usersMax}</td>
                <td>${batchMin}-${batchMax}</td>
                <td>${contextMin.toLocaleString()}-${contextMax.toLocaleString()}</td>
            </tr>
        `;
    });
}

function updateChart() {
    const quant = document.getElementById("quantization").value;
    const hardware = document.getElementById("hardware").value;
    const metric = document.getElementById("metric").value;
    const quantName = quant.toUpperCase();
    document.getElementById("quantInfo").textContent = quantName;
    
    const speedBoosts = { fp16: "1.0x", int8: "1.4x", q4_k_s: "2.0x", int4: "2.2x" };
    const qualityImpact = { 
        fp16: "no quality loss (full precision)", 
        int8: "minimal quality degradation (~1-2% accuracy loss)", 
        q4_k_s: "minimal quality degradation (~2-3% accuracy loss)",
        int4: "moderate quality degradation (~3-5% accuracy loss)" 
    };
    document.getElementById("speedBoost").textContent = speedBoosts[quant];
    document.getElementById("vramReduction").textContent = (quantSpec[quant] * 100).toFixed(0) + "%";
    document.getElementById("qualityImpact").textContent = qualityImpact[quant];

    const labels = modelCategories.map(cat => cat.params);
    let dataMin = [];
    let dataMax = [];
    let yAxisLabel = '';
    let chartTitle = '';

    const hwMult = hardwareMultipliers[hardware];

    modelCategories.forEach(cat => {
        let minVal, maxVal;
        switch (metric) {
            case 'throughput':
                const perfMultiplier = quant === "fp16" ? 1 : quant === "int8" ? 1.4 : 2.2;
                minVal = Math.round(cat.throughput[0] * perfMultiplier * hwMult.throughput);
                maxVal = Math.round(cat.throughput[1] * perfMultiplier * hwMult.throughput);
                yAxisLabel = 'Throughput (tokens/sec)';
                chartTitle = 'LLM Throughput by Model Size';
                break;
            case 'latency':
                const latMultiplier = quant === "fp16" ? 1 : quant === "int8" ? 1 / 1.4 : 1 / 2.2;
                minVal = Math.round(cat.latency[0] * latMultiplier * hwMult.latency);
                maxVal = Math.round(cat.latency[1] * latMultiplier * hwMult.latency);
                yAxisLabel = 'Latency (ms)';
                chartTitle = 'LLM Latency by Model Size';
                break;
            case 'ttft':
                const ttftMultiplier = quant === "fp16" ? 1 : quant === "int8" ? 1 / 1.4 : 1 / 2.2;
                minVal = Math.round(cat.ttft[0] * ttftMultiplier * hwMult.latency);
                maxVal = Math.round(cat.ttft[1] * ttftMultiplier * hwMult.latency);
                yAxisLabel = 'TTFT (ms)';
                chartTitle = 'LLM Time to First Token by Model Size';
                break;
            case 'users':
                minVal = Math.round(cat.users[0] * hwMult.users);
                maxVal = Math.round(cat.users[1] * hwMult.users);
                yAxisLabel = 'Concurrent Users';
                chartTitle = 'LLM Concurrent Users by Model Size';
                break;
            case 'batch':
                minVal = Math.round(cat.batch[0] * hwMult.batch);
                maxVal = Math.round(cat.batch[1] * hwMult.batch);
                yAxisLabel = 'Batch Size';
                chartTitle = 'LLM Batch Size by Model Size';
                break;
            case 'vram':
                if (hwMult.isCPU) {
                    minVal = Math.round(cat.vram[0] * quantSpec[quant] * hwMult.ramMultiplier);
                    maxVal = Math.round(cat.vram[1] * quantSpec[quant] * hwMult.ramMultiplier);
                    yAxisLabel = 'RAM (GB)';
                    chartTitle = 'LLM RAM Usage by Model Size';
                } else {
                    minVal = Math.round(cat.vram[0] * quantSpec[quant] * hwMult.vramMultiplier);
                    maxVal = Math.round(cat.vram[1] * quantSpec[quant] * hwMult.vramMultiplier);
                    yAxisLabel = 'VRAM (GB)';
                    chartTitle = 'LLM VRAM Usage by Model Size';
                }
                break;
            case 'context':
                minVal = Math.round(cat.context[0] * hwMult.context);
                maxVal = Math.round(cat.context[1] * hwMult.context);
                yAxisLabel = 'Context Window (tokens)';
                chartTitle = 'LLM Context Window by Model Size';
                break;
        }
        dataMin.push(minVal);
        dataMax.push(maxVal);
    });

    const datasets = [
        {
            label: 'Min ' + metric.charAt(0).toUpperCase() + metric.slice(1),
            data: dataMin,
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
        },
        {
            label: 'Max ' + metric.charAt(0).toUpperCase() + metric.slice(1),
            data: dataMax,
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1
        }
    ];

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(document.getElementById('performanceChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: chartTitle,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Model Parameters'
                    }
                }
            }
        }
    });
}

function showTable() {
    document.getElementById('tableView').style.display = 'block';
    document.getElementById('chartView').style.display = 'none';
    document.getElementById('calculatorView').style.display = 'none';
    document.getElementById('tableBtn').classList.add('active');
    document.getElementById('chartBtn').classList.remove('active');
    document.getElementById('calcBtn').classList.remove('active');
}

function showChart() {
    document.getElementById('tableView').style.display = 'none';
    document.getElementById('chartView').style.display = 'block';
    document.getElementById('calculatorView').style.display = 'none';
    document.getElementById('tableBtn').classList.remove('active');
    document.getElementById('chartBtn').classList.add('active');
    document.getElementById('calcBtn').classList.remove('active');
}

function showCalculator() {
    document.getElementById('tableView').style.display = 'none';
    document.getElementById('chartView').style.display = 'none';
    document.getElementById('calculatorView').style.display = 'block';
    document.getElementById('tableBtn').classList.remove('active');
    document.getElementById('chartBtn').classList.remove('active');
    document.getElementById('calcBtn').classList.add('active');
    updateCalculator();
    updateReverseCalculator();
}

function updateCalculator() {
    // Get input values
    const modelStr = document.getElementById('calc_model').value;
    const hardwareStr = document.getElementById('calc_hardware').value;
    const utilization = parseFloat(document.getElementById('calc_util').value);
    const inputLength = parseFloat(document.getElementById('calc_input').value);
    const responseLength = parseFloat(document.getElementById('calc_response').value);
    const thinkTime = parseFloat(document.getElementById('calc_think').value);
    
    // Parse model parameters (in billions) - format is "70,70B"
    const modelValue = modelStr.split(',')[0]; // Get first part before comma
    const N = parseFloat(modelValue); // Parameters in billions
    
    // Parse hardware FLOPS/TOPS - now it's just the value directly
    const hardwareOps = parseFloat(hardwareStr) * 1e12; // Convert TFLOPS/TOPS to ops/sec
    
    // Get quantization type from selected hardware option
    const hardwareSelect = document.getElementById('calc_hardware');
    const selectedOption = hardwareSelect.options[hardwareSelect.selectedIndex];
    const quantType = selectedOption.getAttribute('data-quant') || 'fp16';
    
    // Quantization efficiency factors (accounts for accuracy loss and kernel efficiency)
    const quantEfficiency = {
        'fp16': 0.95,  // 5% overhead from memory bandwidth
        'int8': 0.88,  // 12% loss from reduced precision + kernel efficiency
        'int4': 0.80   // 20% loss from aggressive quantization
    };
    const Q = quantEfficiency[quantType];
    
    // Memory bandwidth considerations (GB/s)
    const memoryBandwidth = {
        'fp16': { 'h100': 3350, 'h200': 4800, 'a100': 2000, 'a6000': 768, 'default': 1000 },
        'int8': { 'h100': 3350, 'h200': 4800, 'a100': 2000, 'a6000': 768, 'default': 1000 },
        'int4': { 'h100': 3350, 'h200': 4800, 'a100': 2000, 'a6000': 768, 'default': 1000 }
    };
    
    // Determine hardware type for memory bandwidth
    const hardwareName = selectedOption.textContent.toLowerCase();
    let hwType = 'default';
    if (hardwareName.includes('h100')) hwType = 'h100';
    else if (hardwareName.includes('h200')) hwType = 'h200';
    else if (hardwareName.includes('a100')) hwType = 'a100';
    else if (hardwareName.includes('a6000')) hwType = 'a6000';
    
    const bw = memoryBandwidth[quantType][hwType];
    
    // Model memory footprint (GB) - parameters × bytes per param
    const bytesPerParam = quantType === 'fp16' ? 2 : quantType === 'int8' ? 1 : 0.5;
    const modelSizeGB = N * bytesPerParam;
    
    // KV cache size per token (bytes) = 2 (K+V) × layers × hidden_dim × bytes_per_param
    // Approximation: layers ≈ N/0.15, hidden_dim ≈ 128 × √N
    const kvCacheBytesPerToken = 2 * (N / 0.15) * (128 * Math.sqrt(N)) * bytesPerParam;
    
    // Equation 1: Theoretical Peak Tokens/Second (compute-bound)
    // Formula: tokens/sec = Hardware_FLOPS ÷ (6 × N × 10^9)
    // Where 6N is FLOPs per token (forward pass approximation)
    const theoreticalCompute = hardwareOps / (6 * N * 1e9);
    
    // Memory bandwidth limit (memory-bound for decode phase)
    // During decode: must load all model weights + KV cache each token
    // Formula: tokens/sec = Bandwidth ÷ (model_size + kv_cache_per_token)
    const sequenceLength = inputLength + responseLength;
    const kvCacheSize = kvCacheBytesPerToken * sequenceLength / 1e9; // Convert to GB
    const memoryBoundLimit = bw / (modelSizeGB + kvCacheSize);
    
    // Theoretical is the minimum of compute and memory limits
    const theoretical = Math.min(theoreticalCompute, memoryBoundLimit);
    const isMemoryBound = memoryBoundLimit < theoreticalCompute;
    
    // Equation 2: Realistic Tokens/Second with System Overhead
    // Formula: realistic = theoretical × U × Q × prefill_efficiency
    // Prefill phase (input processing) vs Decode phase (generation)
    const prefillTime = inputLength / (theoretical * 10); // Prefill is ~10x faster (batch processing)
    const decodeTime = responseLength / theoretical;
    const totalTime = prefillTime + decodeTime;
    const averageThroughput = (inputLength + responseLength) / totalTime;
    
    // Apply utilization and quantization efficiency
    let realistic = theoretical * utilization * Q;
    
    // Account for prefill overhead - higher input reduces effective throughput
    let prefillOverhead = 0;
    if (inputLength > 100) {
        // Prefill creates temporary throughput spike but reduces sustained rate
        prefillOverhead = Math.min(0.3, (inputLength / 1000) * 0.15);
        realistic = realistic * (1 - prefillOverhead);
    }
    
    // Large context reduces effective throughput due to attention O(n²) complexity
    let attentionOverhead = 0;
    if (sequenceLength > 2000) {
        attentionOverhead = Math.min(0.4, ((sequenceLength - 2000) / 10000) * 0.2);
        realistic = realistic * (1 - attentionOverhead);
    }
    
    const effectiveTokensPerSec = realistic;
    
    // Equation 3: Concurrent Users
    // Formula: users = effective_tokens_per_sec ÷ tokens_per_second_per_user
    // where tokens_per_second_per_user = output_length ÷ think_time
    const tokensPerSecondPerUser = responseLength / thinkTime;
    const users = effectiveTokensPerSec / tokensPerSecondPerUser;
    
    // Update displays
    document.getElementById('calc_theoretical').textContent = theoretical.toFixed(1);
    document.getElementById('calc_realistic').textContent = effectiveTokensPerSec.toFixed(1);
    
    // Build detailed notes
    let performanceNotes = [];
    if (isMemoryBound) performanceNotes.push('Memory-bound');
    if (prefillOverhead > 0) performanceNotes.push(`${(prefillOverhead * 100).toFixed(0)}% prefill overhead`);
    if (attentionOverhead > 0) performanceNotes.push(`${(attentionOverhead * 100).toFixed(0)}% attention overhead`);
    
    const noteText = performanceNotes.length > 0 ? ` (${performanceNotes.join(', ')})` : '';
    document.getElementById('calc_words').textContent = `≈${(effectiveTokensPerSec * 0.75).toFixed(1)} words/sec${noteText}`;
    document.getElementById('calc_users').textContent = users.toFixed(1);
    document.getElementById('calc_rate').textContent = `(${tokensPerSecondPerUser.toFixed(1)} tokens/sec per user, ${thinkTime}s think time)`;
    
    // Update equations with detailed breakdowns
    const hardwareOpsFormatted = (hardwareOps / 1e12).toFixed(1);
    const computeLimit = theoreticalCompute.toFixed(1);
    const memLimit = memoryBoundLimit.toFixed(1);
    
    const bottleneck = isMemoryBound ? 
        `min(${computeLimit} compute, ${memLimit} memory) = ${theoretical.toFixed(1)}` :
        `${computeLimit} (compute-bound)`;
    
    document.getElementById('eq_theoretical').textContent = 
        `${hardwareOpsFormatted}e12 ÷ (6 × ${N} × 10⁹) = ${bottleneck} tokens/sec`;
    
    let overheadFactors = `${utilization} (util) × ${Q} (quant)`;
    if (prefillOverhead > 0) overheadFactors += ` × ${(1 - prefillOverhead).toFixed(2)} (prefill)`;
    if (attentionOverhead > 0) overheadFactors += ` × ${(1 - attentionOverhead).toFixed(2)} (attention)`;
    
    document.getElementById('eq_realistic').textContent = 
        `${theoretical.toFixed(1)} × [${overheadFactors}] = ${effectiveTokensPerSec.toFixed(1)} tokens/sec`;
    
    document.getElementById('eq_users').textContent = 
        `${effectiveTokensPerSec.toFixed(1)} ÷ (${responseLength} ÷ ${thinkTime}) = ${users.toFixed(1)} concurrent users`;
}

function updateReverseCalculator() {
    // Get input values
    const modelStr = document.getElementById('reverse_model').value;
    const users = parseFloat(document.getElementById('reverse_users').value);
    const inputLength = parseFloat(document.getElementById('reverse_input').value);
    const tokensPerUser = parseFloat(document.getElementById('reverse_tokens').value);
    const hardwareStr = document.getElementById('reverse_hardware').value;
    const utilization = parseFloat(document.getElementById('reverse_util').value);
    
    // Parse model parameters (in billions)
    const modelValue = modelStr.split(',')[0];
    const N = parseFloat(modelValue); // Parameters in billions
    
    // Parse hardware FLOPS/TOPS and quantization
    const [hardwareOpsStr, quantType] = hardwareStr.split(',');
    const hardwareOpsPerUnit = parseFloat(hardwareOpsStr) * 1e12; // Convert to ops/sec
    
    // Quantization efficiency factors
    const quantEfficiency = {
        'fp16': 0.95,
        'int8': 0.90,
        'int4': 0.85
    };
    const Q = quantEfficiency[quantType];
    
    // Calculate required tokens/sec for all users (output only)
    const totalOutputTokensPerSec = users * tokensPerUser;
    
    // Account for system overheads
    let overheadMultiplier = 1.0;
    
    // 1. Prefill overhead (input processing)
    let prefillOverhead = 0;
    if (inputLength > 100) {
        prefillOverhead = Math.min(0.3, (inputLength / 1000) * 0.15);
        overheadMultiplier *= (1 + prefillOverhead);
    }
    
    // 2. Attention overhead (sequence length)
    const sequenceLength = inputLength + (tokensPerUser * 5); // Assume avg 5 sec generation
    let attentionOverhead = 0;
    if (sequenceLength > 2000) {
        attentionOverhead = Math.min(0.4, ((sequenceLength - 2000) / 10000) * 0.2);
        overheadMultiplier *= (1 + attentionOverhead);
    }
    
    // 3. Redundancy factor (production best practice: N+1 redundancy)
    const redundancyFactor = 1.15; // 15% extra capacity for peak loads
    overheadMultiplier *= redundancyFactor;
    
    // Adjust required throughput for all overheads
    const effectiveTokensPerSec = totalOutputTokensPerSec * overheadMultiplier;
    
    // Reverse calculation: Hardware Ops/sec needed = (tokens/sec × 6 × N × 10^9) ÷ (U × Q)
    const hardwareOpsNeeded = (effectiveTokensPerSec * 6 * N * 1e9) / (utilization * Q);
    
    // Calculate number of hardware units needed (always round up)
    const unitsNeeded = hardwareOpsNeeded / hardwareOpsPerUnit;
    const unitsNeededCeiled = Math.ceil(unitsNeeded);
    
    // Calculate actual throughput per unit (realistic)
    const theoreticalPerUnit = (hardwareOpsPerUnit / (6 * N * 1e9)) * utilization * Q;
    const throughputPerUnit = theoreticalPerUnit / overheadMultiplier;
    
    // Calculate total system throughput with recommended units
    const totalSystemThroughput = throughputPerUnit * unitsNeededCeiled;
    const headroom = ((totalSystemThroughput - totalOutputTokensPerSec) / totalOutputTokensPerSec * 100).toFixed(0);
    
    // Update displays
    document.getElementById('reverse_units').textContent = unitsNeededCeiled;
    
    // Build overhead breakdown with clearer formatting
    let overheadBreakdown = [];
    if (prefillOverhead > 0) overheadBreakdown.push(`+${(prefillOverhead * 100).toFixed(0)}% prefill`);
    if (attentionOverhead > 0) overheadBreakdown.push(`+${(attentionOverhead * 100).toFixed(0)}% attention`);
    overheadBreakdown.push(`+15% redundancy`);
    
    const overheadText = overheadBreakdown.join(', ');
    const totalOverheadPercent = ((overheadMultiplier - 1) * 100).toFixed(0);
    
    document.getElementById('reverse_total_ops').textContent = 
        `(Total overhead: ${totalOverheadPercent}% | Breakdown: ${overheadText})`;
    
    document.getElementById('reverse_throughput').textContent = totalSystemThroughput.toFixed(1);
    document.getElementById('reverse_per_unit').textContent = 
        `(${throughputPerUnit.toFixed(1)} tokens/sec per unit, ${headroom}% spare capacity)`;
    
    // Update equations with detailed breakdown
    const baseRequirement = `${users} users × ${tokensPerUser} t/s = ${totalOutputTokensPerSec.toFixed(1)} t/s`;
    const overheadCalc = `× ${overheadMultiplier.toFixed(2)} (${totalOverheadPercent}% overhead) = ${effectiveTokensPerSec.toFixed(1)} t/s required`;
    
    document.getElementById('reverse_equation').textContent = 
        `${baseRequirement} → ${overheadCalc} → ${unitsNeededCeiled} units needed`;
    
    document.getElementById('reverse_breakdown').textContent = 
        `Base load: ${totalOutputTokensPerSec.toFixed(1)} t/s | Production requirement: ${effectiveTokensPerSec.toFixed(1)} t/s | Deployed capacity: ${totalSystemThroughput.toFixed(1)} t/s`;
}

// Initialize on page load
updateViews();

// Add loading animation and calculator initialization
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
    }, 100);
    // Initialize calculator if it's visible
    if (document.getElementById('calculatorView').style.display !== 'none') {
        updateCalculator();
        updateReverseCalculator();
    }
});