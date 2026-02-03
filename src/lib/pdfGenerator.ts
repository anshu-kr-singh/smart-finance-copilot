// Simple PDF generator using browser print functionality
// For production, consider using libraries like jsPDF or react-pdf

interface WorkItem {
  id: string;
  title: string;
  category: string;
  status: string;
  description?: string | null;
  due_date?: string | null;
  created_at: string;
}

export async function generateWorkPDF(workItem: WorkItem, companyName: string): Promise<void> {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Please allow popups to download PDF');
  }

  const categoryLabels: Record<string, string> = {
    accounting: 'Accounting & Financial Reporting',
    gst: 'GST Return',
    income_tax: 'Income Tax Computation',
    audit: 'Audit Report',
    compliance: 'Compliance & ROC',
    fpa: 'Financial Planning & Analysis',
    risk: 'Risk Management',
    advisory: 'Advisory Report',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    in_progress: 'In Progress',
    review: 'Under Review',
    completed: 'Completed',
    filed: 'Filed',
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${workItem.title} - ${companyName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          line-height: 1.6;
        }
        .header {
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .logo span {
          color: #64748b;
          font-weight: normal;
        }
        .document-info {
          text-align: right;
          font-size: 12px;
          color: #64748b;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e293b;
        }
        .document-title {
          font-size: 20px;
          color: #64748b;
          margin-top: 5px;
        }
        .meta-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
        }
        .meta-item {
          padding: 10px 0;
        }
        .meta-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .meta-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: #dcfce7;
          color: #166534;
        }
        .status-draft { background: #f1f5f9; color: #475569; }
        .status-in_progress { background: #dbeafe; color: #1d4ed8; }
        .status-review { background: #fef3c7; color: #92400e; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-filed { background: #e0e7ff; color: #3730a3; }
        .content-section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .description {
          color: #475569;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }
        .signature-section {
          margin-top: 60px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px;
        }
        .signature-box {
          padding-top: 20px;
        }
        .signature-line {
          border-top: 1px solid #1e293b;
          padding-top: 10px;
          font-size: 12px;
          color: #64748b;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <div class="logo">TaxAgent <span>AI</span></div>
          <div class="document-info">
            <div>Document ID: ${workItem.id.slice(0, 8).toUpperCase()}</div>
            <div>Generated: ${currentDate}</div>
          </div>
        </div>
        <div class="company-name">${companyName}</div>
        <div class="document-title">${categoryLabels[workItem.category] || workItem.category}</div>
      </div>

      <div class="meta-section">
        <div class="meta-item">
          <div class="meta-label">Document Title</div>
          <div class="meta-value">${workItem.title}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value">
            <span class="status-badge status-${workItem.status}">${statusLabels[workItem.status] || workItem.status}</span>
          </div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Category</div>
          <div class="meta-value">${categoryLabels[workItem.category] || workItem.category}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Due Date</div>
          <div class="meta-value">${workItem.due_date ? new Date(workItem.due_date).toLocaleDateString('en-IN') : 'Not specified'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Created On</div>
          <div class="meta-value">${new Date(workItem.created_at).toLocaleDateString('en-IN')}</div>
        </div>
      </div>

      ${workItem.description ? `
      <div class="content-section">
        <div class="section-title">Description</div>
        <div class="description">${workItem.description}</div>
      </div>
      ` : ''}

      <div class="content-section">
        <div class="section-title">Work Details</div>
        <p class="description">This document serves as a record of the ${categoryLabels[workItem.category]?.toLowerCase() || 'work'} performed for ${companyName}. All work has been conducted in accordance with applicable Indian tax laws and accounting standards.</p>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Prepared By</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Reviewed & Approved By</div>
        </div>
      </div>

      <div class="footer">
        <div>This is a computer-generated document from TaxAgent AI</div>
        <div>Page 1 of 1</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
