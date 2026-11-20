import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  BriefcaseBusiness,
  RefreshCw
} from "lucide-react";

import {
  apiRequest,
  ApiError
} from "../../lib/api.js";

interface ProjectCoverImage {
  url: string;
  alt: string;
}

interface ProjectVideoClip {
  url: string;
  thumbnailUrl: string;
  alt: string;
}

interface ProjectCategory {
  id: string;
  name: string;
  slug: string;
}

interface PublicProject {
  id: string;
  title: string;
  description: string;
  serviceNames: string[];
  category: ProjectCategory | null;
  completedAt: string | null;
  coverImage: ProjectCoverImage | null;
  videoClip: ProjectVideoClip | null;
}

interface PublicProjectListResponse {
  projects: PublicProject[];
}

interface PublicProjectCategoryListResponse {
  categories: ProjectCategory[];
}

const ALL_CATEGORIES = "all";

function formatCompletionDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function ProjectsPage() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);

  const [selectedCategory, setSelectedCategory] = useState(
    ALL_CATEGORIES
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const loadProjects = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const [
        projectResult,
        categoryResult
      ] = await Promise.all([
        apiRequest<PublicProjectListResponse>(
          "/public/projects/featured"
        ),
        apiRequest<PublicProjectCategoryListResponse>(
          "/public/project-categories"
        )
      ]);

      if (requestId !== requestIdRef.current) return;

      setProjects(projectResult.projects);
      setCategories(categoryResult.categories);

      setSelectedCategory(ALL_CATEGORIES);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load projects. Please try again."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadProjects();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) {
      return projects;
    }

    return projects.filter(
      (project) => project.category?.id === selectedCategory
    );
  }, [projects, selectedCategory]);

  const hasCategories = categories.length > 0;

  return (
    <main className="bg-white text-[#0A1F44]">
      {/* Page hero */}
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

      {/* Project showcase */}
      <section className="px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <RefreshCw
                size={30}
                className="animate-spin text-[#1556D6]"
              />

              <p className="mt-5 text-sm text-slate-500">
                Loading projects...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <BriefcaseBusiness size={30} strokeWidth={1.6} />
              </div>

              <h2 className="mt-7 text-2xl font-bold tracking-tight">
                Unable to load projects.
              </h2>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void loadProjects()}
                className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#1556D6] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A1F44]"
              >
                Try Again
                <RefreshCw size={16} />
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#1556D6]">
                <BriefcaseBusiness size={30} strokeWidth={1.6} />
              </div>

              <h2 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl">
                Our project showcase is being prepared.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                We are preparing a collection of selected projects to
                give visitors a better understanding of our work and
                capabilities. Please check back as our showcase develops.
              </p>

              <Link
                to="/contact"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#1556D6] px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#0A1F44]"
              >
                Discuss a Project
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              {/* Section heading */}
              <div className="mb-10 max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1556D6]">
                  Selected Work
                </p>

                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Projects we've delivered.
                </h2>

                <p className="mt-4 text-base leading-8 text-slate-600">
                  A selection of completed projects across our areas
                  of expertise.
                </p>
              </div>

              {/* Category filters */}
              {hasCategories && (
                <div className="mb-10">
                  <div
                    className="flex flex-wrap gap-3"
                    aria-label="Filter projects by category"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(ALL_CATEGORIES)}
                      aria-pressed={selectedCategory === ALL_CATEGORIES}
                      className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                        selectedCategory === ALL_CATEGORIES
                          ? "bg-[#1556D6] text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-[#1556D6] hover:text-[#1556D6]"
                      }`}
                    >
                      All
                    </button>

                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        aria-pressed={selectedCategory === category.id}
                        className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? "bg-[#1556D6] text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-[#1556D6] hover:text-[#1556D6]"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtered projects */}
              {filteredProjects.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 text-center">
                  <BriefcaseBusiness
                    size={36}
                    strokeWidth={1.4}
                    className="text-slate-400"
                  />

                  <h3 className="mt-5 text-xl font-bold text-[#0A1F44]">
                    No projects in this category yet.
                  </h3>

                  <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                    There are currently no featured projects in this
                    category. Explore our other completed work.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory(ALL_CATEGORIES)}
                    className="mt-6 text-sm font-semibold text-[#1556D6] hover:underline"
                  >
                    View all projects
                  </button>
                </div>
              ) : (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.map((project) => (
                    <article
                      key={project.id}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow duration-300 hover:shadow-lg"
                    >
                      {/* Project cover */}
                      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                        {project.coverImage ? (
                          <img
                            src={project.coverImage.url}
                            alt={project.coverImage.alt || project.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <BriefcaseBusiness
                              size={48}
                              strokeWidth={1.2}
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        {/* Category and services */}
                        <div className="mb-4 flex flex-wrap gap-2">
                          {project.category && (
                            <span className="rounded-full bg-[#0A1F44] px-3 py-1 text-xs font-medium text-white">
                              {project.category.name}
                            </span>
                          )}

                          {project.serviceNames.map((service, index) => (
                            <span
                              key={`${service}-${index}`}
                              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#1556D6]"
                            >
                              {service}
                            </span>
                          ))}
                        </div>

                        {/* Project details */}
                        <h3 className="text-xl font-bold leading-snug tracking-tight text-[#0A1F44]">
                          {project.title}
                        </h3>

                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                          {project.description}
                        </p>

                        {/* Optional video */}
                        {project.videoClip && (
                          <div className="mt-6">
                            <video
                              controls
                              preload="metadata"
                              poster={
                                project.videoClip.thumbnailUrl || undefined
                              }
                              aria-label={
                                project.videoClip.alt ||
                                `${project.title} project video`
                              }
                              className="aspect-video w-full rounded-lg bg-black"
                            >
                              <source src={project.videoClip.url} />
                              Your browser does not support video playback.
                            </video>
                          </div>
                        )}

                        {/* Completion date */}
                        {project.completedAt && (
                          <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                            Completed{" "}
                            {formatCompletionDate(project.completedAt)}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Contact CTA */}
              <div className="mt-20 rounded-2xl bg-[#07152F] px-7 py-12 text-center text-white sm:px-12">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Have a project in mind?
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Let's discuss your requirements and how PrimeAce
                  can help you achieve your objectives.
                </p>

                <Link
                  to="/contact"
                  className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#1556D6] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Discuss a Project
                  <ArrowRight size={17} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default ProjectsPage;
