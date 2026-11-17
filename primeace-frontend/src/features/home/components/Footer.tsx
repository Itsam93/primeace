import { ArrowUpRight, Mail, Phone } from "lucide-react";

import { navigationItems } from "../data/navigation";
import { services } from "../data/services";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL?.trim();

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER?.replace(
  /\D/g,
  ""
);

const CONTACT_PHONE = WHATSAPP_NUMBER
  ? `+${WHATSAPP_NUMBER}`
  : "";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#07152F] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1fr_1fr] lg:gap-10">
          <div>
            <a
              href="#home"
              className="inline-flex text-2xl font-bold tracking-tight"
              aria-label="PrimeAce home"
            >
              Prime<span className="text-blue-400">Ace</span>
            </a>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              Research, data analytics, business intelligence and digital
              solutions designed around your needs.
            </p>

            <a
              href="#contact"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              Start a conversation
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>

            <ul className="mt-6 space-y-4">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-300 transition-colors hover:text-blue-400"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Our Services
            </h3>

            <ul className="mt-6 space-y-4">
              {services.map((service) => (
                <li key={service.number}>
                  <a
                    href="#services"
                    className="text-sm text-slate-300 transition-colors hover:text-blue-400"
                  >
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h3>

            <div className="mt-6 space-y-5">
              {CONTACT_EMAIL && (
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-start gap-3 text-sm text-slate-300 transition-colors hover:text-blue-400"
                >
                  <Mail size={18} className="mt-0.5 shrink-0" />
                  <span className="break-all">{CONTACT_EMAIL}</span>
                </a>
              )}

              {CONTACT_PHONE && (
                <a
                  href={`tel:${WHATSAPP_NUMBER}`}
                  className="flex items-start gap-3 text-sm text-slate-300 transition-colors hover:text-blue-400"
                >
                  <Phone size={18} className="mt-0.5 shrink-0" />
                  <span>{CONTACT_PHONE}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            © {currentYear} PrimeAce. All rights reserved.
          </p>

          <a
            href="#home"
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
