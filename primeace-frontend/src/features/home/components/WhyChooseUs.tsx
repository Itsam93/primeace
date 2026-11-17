import { values } from "../data/values";

function WhyChooseUs() {
  return (
    <section className="bg-[#F4F6FA] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          {/* Introduction */}
          <div className="lg:pt-4">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#1556D6]">
              Why PrimeAce
            </p>

            <h2 className="max-w-xl text-4xl font-bold leading-[1.15] tracking-tight text-[#07152F] sm:text-5xl lg:text-[3.5rem]">
              Good work begins with the right approach.
            </h2>

            <p className="mt-7 max-w-md text-base leading-8 text-slate-600">
              Every engagement requires a clear understanding of the
              objective, sound professional judgement and attention to
              the details that matter. These principles guide how we
              approach our work.
            </p>

            <a
              href="#contact"
              className="mt-9 inline-flex items-center gap-4 border-b border-[#1556D6] pb-2 text-sm font-semibold text-[#0A1F44] transition-colors duration-200 hover:text-[#1556D6]"
            >
              Work with PrimeAce
              <span aria-hidden="true" className="text-lg">
                →
              </span>
            </a>
          </div>

          {/* PrimeAce differentiators */}
          <div className="grid sm:grid-cols-2 sm:gap-x-10">
            {values.map((value, index) => (
              <article
                key={value.number}
                className={`border-t border-slate-300 py-8 ${
                  index >= 4 ? "sm:border-b" : ""
                }`}
              >
                <div className="flex items-start gap-5">
                  <span className="pt-1 text-sm font-semibold tabular-nums text-[#1556D6]">
                    {value.number}
                  </span>

                  <div>
                    <h3 className="text-lg font-semibold leading-snug text-[#07152F]">
                      {value.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {value.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
