import { Link } from "react-router-dom";

import aboutImage from "../../assets/about.png";

import Navbar from "../../layouts/Navbar";
import FloatingWhatsapp from "../../features/home/components/FloatingWhatsApp";
import { navigationItems } from "../../features/home/data/navigation";

const coreValues = [
  {
    number: "01",
    title: "Practical Solutions",
    description:
      "We focus on solutions that address real needs and deliver practical value.",
  },
  {
    number: "02",
    title: "Multidisciplinary Expertise",
    description:
      "We bring together research, data analytics and technology to approach challenges from different perspectives.",
  },
  {
    number: "03",
    title: "Client-Focused Approach",
    description:
      "We tailor our solutions to the specific objectives, requirements and circumstances of each client.",
  },
  {
    number: "04",
    title: "Professional Delivery",
    description:
      "We prioritise clear communication, attention to detail and professionalism throughout every engagement.",
  },
  {
    number: "05",
    title: "Accuracy and Quality",
    description:
      "We place importance on reliable information, careful analysis and quality in our deliverables.",
  },
  {
    number: "06",
    title: "Flexible Engagement",
    description:
      "We adapt our service delivery to the nature and requirements of each project.",
  },
];

function AboutPage() {
  return (
    <>
      <Navbar
        brandName="Prime"
        brandAccent="Ace"
        navigationItems={navigationItems}
        ctaLabel="Start a Project"
        ctaHref="/request-service"
        homeHref="/"
      />

      <main className="overflow-hidden bg-white text-[#0A1F44]">
        {/* Hero */}
        <section className="relative isolate flex min-h-[520px] items-center overflow-hidden bg-[#07152F] px-6 py-28 text-white lg:min-h-[620px] lg:py-36">
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center"
            style={{
              backgroundImage: `url(${aboutImage})`,
            }}
          />

          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07152F]/95 via-[#07152F]/80 to-[#07152F]/35" />

          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-4xl">
              <div className="mb-8 flex items-center gap-4">
           
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
                  About PrimeAce
                </p>
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl lg:text-7xl">
                Knowledge, precision and technology in practice.
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                We provide research, analytical and digital solutions
                designed to help individuals and organisations address
                challenges, make informed decisions and achieve their
                objectives.
              </p>

              <div className="mt-10">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-4 border-b border-blue-400 pb-2 text-sm font-semibold text-white transition-colors hover:border-white hover:text-blue-200"
                >
                  Discover what we do
                  <span aria-hidden="true" className="text-lg">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
        </section>

        {/* Who We Are */}
        <section className="px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
              <div>
                <div className="mb-7 flex items-center gap-3">
                  
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1556D6]">
                    Who We Are
                  </p>
                </div>

                <h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  Different disciplines. One commitment to quality.
                </h2>
              </div>

              <div className="lg:pt-2">
                <div className="space-y-6 text-[15px] leading-8 text-slate-600 sm:text-base">
                  <p>
                    PrimeAce brings together expertise in research and
                    academic services, data analytics, business intelligence
                    and web development to provide solutions across different
                    areas of professional and organisational needs.
                  </p>

                  <p>
                    We recognise that every project has its own objectives
                    and requirements. Our approach therefore begins with
                    understanding the problem before identifying an
                    appropriate way to address it.
                  </p>

                  <p>
                    Whether the task involves research, data interpretation,
                    reporting or digital development, our focus is on
                    providing thoughtful, relevant and professionally
                    delivered solutions.
                  </p>
                </div>

                <Link
                  to="/services"
                  className="mt-9 inline-flex items-center gap-3 text-sm font-semibold text-[#1556D6] transition-colors hover:text-[#0A1F44]"
                >
                  Explore our services
                  <span aria-hidden="true" className="text-lg">
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* Areas of Expertise */}
            <div className="mt-20 grid border-y border-slate-200 py-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Research & Academic Services",
                "Data Analytics",
                "Business Intelligence",
                "Web Development",
              ].map((area, index) => (
                <div
                  key={area}
                  className={`py-4 lg:px-6 ${
                    index > 0 ? "lg:border-l lg:border-slate-200" : ""
                  }`}
                >
                  <p className="text-xs font-semibold tracking-wider text-[#1556D6]">
                    0{index + 1}
                  </p>

                  <p className="mt-3 max-w-[200px] text-sm font-semibold leading-6 text-[#0A1F44]">
                    {area}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="bg-[#F5F7FA] px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <div className="mb-7 flex items-center gap-3">
                  
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1556D6]">
                    What Guides Us
                  </p>
                </div>

                <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  The standards we bring to every project.
                </h2>

                <p className="mt-6 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
                  Our principles influence how we understand requirements,
                  approach challenges, work with clients and deliver
                  professional services.
                </p>
              </div>

              <div className="border-t border-slate-300">
                {coreValues.map((value) => (
                  <article
                    key={value.number}
                    className="grid gap-3 border-b border-slate-300 py-7 sm:grid-cols-[64px_1fr] sm:gap-6 sm:py-8"
                  >
                    <span className="pt-1 text-sm font-semibold tabular-nums text-[#1556D6]">
                      {value.number}
                    </span>

                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-[#0A1F44] sm:text-xl">
                        {value.title}
                      </h3>

                      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                        {value.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-[#07152F] px-6 py-20 text-white lg:py-28">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                Let's Work Together
              </p>

              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Have a project that needs the right expertise?
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Tell us what you have in mind. We will work with you to
                understand your requirements and determine the right way
                forward.
              </p>
            </div>

            <Link
              to="/contact"
              className="inline-flex shrink-0 items-center justify-center gap-5 self-start border border-blue-400 px-7 py-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-600 hover:border-blue-600 lg:self-center"
            >
              Get in Touch
              <span aria-hidden="true" className="text-lg">
                →
              </span>
            </Link>
          </div>
        </section>
      </main>

      <FloatingWhatsapp />
    </>
  );
}

export default AboutPage;
