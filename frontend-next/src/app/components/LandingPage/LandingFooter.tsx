"use client";

import { Stethoscope } from "lucide-react";

interface LandingFooterProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function LandingFooter({ onLogin, onSignup }: LandingFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MedPrepAI</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              AI-powered clinical training for students and institutions. Practice
              safely, learn from expert reasoning, and measure competency with
              OSCE-aligned feedback.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Product
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-primary-400">
                  Features
                </a>
              </li>
              <li>
                <a href="#modes" className="hover:text-primary-400">
                  Learning modes
                </a>
              </li>
              <li>
                <a href="#categories" className="hover:text-primary-400">
                  Programs
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary-400">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Account
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <button type="button" onClick={onLogin} className="hover:text-primary-400">
                  Log in
                </button>
              </li>
              <li>
                <button type="button" onClick={onSignup} className="hover:text-primary-400">
                  Sign up
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary-400">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {year} MedPrepAI. All rights reserved.</p>
          <p>Built for medical education · HIPAA-aware architecture</p>
        </div>
      </div>
    </footer>
  );
}
