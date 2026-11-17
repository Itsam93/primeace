import professionalImage from "../../../assets/professional.png";
import aboutImage from "../../../assets/about.png";

function About() {
  return (
    <section id="about" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* About information */}
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#1556D6]">
              About PrimeAce
            </p>

            <h2 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-[#0A1F44] sm:text-5xl">
              Practical expertise for work that matters.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
              PrimeAce works with individuals and organisations to address
              their research, business, data and technology needs. We focus
              on understanding each project and delivering solutions that
              meet its requirements.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-5 border-t border-slate-200 pt-7">
              <div>
                <p className="text-sm font-semibold text-[#0A1F44]">
                  Research
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Academic and professional work
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#0A1F44]">
                  Business
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Analysis and reporting
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#0A1F44]">
                  Technology
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Web and digital solutions
                </p>
              </div>
            </div>
          </div>

          {/* Photography */}
          <div className="grid grid-cols-[1.15fr_0.85fr] items-center gap-4 sm:gap-6">
            <div>
              <img
                src={professionalImage}
                alt="Professional project collaboration"
                className="h-[360px] w-full object-cover sm:h-[460px]"
              />
            </div>

            <div className="space-y-4 sm:space-y-6">
              <img
                src={aboutImage}
                alt="Professional working on a project"
                className="h-48 w-full object-cover sm:h-60"
              />

              <div className="bg-[#07152F] px-5 py-7 text-white sm:px-7">
                <p className="text-3xl font-bold tracking-tight">
                  Prime<span className="text-blue-400">Ace</span>
                </p>

                <div className="mt-4 h-px bg-white/20" />

                <p className="mt-4 text-xs font-medium uppercase tracking-widest text-slate-300">
                  Research. Business. Technology.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
