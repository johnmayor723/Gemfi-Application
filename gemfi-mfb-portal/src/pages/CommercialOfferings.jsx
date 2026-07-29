import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Landmark, Globe2, LayoutDashboard, Layers, Users, PiggyBank, BookOpen,
  ShieldCheck, BarChart3, ScanFace, Smartphone, Phone, CreditCard, Wallet,
  Lock, TrendingUp, Award, ArrowRight, CheckCircle2, Minus, Building2,
  UsersRound, Package, Receipt, ScrollText, Fingerprint, IdCard,
  ArrowLeftRight, Bell, FileText, Repeat, Banknote, Sparkles, Mail,
  CalendarClock, KeyRound, Scale, Database, Star
} from 'lucide-react';
import PageHeader from '@/components/fineract/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Motion helper — respects prefers-reduced-motion
// ---------------------------------------------------------------------------
function Reveal({ children, delay = 0, className = '' }) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------
const COLOR_MAP = {
  emerald: { icon: 'text-emerald-400', ring: 'group-hover:border-emerald-500/40', bg: 'bg-emerald-500/10' },
  blue: { icon: 'text-blue-400', ring: 'group-hover:border-blue-500/40', bg: 'bg-blue-500/10' },
  amber: { icon: 'text-amber-400', ring: 'group-hover:border-amber-500/40', bg: 'bg-amber-500/10' },
  purple: { icon: 'text-purple-400', ring: 'group-hover:border-purple-500/40', bg: 'bg-purple-500/10' },
  rose: { icon: 'text-rose-400', ring: 'group-hover:border-rose-500/40', bg: 'bg-rose-500/10' },
  cyan: { icon: 'text-cyan-400', ring: 'group-hover:border-cyan-500/40', bg: 'bg-cyan-500/10' },
};

