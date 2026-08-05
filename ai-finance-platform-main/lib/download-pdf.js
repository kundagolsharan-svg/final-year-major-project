import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadMonthlyReport = (data) => {
  const { totalIncome = 0, totalExpenses = 0, categoryBreakdown = {}, taxBreakdown = {}, transactions = [], aiSummary, period } = data;
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(period.year, period.month - 1));
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // --- Header Section (Deep Indigo Gradient Bar) ---
  doc.setFillColor(30, 27, 75); // Deep Indigo
  doc.rect(0, 0, pageWidth, 42, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("SAMPAT AI FINANCE", 14, 20);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text("Executive Financial & Money Flow Statement", 14, 28);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 14, 34);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`${monthName} ${period.year}`, pageWidth - 14, 24, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(199, 210, 254);
  doc.text(`Savings Rate: ${savingsRate}%`, pageWidth - 14, 32, { align: "right" });

  let currentY = 50;

  // --- Executive Summary Boxes ---
  const boxWidth = (pageWidth - 36) / 3;
  
  // Income Box
  doc.setFillColor(240, 253, 244); // Light Green
  doc.setDrawColor(187, 247, 208); // Green Border
  doc.roundedRect(14, currentY, boxWidth, 24, 3, 3, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52); // Dark Green
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL INFLOW", 14 + boxWidth/2, currentY + 7, { align: "center" });
  doc.setFontSize(13);
  doc.text(`INR ${totalIncome.toLocaleString('en-IN')}`, 14 + boxWidth/2, currentY + 17, { align: "center" });

  // Expenses Box
  doc.setFillColor(254, 242, 242); // Light Red
  doc.setDrawColor(254, 202, 202); // Red Border
  doc.roundedRect(14 + boxWidth + 4, currentY, boxWidth, 24, 3, 3, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(153, 27, 27); // Dark Red
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL OUTFLOW", 14 + boxWidth + 4 + boxWidth/2, currentY + 7, { align: "center" });
  doc.setFontSize(13);
  doc.text(`INR ${totalExpenses.toLocaleString('en-IN')}`, 14 + boxWidth + 4 + boxWidth/2, currentY + 17, { align: "center" });

  // Net Savings Box
  doc.setFillColor(238, 242, 255); // Light Blue
  doc.setDrawColor(199, 210, 254); // Blue Border
  doc.roundedRect(14 + boxWidth * 2 + 8, currentY, boxWidth, 24, 3, 3, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(55, 48, 163); // Dark Blue
  doc.setFont("helvetica", "bold");
  doc.text("NET SURPLUS / SAVINGS", 14 + boxWidth * 2 + 8 + boxWidth/2, currentY + 7, { align: "center" });
  doc.setFontSize(13);
  doc.text(`${netSavings >= 0 ? '+' : ''}INR ${netSavings.toLocaleString('en-IN')}`, 14 + boxWidth * 2 + 8 + boxWidth/2, currentY + 17, { align: "center" });

  currentY += 32;

  // --- AI Recommendations Section ---
  if (aiSummary) {
    const cleanSummary = (aiSummary || "")
      .replace(/\*\*/g, '')
      .replace(/\*/g, ' - ')
      .trim();
    
    const splitSummary = doc.splitTextToSize(cleanSummary, pageWidth - 40);
    const aiBoxHeight = (splitSummary.length * 4.5) + 18;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, currentY, pageWidth - 28, aiBoxHeight, 3, 3, 'FD');
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("SAMPAT AI Financial Analysis & Strategic Takeaways", 20, currentY + 8);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(splitSummary, 20, currentY + 16);

    currentY += aiBoxHeight + 10;
  }

  // --- Category Breakdown Table ---
  if (Object.keys(categoryBreakdown).length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Expense Breakdown by Category", 14, currentY);

    const categoryData = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .map(([cat, amt]) => [
        cat.charAt(0).toUpperCase() + cat.slice(1),
        `INR ${amt.toLocaleString('en-IN')}`,
        `${totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) + '%' : '0%'}`
      ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Category", "Amount Spent", "% of Total Outflow"]],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8.5 },
    });
    
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- Transaction List Table ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Detailed Itemized Transactions", 14, currentY);

  const tableData = transactions.map((t) => [
    new Date(t.date).toLocaleDateString('en-IN'),
    (t.description || 'Transaction').length > 35 ? (t.description || 'Transaction').substring(0, 35) + '...' : (t.description || 'Transaction'),
    t.category || 'General',
    t.type === "INCOME" ? "CREDIT (+)" : "DEBIT (-)",
    `INR ${Number(t.amount || 0).toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Date", "Description", "Category", "Flow Type", "Amount"]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      3: { halign: 'center', fontStyle: 'bold' },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw.includes('CREDIT')) data.cell.styles.textColor = [22, 101, 52];
        else if (data.cell.raw.includes('DEBIT')) data.cell.styles.textColor = [153, 27, 27];
      }
    },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5 }
  });

  // --- Footer on each page ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated by SAMPAT AI Financial Platform`, 14, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: "right" });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  }

  // Save the PDF
  doc.save(`SAMPAT_Financial_Statement_${monthName}_${period.year}.pdf`);
};

export const downloadReportCSV = (data) => {
  const { transactions = [], period } = data;
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(period.year, period.month - 1));

  const headers = ["Date", "Description", "Type", "Category", "Tax Category", "Amount (INR)"];
  const rows = transactions.map((t) => [
    `"${new Date(t.date).toISOString().split('T')[0]}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.category || ''}"`,
    `"${t.taxCategory || 'N/A'}"`,
    t.amount
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `SAMPAT_Transactions_${monthName}_${period.year}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
