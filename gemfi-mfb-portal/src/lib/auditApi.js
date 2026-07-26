import { fineractApi } from '@/lib/fineract';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function toFineractDate(isoDate) {
  if (!isoDate) return isoDate;
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

export function fmtDateTime(arr) {
  if (!Array.isArray(arr) || arr.length < 3) return '—';
  const d = `${String(arr[2]).padStart(2, '0')}/${String(arr[1]).padStart(2, '0')}/${arr[0]}`;
  if (arr.length >= 5) return `${d} ${String(arr[3]).padStart(2, '0')}:${String(arr[4]).padStart(2, '0')}`;
  return d;
}

export function parseAuditResponse(res) {
  if (Array.isArray(res)) return { items: res, total: res.length };
  return { items: res?.pageItems || [], total: res?.totalFilteredRecords || 0 };
}

export async function fetchAudits(params = {}) {
  const query = { tenantIdentifier: 'default' };
  if (params.offset != null) query.offset = params.offset;
  if (params.limit != null) query.limit = params.limit;
  if (params.entityName) query.entityName = params.entityName;
  if (params.resourceId != null) query.resourceId = params.resourceId;
  if (params.actionName) query.actionName = params.actionName;
  if (params.maker) query.maker = params.maker;
  if (params.officeId) query.officeId = params.officeId;
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;
  return fineractApi('/audits', { params: query });
}