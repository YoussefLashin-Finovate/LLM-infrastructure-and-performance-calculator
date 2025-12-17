import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoBoxProps {
  quantization?: string;
  speedBoost?: string;
  vramReduction?: string;
  qualityImpact?: string;
  type?: 'warning' | 'info';
  children?: React.ReactNode;
}

export default function InfoBox({ quantization, speedBoost, vramReduction, qualityImpact, type = 'info', children }: InfoBoxProps) {
  const isWarning = type === 'warning';

  return (
    <div className={cn(
      "rounded-lg border p-4 mb-6",
      isWarning ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-blue-50 border-blue-200 text-blue-900"
    )}>
      <div className="flex items-start gap-3">
        {isWarning ? (
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        ) : (
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
        )}
        <div className="text-sm leading-relaxed">
          {children ? children : (
            <>
              <strong>Performance Impact:</strong> Current configuration uses <span className="font-semibold">{quantization?.toUpperCase()}</span> quantization,
              providing <span className="font-semibold text-emerald-600">{speedBoost}</span> throughput boost and reducing VRAM usage to <span className="font-semibold text-emerald-600">{vramReduction}</span> of FP16 baseline,
              with <span className="font-semibold">{qualityImpact}</span>.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
