import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function Header({
  title = "LLM Infrastructure & Performance Calculator",
  subtitle = "A production-grade web application for modeling and visualizing Large Language Model (LLM) inference performance across GPUs, quantization levels, and deployment scenarios.de performance metrics for Arabic-capable and general-purpose language models",
  className
}: HeaderProps) {
  return (
    <div className={cn("w-full bg-slate-800 border-b border-slate-700 shadow-md", className)}>
      <div className="absolute inset-0 from-slate-800/8 to-slate-700/6 pointer-events-none" />
      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-3 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight drop-shadow-sm">
              {title}
            </h1>
            <div
              className="text-lg text-slate-200 max-w-2xl leading-relaxed font-light"
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          </div>
            <div className="flex-shrink-0 md:min-w-[22rem]">
              <div className="relative h-36 w-96 md:h-36 md:w-[28rem] transition-transform hover:scale-110 duration-300">
                <Image
                  src="/finovate-logo.png"
                  alt="Finovate Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

        </div>
      </div>
    </div>
  );
}
