import { Link } from "react-router-dom";
import {
  Mail,
  MessageCircle,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

const CONTACT_EMAIL = "admin@primeace.com";

function ContactPage() {
  return (
    <main className="bg-white text-[#0A1F44]">
      <section className="bg-[#07152F] px-6 py-28 text-white lg:py-36">
        <div className="mx-auto max-w-7xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Contact Us
          </p>

          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Let's talk about what you have in mind.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Whether you have a research assignment, an analytical
            requirement or a digital project, we'd like to hear from you.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#1556D6]">
              Get in Touch
            </p>

            <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              We'd be glad to hear from you.
            </h2>

            <p className="mt-6 max-w-xl leading-8 text-slate-600">
              Reach out to discuss your requirements, ask a question
              or learn more about our services. You can contact us
              directly or submit a service request.
            </p>

            <div className="mt-10 space-y-7">
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1556D6]">
                  <Mail size={22} />
                </div>

                <div>
                  <h3 className="font-semibold">Email Address</h3>

                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-2 inline-block text-sm text-slate-600 transition-colors hover:text-[#1556D6]"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1556D6]">
                  <MessageCircle size={22} />
                </div>

                <div>
                  <h3 className="font-semibold">WhatsApp</h3>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    You can also reach us through the WhatsApp contact
                    button available on the website.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F8FAFC] p-8 sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#1556D6] shadow-sm">
              <ClipboardList size={23} />
            </div>

            <h3 className="mt-7 text-2xl font-bold">
              Have a specific project?
            </h3>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Submit your requirements through our service request
              page. This allows us to understand what you need and
              review the details of your project.
            </p>

            <Link
              to="/request-service"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1556D6] px-6 py-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#0A1F44]"
            >
              Submit a Service Request
              <ArrowRight size={17} />
            </Link>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <p className="text-sm leading-7 text-slate-500">
                Prefer email? Send your enquiry directly to{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-[#1556D6] hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ContactPage;
