import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Clock,
  Factory,
  Languages,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { contact, site } from 'virtual:content';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';
import { followInPageLink } from '@/lib/in-page-link';

const title = 'Direct Trade Desk & Inquiries | NAMAN INTERNATIONAL LTD';
const description =
  'Contact NAMAN INTERNATIONAL LTD to initiate a direct sourcing consultation, review factory audit capabilities, or configure container freight logistics.';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const inquiryTypes = [
  { id: 'general', label: 'General Trade Consultation' },
  { id: 'retail', label: 'Retail Sourcing Program' },
  { id: 'wholesale', label: 'Wholesale Volume & FCL' },
  { id: 'quality', label: 'Factory Audit & Quality Inspection' },
];

const commitments = [
  { icon: Clock, label: '1 Business Day', sub: 'Principal Technical Assessment' },
  { icon: ShieldCheck, label: 'Confidentiality Guarantee', sub: 'Standard NDA Protection' },
  { icon: Factory, label: 'Direct Tier-1 Pricing', sub: 'Zero Intermediary Broker Fees' },
  { icon: Languages, label: 'Bilingual Engineering', sub: 'Hong Kong & Shenzhen Desks' },
];

/** What the reply contains, as the hero copy promises it. */
const nextSteps = [
  { title: 'Read by a principal', text: 'Your brief goes to our bilingual operations principals in Hong Kong and Shenzhen.' },
  { title: 'Feasibility assessment', text: 'A formal technical assessment with landed cost parameters.' },
  { title: 'Milestone schedule', text: 'Proposed milestones for your program, all within one business day.' },
];

interface Office {
  label: string;
  role: string;
  addressEnglish: string;
  addressChinese?: string;
  phone?: string;
}

const offices: Office[] = [
  {
    label: contact.offices.shenzhen.label,
    role: 'Factory Operations',
    addressEnglish: contact.offices.shenzhen.addressEnglish,
    addressChinese: contact.offices.shenzhen.addressChinese,
    phone: contact.offices.shenzhen.phone,
  },
  {
    label: contact.offices.hongKong.label,
    role: 'Global HQ & Finance',
    addressEnglish: contact.offices.hongKong.addressEnglish,
    addressChinese: contact.offices.hongKong.addressChinese,
    phone: contact.offices.hongKong.phone,
  },
  {
    label: contact.offices.usa.label,
    role: 'Pacific Gateway',
    addressEnglish: contact.offices.usa.addressEnglish,
  },
  {
    label: contact.offices.manchester.label,
    role: 'UK / European Desk',
    addressEnglish: contact.offices.manchester.addressEnglish,
  },
];

/** Inputs sit on a faint ivory fill inside the white form panel and turn white, with a gold ring, on focus. */
const fieldClass =
  'w-full rounded-xl border border-border bg-muted/70 px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground focus:border-accent-on-tint focus:bg-card focus:ring-2 focus:ring-accent/35 motion-reduce:transition-none';

/** Field label. The asterisk is decorative: the input's own required attribute is what assistive technology reads. */
function FieldLabel({ children, required = false }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
      {children}
      {required && (
        <span aria-hidden="true" className="ml-1 text-accent-on-tint">
          *
        </span>
      )}
    </span>
  );
}

function IconChip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-inset ring-accent/30"
    >
      {children}
    </span>
  );
}

