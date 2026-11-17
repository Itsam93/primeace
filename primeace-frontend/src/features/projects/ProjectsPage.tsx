import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";

function ProjectsPage() {
  return (
    <main className="bg-white text-[#0A1F44]">
      <section className="bg-[#07152F] px-6 py-28 text-white lg:py-36">
        <div className="mx-auto max-w-7xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Our Projects
          </p>

          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Ideas translated into meaningful solutions.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Explore selected work across our research, analytics,
            business intelligence and technology service areas.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 lg:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#1556D6]">
            <BriefcaseBusiness size={30} strokeWidth={1.6} />
          </div>

          <h2 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl">
            Our project showcase is being prepared.
          </h2>

          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            We are preparing a collection of selected projects to give
            visitors a better understanding of our work and capabilities.
            Please check back as our showcase develops.
          </p>

          <Link
            to="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#1556D6] px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#0A1F44]"
          >
            Discuss a Project
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ProjectsPage;
