/**
 * Shared HTML-based PDF generation utility.
 * Opens a print dialog in a new window with a formatted document.
 */

interface CompanyInfo {
  companyName: string;
  logoUrl?: string | null;
  taxId?: string;
  address?: string;
  documentFooter?: string;
}

interface DocumentLine {
  description: string;
  units: number;
  unitPrice: number;
  taxRate?: number;
  total: number;
}

interface DocumentConfig {
  type: "Presupuesto" | "Albarán" | "Factura de Compra" | "Orden de Compra";
  id: string;
  date: string;
  company: CompanyInfo;
  // Recipient
  recipientName: string;
  recipientDetail?: string;
  // Extra info fields
  infoFields?: { label: string; value: string }[];
  // Lines
  lines: DocumentLine[];
  // Totals
  subtotal: number;
  taxBreakdown: { rate: number; amount: number }[];
  total: number;
  // Optional
  notes?: string;
  termsAndConditions?: string;
}

export function generateDocumentPdf(config: DocumentConfig) {
  const {
    type, id, date, company, recipientName, recipientDetail,
    infoFields, lines, subtotal, taxBreakdown, total,
    notes, termsAndConditions,
  } = config;

  const logoHtml = company.logoUrl
    ? `<img src="${company.logoUrl}" alt="Logo" style="max-height:48px;max-width:120px;object-fit:contain" />`
    : "";

  const infoHtml = (infoFields ?? [])
    .map((f) => `<div><dt>${f.label}</dt><dd>${f.value}</dd></div>`)
    .join("");

  const linesHtml = lines
    .map(
      (l, i) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee">${i + 1}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee">${l.description || "—"}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${l.units}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">€${l.unitPrice.toFixed(2)}</td>
          ${l.taxRate != null ? `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${l.taxRate}%</td>` : ""}
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">€${l.total.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const hasTax = lines.some((l) => l.taxRate != null);

  const taxRows = taxBreakdown
    .map(
      (t) =>
        `<tr><td colspan="${hasTax ? 5 : 4}" style="text-align:right;padding:4px 8px">IVA ${t.rate}%:</td><td style="text-align:right;padding:4px 8px;font-weight:600">€${t.amount.toFixed(2)}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${type} ${id}</title>
    <style>body{font-family:Arial,sans-serif;margin:40px;color:#222}
    h1{font-size:20px;margin:0}h2{font-size:14px;margin:0;color:#666}
    table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
    th{background:#f5f5f5;padding:8px;text-align:left;border-bottom:2px solid #ddd;font-weight:600}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
    .info{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;margin-bottom:20px}
    .info dt{color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
    .info dd{margin:0;font-weight:500}
    .totals{margin-top:12px;text-align:right;font-size:13px}
    .grand-total{font-size:16px;font-weight:700;border-top:2px solid #222;padding-top:8px;margin-top:4px}
    </style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:12px">
        ${logoHtml}
        <div><h1>${company.companyName}</h1><h2>${type}</h2></div>
      </div>
      <div style="text-align:right">
        <h1>${id}</h1>
        <h2>${date}</h2>
        ${company.taxId ? `<p style="font-size:12px;color:#888;margin:4px 0 0">${company.taxId}</p>` : ""}
      </div>
    </div>
    <div class="info">
      <div><dt>${type === "Presupuesto" ? "Cliente" : "Proveedor"}</dt><dd>${recipientName}</dd></div>
      ${recipientDetail ? `<div><dt>Dirección</dt><dd>${recipientDetail}</dd></div>` : ""}
      ${infoHtml}
    </div>
    ${notes ? `<p style="font-size:13px;color:#555;margin-bottom:16px">📝 ${notes}</p>` : ""}
    <table>
      <thead><tr>
        <th>#</th><th>Descripción</th><th style="text-align:center">Uds.</th>
        <th style="text-align:right">Precio</th>
        ${hasTax ? `<th style="text-align:center">IVA</th>` : ""}
        <th style="text-align:right">Total</th>
      </tr></thead>
      <tbody>${linesHtml}</tbody>
      <tfoot>
        <tr><td colspan="${hasTax ? 5 : 4}" style="text-align:right;padding:8px;font-weight:600">Base imponible:</td>
        <td style="text-align:right;padding:8px;font-weight:600">€${subtotal.toFixed(2)}</td></tr>
        ${taxRows}
        <tr class="grand-total"><td colspan="${hasTax ? 5 : 4}" style="text-align:right;padding:8px">TOTAL:</td>
        <td style="text-align:right;padding:8px">€${total.toFixed(2)}</td></tr>
      </tfoot>
    </table>
    ${termsAndConditions ? `<div style="margin-top:32px;border-top:1px solid #ddd;padding-top:12px"><p style="font-size:12px;font-weight:600;margin-bottom:4px">Términos y Condiciones</p><p style="font-size:11px;color:#666">${termsAndConditions}</p></div>` : ""}
    ${company.documentFooter ? `<p style="margin-top:32px;font-size:11px;color:#999">${company.documentFooter}</p>` : ""}
    </body></html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
}
