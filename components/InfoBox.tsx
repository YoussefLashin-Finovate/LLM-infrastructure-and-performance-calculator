interface InfoBoxProps {
  quantization?: string;
  speedBoost?: string;
  vramReduction?: string;
  qualityImpact?: string;
  type?: 'warning' | 'info';
  children?: React.ReactNode;
}

export default function InfoBox({ quantization, speedBoost, vramReduction, qualityImpact, type = 'info', children }: InfoBoxProps) {
  if (children) {
    return (
      <div className={`info-box ${type === 'warning' ? 'warning' : ''}`}>
        {children}
      </div>
    );
  }

  const quantName = quantization?.toUpperCase() || '';
  
  return (
    <div className="info-box">
      <div>
        <strong>Performance Impact:</strong> Current configuration uses <span id="quantInfo">{quantName}</span> quantization, 
        providing <strong id="speedBoost">{speedBoost}</strong> throughput boost and reducing VRAM usage to <strong id="vramReduction">{vramReduction}</strong> of FP16 baseline, 
        with <strong id="qualityImpact">{qualityImpact}</strong>.
      </div>
    </div>
  );
}
