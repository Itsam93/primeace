import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function CallToAction() {
  return (
    <section id="contact" className="bg-[#07152F] px-6 py-24 sm:py-28 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-20">
        <div>
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
            Start a Conversation
          </p>

          <h2 className="max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Let's discuss what you need.
          </h2>

          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Tell us about your requirements and the outcome you want to
            achieve. Our team will review your request and discuss the
            appropriate way forward.
          </p>
        </div>

        <div className="flex lg:justify-end">
          <Link
            to="/contact"
            className="group inline-flex w-full items-center justify-center gap-4 bg-[#1556D6] px-7 py-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500 sm:w-auto"
          >
            Contact Us Now
            <ArrowRight
              size={18}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;