function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <div id={id} className="max-w-3xl mb-10 scroll-mt-20">
      {eyebrow && (
        <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h2>
      {description && <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">{description}</p>}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color = 'emerald' }) {
  const c = COLOR_MAP[color] || COLOR_MAP.emerald;
  return (
    <div className={`group bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 transition-colors ${c.ring}`}>
      <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Section({ children, className = '', tone = 'default' }) {
  const toneCls = tone === 'muted' ? 'bg-slate-950/40' : '';
  return (
    <section className={`py-14 sm:py-16 border-t border-slate-800/80 px-6 lg:px-8 ${toneCls} ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pricing data — content specified exactly; do not alter prices or features
// ---------------------------------------------------------------------------
const PLANS = [
  {
    name: 'Starter',
    price: '₦3,000,000',
    renewal: '₦1,000,000',
    tagline: 'For microfinance banks getting their digital core live.',
    highlighted: false,
    features: [
      'Core Banking',
      'Internet Banking (Web)',
      'Up to 5 Users',
      '1 Office',
      'Accounting',
      'General Ledger',
      'Reports',
      'Audit Trail',
      'KYC',
    ],
  },
  {
    name: 'Professional',
    price: '₦5,000,000',
    renewal: '₦2,000,000',
    tagline: 'Everything in Starter, built for growing multi-branch institutions.',
    highlighted: true,
    inheritsFrom: 'Starter',
    features: [
      'USSD Banking',
      'Up to 10 Users',
      'Up to 3 Offices',
      'Enhanced Reporting',
      'Priority Support',
    ],
  },
  {
    name: 'Enterprise',
    price: '₦10,000,000',
    renewal: '₦4,000,000',
    tagline: 'Everything in Professional, at unlimited scale with native apps.',
    highlighted: false,
    inheritsFrom: 'Professional',
    features: [
      'Unlimited Users',
      'Unlimited Offices',
      'Android Admin App',
      'iOS Admin App',
      'Android Mobile Banking App',
      'iOS Mobile Banking App',
      'Premium Support',
    ],
  },
];

function PricingCard({ plan }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 sm:p-7 border transition-transform duration-200 hover:-translate-y-1 ${
        plan.highlighted
          ? 'bg-gradient-to-b from-emerald-500/10 to-slate-800/60 border-emerald-500/50 shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_20px_50px_-15px_rgba(16,185,129,0.25)]'
          : 'bg-slate-800/50 border-slate-700/50'
      }`}
    >
      {plan.highlighted && (
        <Badge className="absolute -top-3 left-6 bg-emerald-500 text-slate-950 border-transparent font-semibold px-3">
          Most Popular
        </Badge>
      )}
      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[32px]">{plan.tagline}</p>

      <div className="mt-5 mb-1">
        <span className="text-3xl font-extrabold text-white tracking-tight">{plan.price}</span>
      </div>
      <div className="text-[11px] text-slate-500 mb-6">One-time licensing · Annual Renewal {plan.renewal}</div>

      {plan.inheritsFrom && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80 mb-2">
          Everything in {plan.inheritsFrom}, plus:
        </div>
      )}

      <ul className="space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className={`mt-7 w-full ${
          plan.highlighted
            ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold'
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
      >
        <a href={`mailto:sales@gemfi.africa?subject=GemFi%20Core%20Banking%20Suite%20-%20${plan.name}%20Enquiry`}>
          Talk to Sales
        </a>
      </Button>
    </div>
  );
}

const COMPARISON_ROWS = [
  { label: 'Core Banking', starter: true, professional: true, enterprise: true },
  { label: 'Internet Banking (Web)', starter: true, professional: true, enterprise: true },
  { label: 'USSD Banking', starter: false, professional: true, enterprise: true },
  { label: 'Users', starter: 'Up to 5', professional: 'Up to 10', enterprise: 'Unlimited' },
  { label: 'Offices', starter: '1', professional: 'Up to 3', enterprise: 'Unlimited' },
  { label: 'Accounting & General Ledger', starter: true, professional: true, enterprise: true },
  { label: 'Reports', starter: 'Standard', professional: 'Enhanced', enterprise: 'Enhanced' },
  { label: 'Audit Trail', starter: true, professional: true, enterprise: true },
  { label: 'KYC', starter: true, professional: true, enterprise: true },
  { label: 'Android / iOS Admin App', starter: false, professional: false, enterprise: true },
  { label: 'Android / iOS Mobile Banking App', starter: false, professional: false, enterprise: true },
  { label: 'Support', starter: 'Standard', professional: 'Priority', enterprise: 'Premium' },
  { label: 'Annual Renewal', starter: '₦1,000,000', professional: '₦2,000,000', enterprise: '₦4,000,000' },
];

function ComparisonCell({ value }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-slate-600 mx-auto" />;
  return <span className="text-slate-200">{value}</span>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CommercialOfferings() {
  return (
    <div className="text-white">
      <PageHeader
        title="Commercial Offerings"
        description="GemFi Core Banking Suite — plans, capabilities and pricing for financial institutions"
      />

      {/* ---------------------------------------------------------------- */}
      {/* 1. HERO                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-emerald-950/30 via-slate-900 to-slate-900 px-6 py-16 sm:py-20 lg:px-16 mx-6 lg:mx-8">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.15), transparent 45%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.12), transparent 40%)' }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Core Banking, Reimagined
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              The GemFi Core Banking Suite
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              A single, modern platform for customer management, lending, deposits, accounting, compliance
              and digital banking — built for microfinance banks that want to grow without outgrowing their
              technology.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-7">
                <a href="#pricing">
                  Request a Demo <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-7">
                <a href="mailto:sales@gemfi.africa?subject=GemFi%20Core%20Banking%20Suite%20Enquiry">
                  Contact Sales
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. ABOUT GEMFI                                                   */}
      {/* ---------------------------------------------------------------- */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-1">
            <SectionHeading eyebrow="About GemFi" title="Built for microfinance, ready for scale" />
          </div>
          <div className="lg:col-span-2 space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            <p>
              GemFi is a core banking technology company focused exclusively on microfinance banks and
              emerging financial institutions. We replace the spreadsheets, disconnected tools and legacy
              systems that hold growing institutions back with one unified platform covering the full
              customer lifecycle — from onboarding and identity verification to lending, savings,
              accounting and regulatory reporting.
            </p>
            <p>
              The GemFi Core Banking Suite is available white-label, allowing financial institutions to
              launch under their own brand while relying on GemFi's platform, support and continued product
              investment underneath.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 3. PLATFORM OVERVIEW                                             */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="muted">
        <SectionHeading
          eyebrow="Platform Overview"
          title="One platform, every part of the bank"
          description="GemFi brings together the systems a microfinance bank needs to operate, grow and stay compliant — without stitching together point solutions."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard icon={Layers} color="emerald" title="Core Banking" description="Clients, groups, loans, savings, accounting and organization management in one system of record." />
          <FeatureCard icon={Globe2} color="blue" title="Digital Channels" description="Internet banking, mobile and USSD access so customers can bank wherever they are." />
          <FeatureCard icon={ShieldCheck} color="amber" title="Compliance & Risk" description="KYC, AML, PEP and sanctions screening built directly into the customer journey." />
          <FeatureCard icon={BarChart3} color="purple" title="Reporting & Analytics" description="Regulatory returns and management reporting generated on demand from live data." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 4. CORE BANKING FEATURES                                         */}
      {/* ---------------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Core Banking"
          title="Core Banking Features"
          description="A complete operational core for running a microfinance bank — client management, lending, deposits, organization and product configuration."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Users} title="Client & Group Management" description="Onboard individual customers and groups, and manage relationships across the institution." />
          <FeatureCard icon={CreditCard} color="blue" title="Loan Origination & Servicing" description="Configurable loan products, application workflows and full loan account servicing." />
          <FeatureCard icon={PiggyBank} color="amber" title="Savings & Deposit Products" description="Configurable savings products with full account lifecycle management." />
          <FeatureCard icon={Building2} color="purple" title="Multi-Office Operations" description="Manage multiple branches and offices, staff assignments and organizational hierarchy." />
          <FeatureCard icon={Package} color="cyan" title="Configurable Product Catalog" description="Design loan and savings products, charges and fees to match your institution's offering." />
          <FeatureCard icon={UsersRound} color="rose" title="Roles & Permissions" description="Role-based access control so staff only see and do what their role allows." />
          <FeatureCard icon={ArrowLeftRight} title="Transaction Processing" description="Deposits, withdrawals and transfers processed and recorded against the core ledger." />
          <FeatureCard icon={Landmark} color="blue" title="Fund Management" description="Track and manage the sources of funds financing your loan and deposit portfolio." />
          <FeatureCard icon={Database} color="amber" title="Configurable Data & Codes" description="Extend customer and account records with institution-specific data fields and reference codes." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 5. CUSTOMER MANAGEMENT                                           */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="muted">
        <SectionHeading eyebrow="Customer Management" title="A complete, unified customer profile" description="Every customer — individual or group — has a single profile connecting their identity, accounts, compliance status and activity history." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Users} title="360° Customer Profiles" description="A single view of each customer's accounts, loans, savings and verification status." />
          <FeatureCard icon={UsersRound} color="blue" title="Group & Center Management" description="Manage group lending relationships and center-based operations alongside individual clients." />
          <FeatureCard icon={ScanFace} color="amber" title="KYC-Linked Onboarding" description="Identity verification is built into the onboarding flow, not bolted on afterward." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 6. DEPOSIT MANAGEMENT                                            */}
      {/* ---------------------------------------------------------------- */}
      <Section>
        <SectionHeading eyebrow="Deposit Management" title="Flexible savings and deposit accounts" description="Configure deposit products to match your institution's savings strategy, and manage the full account lifecycle from opening to closure." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={PiggyBank} title="Configurable Deposit Products" description="Define interest rates, minimum balances and terms per savings product." />
          <FeatureCard icon={Banknote} color="blue" title="Deposit & Withdrawal Processing" description="Process deposits and withdrawals with full transaction history per account." />
          <FeatureCard icon={Wallet} color="amber" title="Dedicated Account Numbers" description="Every deposit account can be issued a dedicated, bank-grade account number for customer identification and receiving payments." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 7. GENERAL LEDGER & ACCOUNTING                                   */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="muted">
        <SectionHeading eyebrow="Accounting" title="General Ledger & Accounting" description="Every transaction on the platform posts straight to the general ledger, giving finance teams a real-time, accurate financial picture — with the controls a regulated institution needs." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={BookOpen} title="Chart of Accounts & General Ledger" description="A configurable chart of accounts with automatic, real-time posting from banking transactions." />
          <FeatureCard icon={Scale} color="blue" title="Trial Balance" description="Generate an up-to-date trial balance directly from live ledger data." />
          <FeatureCard icon={Receipt} color="amber" title="Journal Entries" description="Manual journal entries for capital transactions, expenses and other income, with a full entry history." />
          <FeatureCard icon={CalendarClock} color="purple" title="Period Closures" description="Formal general ledger closure controls to lock accounting periods once finalized." />
          <FeatureCard icon={ShieldCheck} color="cyan" title="Maker-Checker Approvals" description="Dual-control approval workflow for accounting entries, with a dedicated checker inbox." />
          <FeatureCard icon={FileText} color="rose" title="Financial Mappings" description="Map ledger accounts to the categories used in financial statements and regulatory returns." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 8. AUDIT & COMPLIANCE                                            */}
      {/* ---------------------------------------------------------------- */}
      <Section>
        <SectionHeading eyebrow="Audit & Compliance" title="Full visibility, dual control" description="Every action on the platform is traceable, and sensitive operations require a second set of eyes before they take effect." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={ScrollText} title="Complete Audit Trail" description="A searchable record of every action taken on the platform — who, what and when." />
          <FeatureCard icon={ShieldCheck} color="blue" title="Maker-Checker Controls" description="Dual-authorization workflow ensures critical transactions are reviewed before posting." />
          <FeatureCard icon={Fingerprint} color="amber" title="Compliance Dashboard" description="A single view of outstanding compliance items across your customer base." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 9. REPORTING & ANALYTICS                                         */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="muted">
        <SectionHeading eyebrow="Reporting & Analytics" title="Regulatory and management reporting, on demand" description="Generate the reports regulators and management require, built directly from live platform data — no manual spreadsheet reconciliation." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={BarChart3} title="Regulatory Returns" description="Generate CBN and NDIC regulatory returns directly from live operational and accounting data." />
          <FeatureCard icon={TrendingUp} color="blue" title="Income Statement" description="Profit and income statement reporting for management review." />
          <FeatureCard icon={Repeat} color="amber" title="Reconciliation Reports" description="Reconcile ledger balances against operational records to catch discrepancies early." />
          <FeatureCard icon={LayoutDashboard} color="purple" title="Management Dashboards" description="Real-time KPIs across customers, loans, deposits and branches." />
          <FeatureCard icon={FileText} color="cyan" title="Report Explorer" description="A flexible report explorer for ad hoc and scheduled reporting needs." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 10. KYC & IDENTITY VERIFICATION                                  */}
      {/* ---------------------------------------------------------------- */}
      <Section>
        <SectionHeading eyebrow="KYC & Identity" title="KYC & Identity Verification" description="Verify customer identity and screen for risk at onboarding and throughout the relationship, using Nigeria's national identity and financial risk infrastructure." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Fingerprint} title="BVN Verification" description="Verify customer identity against the Bank Verification Number registry." />
          <FeatureCard icon={IdCard} color="blue" title="NIN Verification" description="Verify customer identity against the National Identification Number registry." />
          <FeatureCard icon={CreditCard} color="amber" title="Credit Bureau Checks" description="Run credit bureau checks and capture risk scores as part of the lending decision." />
          <FeatureCard icon={ShieldCheck} color="purple" title="AML Screening" description="Anti-money-laundering screening with risk rating captured on the customer record." />
          <FeatureCard icon={ScanFace} color="rose" title="PEP Screening" description="Screen customers for politically exposed person status." />
          <FeatureCard icon={Minus} color="cyan" title="Sanctions Screening" description="Screen customers against sanctions lists as part of onboarding and ongoing monitoring." />
          <FeatureCard icon={FileText} title="Document Management" description="Capture and store identification documents and signatures against the customer profile." />
          <FeatureCard icon={LayoutDashboard} color="blue" title="KYC Dashboard" description="Track pending verifications, expired documents and outstanding approvals in one place." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 11. INTERNET BANKING                                             */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="muted">
        <SectionHeading eyebrow="Digital Channels" title="Internet Banking" description="Give customers a secure, self-service online banking experience connected directly to their core accounts." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Globe2} title="Secure Online Access" description="Customer enrollment and authenticated login to a dedicated internet banking portal." />
          <FeatureCard icon={ArrowLeftRight} color="blue" title="Funds Transfers" description="Customers can move money between accounts and to other beneficiaries in real time." />
          <FeatureCard icon={Repeat} color="amber" title="Bulk & Standing Payments" description="Support for bulk transfers and scheduled standing orders for recurring payments." />
          <FeatureCard icon={Users} color="purple" title="Beneficiary Management" description="Customers can save and manage trusted beneficiaries for faster future payments." />
          <FeatureCard icon={FileText} color="cyan" title="E-Statements" description="Customers can generate and download account statements on demand." />
          <FeatureCard icon={Bell} color="rose" title="Instant Notifications" description="Customers are notified of account activity as it happens." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 12. MOBILE BANKING                                               */}
      {/* ---------------------------------------------------------------- */}
      <Section>
        <SectionHeading eyebrow="Digital Channels" title="Mobile Banking" description="Extend the same secure banking experience to dedicated native apps, available with the Enterprise edition." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Smartphone} title="Native Mobile Apps" description="Branded Android and iOS mobile banking apps for your customers, available in the Enterprise edition." />
          <FeatureCard icon={ShieldCheck} color="blue" title="Consistent Security Model" description="The same authentication and transaction controls as internet banking, extended to mobile." />
          <FeatureCard icon={LayoutDashboard} color="amber" title="Dedicated Admin Apps" description="Android and iOS admin apps give staff mobile access to day-to-day operations." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 13. USSD BANKING                                                 */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="muted">
        <SectionHeading eyebrow="Digital Channels" title="USSD Banking" description="Reach customers on any mobile phone, no smartphone or data connection required — available from the Professional edition." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Phone} title="Universal Reach" description="Bank balance checks and transactions from any handset via a USSD short code." />
          <FeatureCard icon={Sparkles} color="blue" title="Financial Inclusion" description="Extend banking access to customers without smartphones or reliable internet." />
          <FeatureCard icon={ShieldCheck} color="amber" title="PIN-Protected Sessions" description="Secure, PIN-protected USSD sessions tied to the customer's core account." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 14. ATM SERVICES                                                 */}
      {/* ---------------------------------------------------------------- */}
      <Section>
        <SectionHeading eyebrow="Card & Cash Access" title="ATM Services" description="As your institution grows, extend customer access to card and ATM networks — available as part of GemFi's roadmap for institutions scaling beyond digital-only channels." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={CreditCard} title="Card Issuance Ready" description="A core platform designed to support debit card issuance as institutions expand their channel mix." />
          <FeatureCard icon={Banknote} color="blue" title="Cash Access" description="Extend account access to ATM and agent cash networks alongside digital channels." />
          <FeatureCard icon={ShieldCheck} color="amber" title="Controlled Rollout" description="Card and ATM services are scoped and enabled per institution as part of a guided rollout." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 15. VIRTUAL ACCOUNTS                                             */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="muted">
        <SectionHeading eyebrow="Collections" title="Virtual Accounts" description="Issue every customer a dedicated account number mapped straight to their core banking account, simplifying collections and reconciliation." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Wallet} title="Dedicated Account Numbers" description="A unique, bank-grade account number is issued per customer account for identification and payments." />
          <FeatureCard icon={Repeat} color="blue" title="Simplified Reconciliation" description="Inbound payments map directly to the owning customer account, reducing manual matching." />
          <FeatureCard icon={KeyRound} color="amber" title="Safe to Reuse" description="Account numbers are assigned once and persist for the life of the account." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 16. SECURITY                                                     */}
      {/* ---------------------------------------------------------------- */}
      <Section>
        <SectionHeading eyebrow="Security" title="Built with security in mind" description="Controls that protect customer data and institutional funds are built into the platform, not added as an afterthought." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Lock} title="Role-Based Access Control" description="Staff access is scoped by role, so users only see and act on what their responsibilities require." />
          <FeatureCard icon={ShieldCheck} color="blue" title="Maker-Checker Dual Control" description="Sensitive financial actions require independent review and approval before taking effect." />
          <FeatureCard icon={ScrollText} color="amber" title="Full Audit Trail" description="Every action is logged and attributable, supporting internal review and regulatory inquiry." />
          <FeatureCard icon={KeyRound} color="purple" title="Secure Authentication" description="Protected sign-in and customer enrollment flows across every channel." />
          <FeatureCard icon={ScanFace} color="rose" title="Identity-First Onboarding" description="Verified identity is a prerequisite for account activity, reducing fraud risk from day one." />
          <FeatureCard icon={Bell} color="cyan" title="Real-Time Alerts" description="Customers and staff are notified of key account and transaction events as they happen." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 17. ENTERPRISE BENEFITS                                          */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="muted">
        <SectionHeading eyebrow="Enterprise Benefits" title="Why institutions choose to grow with GemFi" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard icon={TrendingUp} title="Built to Scale" description="From a single branch to unlimited offices and users as your institution grows." />
          <FeatureCard icon={Sparkles} color="blue" title="White-Label Ready" description="Launch under your own brand, powered by GemFi underneath." />
          <FeatureCard icon={Landmark} color="amber" title="Faster Time-to-Market" description="Launch on a proven platform instead of building core banking from scratch." />
          <FeatureCard icon={Award} color="purple" title="Lower Total Cost" description="One platform and one vendor relationship in place of multiple disconnected systems." />
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 18. WHY CHOOSE GEMFI                                             */}
      {/* ---------------------------------------------------------------- */}
      <Section>
        <SectionHeading eyebrow="Why GemFi" title="A platform built for how microfinance banks actually operate" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <Star className="w-5 h-5 text-emerald-400 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-2">Unified, not fragmented</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Core banking, accounting, compliance and digital channels in one platform — not a patchwork of point solutions.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <Star className="w-5 h-5 text-emerald-400 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-2">Built for local compliance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Regulatory reporting, BVN/NIN verification and audit controls designed around real regulatory requirements.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <Star className="w-5 h-5 text-emerald-400 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-2">A modern experience</h3>
            <p className="text-xs text-slate-400 leading-relaxed">A clean, responsive interface for staff and customers alike, in place of legacy core banking software.</p>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 19. PRICING                                                      */}
      {/* ---------------------------------------------------------------- */}
      <Section tone="muted" className="pb-20">
        <SectionHeading
          id="pricing"
          eyebrow="Pricing"
          title="Simple, transparent editions"
          description="Three editions of the GemFi Core Banking Suite, scoped to institutions at every stage of growth."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>

        <div className="mt-14">
          <h3 className="text-lg font-semibold text-white mb-4">Compare editions</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-800/70 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-300">Capability</th>
                  <th className="px-4 py-3 font-semibold text-slate-300 text-center">Starter</th>
                  <th className="px-4 py-3 font-semibold text-emerald-400 text-center">Professional</th>
                  <th className="px-4 py-3 font-semibold text-slate-300 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/30'}>
                    <td className="px-4 py-3 text-slate-300">{row.label}</td>
                    <td className="px-4 py-3 text-center"><ComparisonCell value={row.starter} /></td>
                    <td className="px-4 py-3 text-center bg-emerald-500/5"><ComparisonCell value={row.professional} /></td>
                    <td className="px-4 py-3 text-center"><ComparisonCell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* 20. FINAL CTA                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 px-6 py-14 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Ready to modernize your core banking?</h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              See the GemFi Core Banking Suite in action and find the right edition for your institution.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-7">
                <a href="mailto:sales@gemfi.africa?subject=Request%20a%20Demo%20-%20GemFi%20Core%20Banking%20Suite">
                  Request a Demo <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-7">
                <a href="mailto:sales@gemfi.africa?subject=Contact%20Sales%20-%20GemFi%20Core%20Banking%20Suite">
                  <Mail className="w-4 h-4 mr-1.5" /> Contact Sales
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
