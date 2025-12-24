/**
 * PDF Reporter Utility
 * Centralized engine for generating professional infrastructure reports
 */

export interface ReportSection {
    title: string;
    items: [string, string][];
    type?: 'grid' | 'list' | 'table';
}

export interface ReportData {
    reportType: 'Performance Analysis' | 'Capacity Planning';
    modelName: string;
    hardwareName: string;
    date: string;
    preparedFor?: string;
    sections: ReportSection[];
    calculations?: ReportSection[];
    summary?: string;
    footerBrand?: string;
}

export async function generateInfrastructureReport(data: ReportData) {
    try {
        const jsPDF = (await import('jspdf')).default;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let yPos = margin;

        // Helper: Draw Cover Page
        const drawCoverPage = async () => {
            // Background Gradient/Shape
            pdf.setFillColor(15, 23, 42); // Slate 900
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');

            // Accent Shape
            pdf.setFillColor(16, 185, 129); // Emerald 500
            pdf.rect(0, 100, pageWidth, 2, 'F');

            // Logo Placeholder (or actual logo if available as data URL)
            try {
                const logoResponse = await fetch('/finovate-logo.png');
                if (logoResponse.ok) {
                    const logoBlob = await logoResponse.blob();
                    const logoData = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(logoBlob);
                    });
                    pdf.addImage(logoData as string, 'PNG', margin, 40, 50, 15);
                }
            } catch (e) {
                // Fallback to text if logo fails
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(24);
                pdf.setFont('helvetica', 'bold');
                pdf.text('FINOVATE', margin, 50);
            }

            // Title
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(36);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Infrastructure', margin, 130);
            pdf.text('Report', margin, 145);

            // Subtitle
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(16, 185, 129); // Emerald 500
            pdf.text(data.reportType, margin, 160);

            // Details
            pdf.setFontSize(12);
            pdf.setTextColor(148, 163, 184); // Slate 400
            pdf.text(`Model: ${data.modelName}`, margin, 180);
            pdf.text(`Hardware: ${data.hardwareName}`, margin, 187);
            pdf.text(`Date: ${data.date}`, margin, 194);

            if (data.preparedFor) {
                pdf.setTextColor(255, 255, 255);
                pdf.text('PREPARED FOR:', margin, 220);
                pdf.setFont('helvetica', 'bold');
                pdf.text(data.preparedFor, margin, 227);
            }

            // Footer
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(71, 85, 105); // Slate 600
            pdf.text('© 2025 Finovate Team. All rights reserved.', margin, 275);

            pdf.addPage();
            yPos = margin;
        };

        // Helper: Draw Header for content pages
        const drawPageHeader = (title: string) => {
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, 0, pageWidth, 25, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, margin, 16);

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(148, 163, 184);
            pdf.text(data.date, pageWidth - margin - 30, 16);

            yPos = 35;
        };

        // Helper: Check Page Break
        const checkPageBreak = (neededHeight: number) => {
            if (yPos + neededHeight > pageHeight - margin) {
                pdf.addPage();
                drawPageHeader(data.reportType);
                return true;
            }
            return false;
        };

        // Helper: Draw Section
        const drawSection = (section: ReportSection, color: [number, number, number] = [59, 130, 246]) => {
            const lineHeight = 8;
            const sectionHeight = 15 + (section.items.length * lineHeight);
            checkPageBreak(sectionHeight);

            // Section Title
            pdf.setFillColor(...color);
            pdf.rect(margin - 2, yPos - 5, contentWidth + 4, 10, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(section.title.toUpperCase(), margin, yPos + 1.5);
            yPos += 12;

            // Items
            pdf.setTextColor(30, 41, 59); // Slate 800
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);

            const labelColWidth = 80;
            section.items.forEach(([label, value]) => {
                if (label === '---') {
                    yPos += 4;
                    pdf.setDrawColor(226, 232, 240);
                    pdf.line(margin, yPos, margin + contentWidth, yPos);
                    yPos += 4;
                    return;
                }

                pdf.setFont('helvetica', 'bold');
                pdf.text(label, margin, yPos);

                pdf.setFont('helvetica', 'normal');
                // Alignment: No overlap logic
                // Use a fixed width for labels, and wrap values if they are too long
                const valueX = margin + labelColWidth;
                const availableValueWidth = contentWidth - labelColWidth;

                const splitValue = pdf.splitTextToSize(value, availableValueWidth);
                pdf.text(splitValue, valueX, yPos);

                yPos += splitValue.length * lineHeight;
                checkPageBreak(lineHeight);
            });
            yPos += 5;
        };

        // --- EXECUTION ---
        await drawCoverPage();
        drawPageHeader(data.reportType);

        // Main Sections (Inputs/Configuration)
        data.sections.forEach(section => {
            drawSection(section, [30, 64, 175]); // Indigo 700
        });

        // Calculations Section (Inner assumptions/calculations)
        if (data.calculations && data.calculations.length > 0) {
            data.calculations.forEach(section => {
                drawSection(section, [16, 185, 129]); // Emerald 500
            });
        }

        // Summary Section
        if (data.summary) {
            checkPageBreak(30);
            pdf.setFillColor(100, 116, 139); // Slate 500
            pdf.rect(margin - 2, yPos - 5, contentWidth + 4, 10, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('EXECUTIVE SUMMARY', margin, yPos + 1.5);
            yPos += 12;

            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const splitSummary = pdf.splitTextToSize(data.summary, contentWidth);
            pdf.text(splitSummary, margin, yPos);
            yPos += splitSummary.length * 6 + 10;
        }

        // Footer on all content pages
        const pageCount = pdf.getNumberOfPages();
        for (let i = 2; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(148, 163, 184);
            pdf.text(`Page ${i - 1} of ${pageCount - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text(data.footerBrand || 'Generated by LLM Infrastructure Calculator', margin, pageHeight - 10);
        }

        pdf.save(`Infrastructure-Report-${Date.now()}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}
