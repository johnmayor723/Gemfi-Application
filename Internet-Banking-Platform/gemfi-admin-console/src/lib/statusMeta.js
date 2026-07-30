import { Clock3, CheckCircle2, XCircle, Rocket, PauseCircle } from 'lucide-react';

export const STATUS_META = {
  pending: { label: 'Pending review', icon: Clock3, className: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-sky-50 text-sky-700' },
  active: { label: 'Active', icon: Rocket, className: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  disabled: { label: 'Disabled', icon: PauseCircle, className: 'bg-muted text-muted-foreground' },
};

export const STATUS_FILTERS = ['pending', 'active', 'rejected', 'disabled'];
