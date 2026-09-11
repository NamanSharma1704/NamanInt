import { Helmet } from '@dr.pogodin/react-helmet';
import { ShieldCheck, Clock, FileCheck2, Globe2, Phone, Mail, MapPin } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { contact, site } from 'virtual:content';
import { BorderBeam } from '@/components/ui/border-beam';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Link001 } from '@/components/ui/skiper-ui/skiper40';

const siteUrl = 'https://nevba9hqli.preview.c35.airoapp.ai';
const url = `${siteUrl}/contact`;
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

export default function ContactPage() {
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
        {/* 1. Contact Hero — Dark Banner */}
        <section className="relative overflow-hidden bg-primary py-16 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,hsl(179_80%_27%/0.12)_0%,transparent_60%)]" />
          <div className="pointer-events-none absolute top-0 left-0 h-px w-full bg-gradient-to-r from-accent/50 via-accent/15 to-transparent" />
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  Direct Regional Trade Desks
                </span>
              </div>
              <h1 className="mt-6 font-heading text-4xl leading-[1.06] text-white sm:text-5xl lg:text-6xl">
                {contact.hero.title}
              </h1>
              <p className="mt-5 text-base leading-[1.75] text-white/65 sm:text-lg">
                {contact.hero.text} Every commercial inquiry is reviewed directly by our bilingual operations principals in Hong Kong and Shenzhen. We respond with formal technical feasibility assessments, landed cost parameters, and milestone schedules within 1 business day.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Institutional SLA & Security Strip */}
        <section className="border-b border-border bg-card py-6 sm:py-8">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:gap-8">
              {[
                { icon: Clock, label: '1 Business Day', sub: 'Principal Technical Assessment' },
                { icon: ShieldCheck, label: 'Confidentiality Guarantee', sub: 'Standard NDA Protection' },
                { icon: FileCheck2, label: 'Direct Tier-1 Pricing', sub: 'Zero Intermediary Broker Fees' },
                { icon: Globe2, label: 'Bilingual Engineering', sub: 'Hong Kong & Shenzhen Desks' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Icon size={16} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Inquiry Form & Regional Directory */}
        <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-16 lg:px-10 lg:py-28">
          <div>
            {/* Intent Filter Tabs */}
            <div className="border-b border-border pb-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                Select Consultation Intent
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {inquiryTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveIntent(t.id)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                      activeIntent === t.id
                        ? 'bg-accent text-white shadow-teal'
                        : 'border border-border bg-card text-muted-foreground hover:border-accent/60 hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground">
                {contact.form.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {contact.form.text}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
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
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </label>

                <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <span>{contact.form.fields.email} *</span>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
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
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </label>

                <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <span>{contact.form.fields.market} *</span>
                  <input
                    name="market"
                    required
                    placeholder="e.g. USA, Canada, UK, Pan-North America"
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
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
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </label>

                <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <span>{contact.form.fields.volume}</span>
                  <input
                    name="volume"
                    defaultValue={initialVolume}
                    placeholder="e.g. 1–2 FCL Containers / Month"
                    className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
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
                  className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </label>

              {status === 'error' && (
                <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-xs font-medium text-destructive">
                  {errorMsg}
                </p>
              )}

              {status === 'success' && (
                <div role="status" aria-live="polite" className="rounded-md border border-accent bg-accent/10 p-5 text-sm font-semibold text-foreground">
                  {contact.form.success}
                </div>
              )}

              <div className="pt-2">
                <InteractiveHoverButton
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full sm:w-auto border-border/80 bg-primary text-primary-foreground hover:bg-accent text-sm tracking-wide"
                >
                  {status === 'sending' ? 'Transmitting inquiry...' : contact.form.submit}
                </InteractiveHoverButton>
              </div>
            </form>
          </div>

          {/* Regional Desk Directory */}
          <aside className="space-y-6">
            <h3 className="font-heading text-2xl font-bold text-foreground">
              Regional Operating Desks
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Direct coordinates for physical inspection appointments, trade documentation, and regional logistics support.
            </p>

            <div className="space-y-4">
              {/* Shenzhen */}
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xs overflow-hidden">
                <BorderBeam size={220} duration={12} colorFrom="#8B4513" colorTo="#2a4365" borderWidth={1.5} />
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{contact.offices.shenzhen.label}</h4>
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Factory Operations
                  </span>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <p>{contact.offices.shenzhen.addressEnglish}</p>
                    <p className="mt-1 text-muted-foreground/70">{contact.offices.shenzhen.addressChinese}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Phone size={13} className="text-accent" />
                    <Link001 href={`tel:${contact.offices.shenzhen.phone}`} className="text-foreground hover:text-accent">
                      {contact.offices.shenzhen.phone}
                    </Link001>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Mail size={13} className="text-accent" />
                    <Link001 href={`mailto:${site.contact.email}`} className="text-foreground hover:text-accent">
                      {site.contact.email}
                    </Link001>
                  </div>
                </div>
              </div>

              {/* Hong Kong */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{contact.offices.hongKong.label}</h4>
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Global HQ & Finance
                  </span>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <p>{contact.offices.hongKong.addressEnglish}</p>
                    <p className="mt-1 text-muted-foreground/70">{contact.offices.hongKong.addressChinese}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs">
                  <a href={`tel:${contact.offices.hongKong.phone}`} className="flex items-center gap-1.5 font-medium text-foreground hover:text-accent">
                    <Phone size={13} className="text-accent" />
                    <span>{contact.offices.hongKong.phone}</span>
                  </a>
                  <a href={`mailto:${site.contact.email}`} className="flex items-center gap-1.5 font-medium text-foreground hover:text-accent">
                    <Mail size={13} className="text-accent" />
                    <span>{site.contact.email}</span>
                  </a>
                </div>
              </div>

              {/* USA */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{contact.offices.usa.label}</h4>
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Pacific Gateway
                  </span>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
                  <p>{contact.offices.usa.addressEnglish}</p>
                </div>
                <div className="mt-4 border-t border-border pt-3 text-xs">
                  <a href={`mailto:${site.contact.email}`} className="flex items-center gap-1.5 font-medium text-foreground hover:text-accent">
                    <Mail size={13} className="text-accent" />
                    <span>{site.contact.email}</span>
                  </a>
                </div>
              </div>

              {/* Manchester */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{contact.offices.manchester.label}</h4>
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    UK / European Desk
                  </span>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
                  <p>{contact.offices.manchester.addressEnglish}</p>
                </div>
                <div className="mt-4 border-t border-border pt-3 text-xs">
                  <a href={`mailto:${site.contact.email}`} className="flex items-center gap-1.5 font-medium text-foreground hover:text-accent">
                    <Mail size={13} className="text-accent" />
                    <span>{site.contact.email}</span>
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}