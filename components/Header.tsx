import Image from 'next/image';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ 
  title = "LLM Inference Performance Reference",
  subtitle = "Enterprise-grade performance metrics for Arabic-capable and general-purpose language models"
}: HeaderProps) {
  return (
    <div className="document-header">
      <div className="header-content">
        <div style={{ flex: 1 }}>
          <h1>{title}</h1>
          <p className="subtitle" dangerouslySetInnerHTML={{ __html: subtitle }} />
        </div>
        <div className="logo-container">
          <Image
            src="/finovate-logo.png"
            alt="Finovate Logo"
            width={200}
            height={133}
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
          />
        </div>
      </div>
    </div>
  );
}
