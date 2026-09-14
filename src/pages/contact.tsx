import { Helmet } from '@dr.pogodin/react-helmet';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { contact, site } from 'virtual:content';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

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
  { label: '1 Business Day', sub: 'Principal Technical Assessment' },
  { label: 'Confidentiality Guarantee', sub: 'Standard NDA Protection' },
  { label: 'Direct Tier-1 Pricing', sub: 'Zero Intermediary Broker Fees' },
  { label: 'Bilingual Engineering', sub: 'Hong Kong & Shenzhen Desks' },
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

export default function ContactPage() {
  const siteUrl = useJsonLdSiteUrl();
  const url = `${siteUrl}/contact`;
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialVolume = searchParams.get('volume') || '';
  const initialScope = searchParams.get('scope') || '';
  const initialSegment = searchParams.get('segment') || '';

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

      <main className="overflow-hidden">
        {/* ═══════════════════════════════════════════════════════
            1 — HERO. Text-only dark banner.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,hsl(42_80%_55%/0.08)_0%,transparent_60%)]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-accent-on-tint/50 via-accent/40 to-transparent" />
          <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
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
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            2 — COMMITMENTS. The hairline-divided band used on every
            route, in place of a row with a tinted icon tile per item.
        ═══════════════════════════════════════════════════════ */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <dl className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
              {commitments.map((c) => (
                <div key={c.label} className="px-6 py-7 lg:px-10">
                  <dt className="text-sm font-semibold text-foreground">{c.label}</dt>
                  <dd className="mt-1 text-xs leading-[1.6] text-muted-foreground">{c.sub}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            3 — INQUIRY. A brief that stays in view on the left — the
            heading, intro and the choice of intent — against the form
            fields on the right. The submit handler, payload, field
            names and prefill logic above are unchanged; only the
            arrangement around them moved.
        ═══════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
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

              {/* Intent as a vertical option list with a gold marker, in
                  place of a row of filled pill buttons. type="button" keeps
                  these from ever submitting the form. */}
              <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Select consultation intent
              </p>
              <div className="mt-3 border-t border-border">
                {inquiryTypes.map((t) => {
                  const isActive = activeIntent === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveIntent(t.id)}
                      aria-pressed={isActive}
                      className={`flex w-full items-center border-b border-l-2 border-b-border py-3.5 pl-4 text-left text-sm font-semibold transition-colors ${
                        isActive
                          ? 'border-l-accent-on-tint text-foreground'
                          : 'border-l-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <input
                type="text"
                name="_gotcha"
                tabIndex={-1}
                autoComplete="off"
                style={{ position: 'absolute', left: '-9999px' }}
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <span>{contact.form.fields.name} *</span>
                  <input
                    name="name"
                    required
                    placeholder="Full name"
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent-on-tint focus:ring-1 focus:ring-accent-on-tint"
                  />
                </label>

                <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <span>{contact.form.fields.email} *</span>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent-on-tint focus:ring-1 focus:ring-accent-on-tint"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <span>{contact.form.fields.company} *</span>
                  <input
                    name="company"
                    required
                    placeholder="Company or Brand entity"
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent-on-tint focus:ring-1 focus:ring-accent-on-tint"
                  />
                </label>

                <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <span>{contact.form.fields.market} *</span>
                  <input
                    name="market"
                    required
                    placeholder="e.g. USA, Canada, UK, Pan-North America"
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent-on-tint focus:ring-1 focus:ring-accent-on-tint"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <span>{contact.form.fields.category}</span>
                  <input
                    name="category"
                    defaultValue={initialCategory}
                    placeholder="e.g. Precision Castings, Retail Packaging"
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent-on-tint focus:ring-1 focus:ring-accent-on-tint"
                  />
                </label>

                <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <span>{contact.form.fields.volume}</span>
                  <input
                    name="volume"
                    defaultValue={initialVolume}
                    placeholder="e.g. 1–2 FCL Containers / Month"
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent-on-tint focus:ring-1 focus:ring-accent-on-tint"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <span>{contact.form.fields.message} *</span>
                <textarea
                  name="message"
                  rows={5}
                  defaultValue={defaultMsg}
                  required
                  placeholder="Outline your target product, material parameters, timeline constraints, or current sourcing bottlenecks..."
                  className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent-on-tint focus:ring-1 focus:ring-accent-on-tint"
                />
              </label>

              {status === 'error' && (
                <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-xs font-medium text-destructive">
                  {errorMsg}
                </p>
              )}

              {status === 'success' && (
                <div role="status" aria-live="polite" className="rounded-md border border-accent-on-tint bg-accent/10 p-5 text-sm font-semibold text-foreground">
                  {contact.form.success}
                </div>
              )}

              <div className="pt-2">
                <InteractiveHoverButton
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full sm:w-auto border-border/80 bg-primary text-primary-foreground hover:bg-primary/90 text-sm tracking-wide"
                >
                  {status === 'sending' ? 'Transmitting inquiry...' : contact.form.submit}
                </InteractiveHoverButton>
              </div>
            </form>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            4 — OFFICES. A four-column hairline grid on dark, moved out
            of a sidebar of bordered cards (one carrying an off-palette
            brown BorderBeam). Phone and email are plain tel:/mailto:
            links throughout; Shenzhen previously used the in-site
            navigation link component while the others used <a>.
        ═══════════════════════════════════════════════════════ */}
        <section className="bg-muted py-20 lg:py-24">
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

            <ul className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {offices.map((office) => (
                <li key={office.label} className="flex flex-col bg-muted px-7 py-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                    {office.role}
                  </p>
                  <h3 className="mt-3 font-heading text-xl text-foreground">{office.label}</h3>

                  <div className="mt-5 flex items-start gap-2 text-sm leading-[1.7] text-muted-foreground">
                    <MapPin size={15} className="mt-1 shrink-0 text-accent-on-tint" />
                    <div>
                      <p>{office.addressEnglish}</p>
                      {office.addressChinese && <p className="mt-1">{office.addressChinese}</p>}
                    </div>
                  </div>

                  <div className="mt-auto space-y-2 border-t border-border pt-5 text-sm">
                    {office.phone && (
                      <a
                        href={`tel:${office.phone}`}
                        className="flex items-center gap-2 font-medium text-foreground transition-colors hover:text-accent-on-tint"
                      >
                        <Phone size={14} className="shrink-0 text-accent-on-tint" />
                        <span>{office.phone}</span>
                      </a>
                    )}
                    <a
                      href={`mailto:${site.contact.email}`}
                      className="flex items-center gap-2 font-medium text-foreground transition-colors hover:text-accent-on-tint"
                    >
                      <Mail size={14} className="shrink-0 text-accent-on-tint" />
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