export default function ContactPage() {
  const siteUrl = useJsonLdSiteUrl();
  const url = `${siteUrl}/contact`;
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialVolume = searchParams.get('volume') || '';
  const initialScope = searchParams.get('scope') || '';
  const initialSegment = searchParams.get('segment') || '';
  const hasPrefill = Boolean(initialCategory || initialVolume || initialScope || initialSegment);

  const [activeIntent, setActiveIntent] = useState(
    initialSegment === 'wholesale' ? 'wholesale' : initialSegment === 'retail' ? 'retail' : 'general'
  );

  const defaultMsg = initialScope
    ? `Configured trade program: ${initialScope}${initialSegment ? ` for ${initialSegment} operations` : ''}.`
    : initialSegment
    ? `Trade inquiry for ${initialSegment} sourcing program.`
    : initialCategory
    ? `Inquiry regarding manufacturing capabilities for ${initialCategory}.`
    : '';

  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (formData.get('_gotcha')) return;

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const companyName = String(formData.get('company') ?? '').trim();
    const market = String(formData.get('market') ?? '').trim();
    const category = String(formData.get('category') ?? '').trim();
    const volume = String(formData.get('volume') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();

    setStatus('sending');
    setErrorMsg('');
    try {
      const response = await fetch('/api/contact/trade-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: {
            messages_attributes: [{ body: message || `New trade inquiry (${activeIntent})` }],
            data: {
              __gd_contact_form_title: contact.form.title,
              'Inquiry Type': activeIntent,
              'Company name': companyName,
              'Primary market': market,
              'Product category': category,
              'Expected order volume': volume,
            },
          },
          user: { email, name },
        }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Unable to send your inquiry.');
      setStatus('success');
      form.reset();
    } catch (error) {
      setStatus('error');
      setErrorMsg(error instanceof Error ? error.message : 'Unable to send your inquiry.');
    }
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={`${siteUrl}/assets/images/closing-cta-terminal.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/closing-cta-terminal.jpg`} />
      </Helmet>

      <main className="overflow-clip">
        {/* ═══════════════════════════════════════════════════════
            1 — HERO. Text-led, with the two ways in: the inquiry form
            below, or, from lg, a raised panel of direct lines (email,
            phone, the regional desks) for buyers who would rather
            write or call.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-background pb-28 pt-16 sm:pb-32 sm:pt-20 lg:pb-32 lg:pt-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,hsl(42_80%_55%/0.08)_0%,transparent_60%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-accent-on-tint/50 via-accent/40 to-transparent" />

          <div className="relative mx-auto grid max-w-[1440px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  Direct Regional Trade Desks
                </span>
              </div>
              <h1 className="mt-6 font-heading text-4xl leading-[1.06] text-balance text-foreground sm:text-5xl lg:text-6xl">
                {contact.hero.title}
              </h1>
              <p className="mt-5 text-base leading-[1.8] text-muted-foreground sm:text-lg">
                {contact.hero.text} Every commercial inquiry is reviewed directly by our bilingual
                operations principals in Hong Kong and Shenzhen. We respond with formal technical
                feasibility assessments, landed cost parameters, and milestone schedules within 1
                business day.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <a
                  href="#inquiry"
                  onClick={followInPageLink}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-teal transition-[background-color,box-shadow] duration-300 hover:bg-accent-hover hover:shadow-teal-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span>Start your inquiry</span>
                  <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
                </a>
                <Link001
                  href="#offices"
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>View regional desks</span>
                  <ArrowRight size={14} />
                </Link001>
              </div>
            </div>

            <aside aria-label="Direct lines" className="relative hidden lg:block">
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,hsl(42_80%_55%/0.14),transparent)]" />
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_40px_80px_-44px_hsl(220_45%_15%/0.3)]">
                <div aria-hidden="true" className="h-[3px] bg-gradient-to-r from-accent via-accent/70 to-gold/80" />
                <div className="flex items-baseline justify-between gap-4 border-b border-border px-7 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Direct lines</p>
                  <p className="text-xs text-muted-foreground">Reply within one business day</p>
                </div>
                <ul className="divide-y divide-border">
                  <li>
                    <a
                      href={`mailto:${site.contact.email}`}
                      className="group flex items-center gap-4 px-7 py-4 transition-colors hover:bg-accent/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <IconChip>
                        <Mail size={15} className="text-accent-on-tint" />
                      </IconChip>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-foreground">Email the trade desk</span>
                        <span className="block text-xs text-muted-foreground">{site.contact.email}</span>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
                    </a>
                  </li>
                  {contact.offices.shenzhen.phone && (
                    <li>
                      <a
                        href={`tel:${contact.offices.shenzhen.phone}`}
                        className="group flex items-center gap-4 px-7 py-4 transition-colors hover:bg-accent/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <IconChip>
                          <Phone size={15} className="text-accent-on-tint" />
                        </IconChip>
                        <span className="flex-1">
                          <span className="block text-sm font-semibold text-foreground">Call Shenzhen or Hong Kong</span>
                          <span className="block text-xs text-muted-foreground">{contact.offices.shenzhen.phone}</span>
                        </span>
                        <ArrowRight size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
                      </a>
                    </li>
                  )}
                  <li>
                    <a
                      href="#offices"
                      onClick={followInPageLink}
                      className="group flex items-center gap-4 px-7 py-4 transition-colors hover:bg-accent/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <IconChip>
                        <MapPin size={15} className="text-accent-on-tint" />
                      </IconChip>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-foreground">Visit a regional desk</span>
                        <span className="block text-xs text-muted-foreground">Shenzhen · Hong Kong · California · Manchester</span>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" className="shrink-0 text-accent-on-tint transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
                    </a>
                  </li>
                </ul>
                <p className="flex items-center gap-2 border-t border-border bg-muted px-7 py-3.5 text-xs text-muted-foreground">
                  <Lock size={13} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                  Inquiries are handled under standard NDA confidentiality.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            2 — COMMITMENTS. A raised panel overlapping the hero's lower
            edge, as on the other pages, each commitment led by a gold
            icon chip.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative z-10 -mt-14 px-5 sm:px-8 lg:px-10">
          <dl className="mx-auto grid max-w-[1360px] grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-[0_28px_60px_-32px_hsl(220_45%_15%/0.28)] sm:grid-cols-2 lg:grid-cols-4">
            {commitments.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="flex items-center gap-4 bg-card px-5 py-6 sm:px-6 lg:px-8">
                  <IconChip>
                    <Icon size={16} className="text-accent-on-tint" />
                  </IconChip>
                  <div>
                    <dt className="text-sm font-semibold text-foreground">{c.label}</dt>
                    <dd className="mt-0.5 text-xs leading-[1.6] text-muted-foreground">{c.sub}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </section>

        {/* ═══════════════════════════════════════════════════════
            3 — INQUIRY. The brief, the choice of intent and what happens
            next on the left; the form in a raised white panel on the
            ivory band on the right. The submit handler, payload, field
            names and prefill logic are unchanged.
        ═══════════════════════════════════════════════════════ */}
        <section id="inquiry" tabIndex={-1} className="mt-16 scroll-mt-20 border-y border-border bg-muted outline-none lg:mt-20">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10 lg:py-24">
            <div>
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {contact.hero.eyebrow}
                </span>
              </div>
              <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-foreground">
                {contact.form.title}
              </h2>
              <p className="mt-5 text-base leading-[1.8] text-muted-foreground">{contact.form.text}</p>

              {/* Intent as selectable cards. type="button" keeps them from ever submitting the form. */}
              <p id="intent-label" className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Select consultation intent
              </p>
              <div role="group" aria-labelledby="intent-label" className="mt-3 grid gap-2.5">
                {inquiryTypes.map((t) => {
                  const isActive = activeIntent === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveIntent(t.id)}
                      aria-pressed={isActive}
                      className={`flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left text-sm font-semibold transition-[border-color,box-shadow,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${
                        isActive
                          ? 'border-accent text-foreground shadow-[0_12px_28px_-16px_hsl(42_75%_45%/0.6)] ring-1 ring-accent'
                          : 'border-border text-muted-foreground shadow-xs hover:border-accent/60 hover:text-foreground'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${
                          isActive ? 'bg-accent text-accent-foreground ring-accent' : 'bg-background ring-border'
                        }`}
                      >
                        {isActive && <Check size={12} strokeWidth={3} />}
                      </span>
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 border-t border-border pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">What happens next</p>
                <ol className="mt-5 space-y-5">
                  {nextSteps.map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{step.title}</p>
                        <p className="mt-0.5 text-sm leading-[1.6] text-muted-foreground">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative space-y-6 self-start overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[0_40px_80px_-44px_hsl(220_45%_15%/0.3)] sm:p-10"
              noValidate
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent via-accent/70 to-gold/80" />
              <input
                type="text"
                name="_gotcha"
                tabIndex={-1}
                autoComplete="off"
                style={{ position: 'absolute', left: '-9999px' }}
                aria-hidden="true"
              />

              {hasPrefill && (
                <p className="flex items-start gap-2.5 rounded-xl bg-accent/10 px-4 py-3 text-sm text-foreground ring-1 ring-inset ring-accent/30">
                  <ClipboardCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-on-tint" />
                  Some fields are filled in from the page you came from. Check them before sending.
                </p>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel required>{contact.form.fields.name}</FieldLabel>
                  <input name="name" required autoComplete="name" placeholder="Full name" className={fieldClass} />
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>{contact.form.fields.email}</FieldLabel>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                    className={fieldClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel required>{contact.form.fields.company}</FieldLabel>
                  <input
                    name="company"
                    required
                    autoComplete="organization"
                    placeholder="Company or Brand entity"
                    className={fieldClass}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel required>{contact.form.fields.market}</FieldLabel>
                  <input
                    name="market"
                    required
                    placeholder="e.g. USA, Canada, UK, Pan-North America"
                    className={fieldClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel>{contact.form.fields.category}</FieldLabel>
                  <input
                    name="category"
                    defaultValue={initialCategory}
                    placeholder="e.g. Precision Castings, Retail Packaging"
                    className={fieldClass}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>{contact.form.fields.volume}</FieldLabel>
                  <input
                    name="volume"
                    defaultValue={initialVolume}
                    placeholder="e.g. 1–2 FCL Containers / Month"
                    className={fieldClass}
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <FieldLabel required>{contact.form.fields.message}</FieldLabel>
                <textarea
                  name="message"
                  rows={5}
                  defaultValue={defaultMsg}
                  required
                  placeholder="Outline your target product, material parameters, timeline constraints, or current sourcing bottlenecks..."
                  className={fieldClass}
                />
              </label>

              {/* Always present, so the outcome is announced when it appears. */}
              <div aria-live="polite">
                {status === 'error' && (
                  <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                    {errorMsg}
                  </p>
                )}
                {status === 'success' && (
                  <div role="status" className="flex items-start gap-3 rounded-xl bg-accent/10 p-5 text-sm font-semibold text-foreground ring-1 ring-inset ring-accent/40">
                    <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {contact.form.success}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <InteractiveHoverButton
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full border-accent bg-accent text-sm tracking-wide text-accent-foreground shadow-teal disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {status === 'sending' ? 'Transmitting inquiry...' : contact.form.submit}
                </InteractiveHoverButton>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock size={13} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                  Handled under standard NDA confidentiality
                </p>
              </div>
            </form>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            4 — OFFICES. Four raised cards. Phone and email are plain
            tel: and mailto: links throughout. The target of the hero's
            regional desk links.
        ═══════════════════════════════════════════════════════ */}
        <section id="offices" tabIndex={-1} className="scroll-mt-20 bg-background py-20 outline-none lg:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px w-8 bg-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {contact.offices.title}
                </span>
              </div>
              <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.025em] text-balance text-foreground">
                Regional Operating Desks
              </h2>
              <p className="mt-5 text-base leading-[1.8] text-muted-foreground">
                Direct coordinates for physical inspection appointments, trade documentation, and
                regional logistics support.
              </p>
            </div>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {offices.map((office) => (
                <li
                  key={office.label}
                  className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-[0_24px_50px_-34px_hsl(220_45%_15%/0.3)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{office.role}</p>
                  <h3 className="mt-3 font-heading text-xl text-foreground">{office.label}</h3>

                  <div className="mt-5 flex items-start gap-3 text-sm leading-[1.7] text-muted-foreground">
                    <IconChip>
                      <MapPin size={15} className="text-accent-on-tint" />
                    </IconChip>
                    <div>
                      <p>{office.addressEnglish}</p>
                      {office.addressChinese && <p className="mt-1">{office.addressChinese}</p>}
                    </div>
                  </div>

                  <div className="mt-auto space-y-2.5 border-t border-border pt-5 text-sm">
                    {office.phone && (
                      <a
                        href={`tel:${office.phone}`}
                        className="flex w-fit items-center gap-2 font-medium text-foreground transition-colors hover:text-accent-on-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Phone size={14} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                        <span>{office.phone}</span>
                      </a>
                    )}
                    <a
                      href={`mailto:${site.contact.email}`}
                      className="flex w-fit items-center gap-2 font-medium text-foreground transition-colors hover:text-accent-on-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Mail size={14} aria-hidden="true" className="shrink-0 text-accent-on-tint" />
                      <span>{site.contact.email}</span>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
