import jsPDF from 'jspdf';

/**
 * Export data to Excel-compatible CSV file.
 * @param {string} filename - file name without extension
 * @param {Array<{label:string,key:string,render?:Function}>} columns
 * @param {Array<object>} data
 */
export function exportToExcel(filename, columns, data) {
  const escapeCSV = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = columns.map((c) => escapeCSV(c.label)).join(',');
  const rows = data
    .map((row) =>
      columns
        .map((c) => {
          const raw = c.render ? c.render(getValue(row, c.key), row) : getValue(row, c.key);
          return escapeCSV(raw);
        })
        .join(',')
    )
    .join('\n');

  const csv = '\ufeff' + headers + '\n' + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

/**
 * Export data to a plain CSV file (no BOM, for generic CSV consumers).
 */
export function exportToCSV(filename, columns, data) {
  const escapeCSV = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = columns.map((c) => escapeCSV(c.label)).join(',');
  const rows = data
    .map((row) =>
      columns
        .map((c) => {
          const raw = c.render ? c.render(getValue(row, c.key), row) : getValue(row, c.key);
          return escapeCSV(raw);
        })
        .join(',')
    )
    .join('\n');

  const csv = headers + '\n' + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

/**
 * Export tabular data to a PDF with selectable text, headers, and pagination.
 */
export function exportToPDF(filename, title, columns, data) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let y = 15;

  // Title
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text(title, margin, y);

  // Generation date
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 5);

  y += 12;

  // Column widths — distribute evenly
  const usableWidth = pageWidth - 2 * margin;
  const colWidths = columns.map(() => usableWidth / columns.length);

  // Header row
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 4, usableWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  let x = margin;
  columns.forEach((col, i) => {
    doc.text(String(col.label).substring(0, 40), x + 1, y);
    x += colWidths[i];
  });

  y += 5;
  doc.setFont(undefined, 'normal');

  // Data rows
  data.forEach((row, idx) => {
    if (y > pageHeight - 10) {
      doc.addPage();
      y = 15;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y - 4, usableWidth, 6, 'F');
    }
    x = margin;
    columns.forEach((col, i) => {
      const raw = col.render ? col.render(getValue(row, col.key), row) : getValue(row, col.key);
      doc.text(String(raw ?? '').substring(0, 40), x + 1, y);
      x += colWidths[i];
    });
    y += 5;
  });

  // Footer — total records
  y += 4;
  doc.setFontSize(7);
  doc.text(`Total Records: ${data.length}`, margin, y);

  doc.save(`${filename}.pdf`);
}

/**
 * Print tabular data via a popup window.
 */
export function printTable(title, columns, data) {
  const win = window.open('', '_blank');
  if (!win) return;

  const tableHTML = `
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 16px; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; }
        th { background: #f0f0f0; text-align: left; padding: 6px 8px; border: 1px solid #ddd; }
        td { padding: 4px 8px; border: 1px solid #ddd; }
        tr:nth-child(even) td { background: #fafafa; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Generated: ${new Date().toLocaleString()} · ${data.length} records</div>
      <table>
        <thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>
          ${data
            .map(
              (row) =>
                `<tr>${columns
                  .map((c) => {
                    const raw = c.render ? c.render(getValue(row, c.key), row) : getValue(row, c.key);
                    return `<td>${raw ?? ''}</td>`;
                  })
                  .join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  win.document.write(tableHTML);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function getValue(obj, path) {
  if (!path) return '';
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}