'use client';

import { useRouter } from 'next/navigation';
import { Leaf, ArrowLeft, Shield, FileText, CheckCircle, Clock } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative font-sans selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* Decorative background accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/70 transition-all">
        <div className="mx-auto flex max-w-4xl h-16 items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-350 dark:hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Leaf className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              AgriVision <span className="text-emerald-600 dark:text-emerald-400">Pro</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-16">
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-10 md:p-12 relative overflow-hidden transition-all duration-300">
          {/* Header section inside the page */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/60 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 border border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 mb-3 text-xs font-semibold">
                <FileText className="h-4 w-4" />
                Legal Agreements
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Terms of Service
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold self-start md:self-center bg-slate-50 dark:bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              Last updated: June 26, 2026
            </div>
          </div>

          {/* Quick Overview Callout */}
          <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/20 dark:border-indigo-900/30 dark:bg-indigo-950/20 mb-8 flex gap-3.5 items-start">
            <Shield className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Summary of Commitments</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                AgriVision Pro operates a multi-tenant platform connecting farmers and buyers. By using the app, Farmers agree to upload accurate data for mandi calculations and AI scans; Buyers agree to honor locked trade commitments; and Operators oversee configuration rates and system logs.
              </p>
            </div>
          </div>

          {/* Detailed sections */}
          <div className="space-y-8 text-sm leading-relaxed text-slate-600 dark:text-slate-350 font-medium">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">1</span>
                Acceptance of Agreement
              </h2>
              <p>
                By creating an account, registering, or accessing the services provided by AgriVision Pro, you accept and agree to be bound by these Terms of Service. If you do not accept these terms, you are not authorized to use the platform. We reserve the right to modify these terms at any time. Your continued use of the platform constitutes agreement to the updated terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">2</span>
                Multi-Tenant User Roles & Security
              </h2>
              <p>
                AgriVision Pro utilizes multi-tenant logical database isolation. Users must register under a specific active role to participate in the agricultural pipeline:
              </p>
              <ul className="space-y-2.5 pl-4 list-none">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                  <span><strong>🌾 Farmers:</strong> Authorized to upload crop leaf images for AI disease pathography diagnosis, register farm details, view mandi prices, and publish daily milk volumes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                  <span><strong>💼 Buyers:</strong> Authorized to view local milk supply metrics (fat/SNF content), propose contract logs, and track transportation routes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                  <span><strong>🛡️ Master Admins:</strong> Have configuration privileges over commission percentages, global rate limits, user activation audits, and announcement dispatch.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">3</span>
                Contract Execution & Trade Locks
              </h2>
              <p>
                When a Farmer and a Buyer execute a trade contract within the AgriVision B2B Marketplace:
              </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>Quantity commitments and price calculations are locked and legally binding.</li>
                <li>Both parties are subject to automated verification checks (SNF fat percentages, geolocation logistics timestamps).</li>
                <li>Failure to fulfill a locked contract without mutual consent may lead to temporary or permanent deactivation of your account by the Master Administrator.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">4</span>
                AI Crop Scan Disclaimer
              </h2>
              <p>
                The AI Crop Health Scan utilizes advanced computer vision neural networks to detect pathogens (e.g. Early Blight, Leaf Mold) on uploaded plant imagery. While our accuracy rate averages over 90%, these scans are intended for informational diagnostic guidance. AgriVision Pro does not guarantee absolute treatment outcomes and strongly encourages consulting local agronomists before dispensing chemical/fungicide resources.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">5</span>
                Platform Fees and Commissions
              </h2>
              <p>
                Master Administrators configure the platform transaction commission rate (default is 2.5%). This commission is automatically calculated on B2B marketplace trades. We reserve the right to adjust commission schemas with prior notification via the admin announcement channel.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">6</span>
                Termination and Account Status
              </h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate platform policies, engage in deceptive mandi reporting, fail to fulfill locked delivery contracts, or bypass payment systems. Master Administrators audit all activity logs and maintain full authority over account suspension.
              </p>
            </section>
          </div>

          {/* Footer action on terms page */}
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-slate-450 dark:text-slate-500">
              For legal support, contact <a href="mailto:support@agrivision.com" className="hover:underline text-emerald-600">support@agrivision.com</a>
            </p>
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-md hover:shadow-emerald-600/15 active:scale-[0.98]"
            >
              Go Back
            </button>
          </div>
        </article>
      </main>
    </div>
  );
}
