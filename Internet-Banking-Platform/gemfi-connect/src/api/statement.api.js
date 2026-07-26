import { apiRequest, tokens } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

const buildQuery = (params) => new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();

export const generateStatement = (params) =>
  apiRequest(`${ENDPOINTS.statements.generate}?${buildQuery({ ...params, format: 'json' })}`);

export async function downloadStatementCsv(params) {
  const response = await fetch(`${ENDPOINTS.statements.generate}?${buildQuery({ ...params, format: 'csv' })}`, {
    headers: tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {},
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw Object.assign(new Error(body?.message || 'Unable to download statement'), { status: response.status, body });
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `statement-${params.accountNumber}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
