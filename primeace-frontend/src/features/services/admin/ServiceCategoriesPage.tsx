import {
  useCallback,
  useEffect,
  useState
} from "react";

import type { FormEvent } from "react";

import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import {
  createServiceCategory,
  deleteServiceCategory,
  getAdminServiceCategories,
  updateServiceCategory,
  updateServiceCategoryStatus
} from "../services/service.service.js";

import type {
  IAdminServiceCategory,
  ICreateServiceCategoryInput,
  IServiceCategoryListParams,
  ServiceCategorySortField
} from "../types/service.type.js";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "inactive";

interface ICategoryFormState {
  name: string;
  slug: string;
  description: string;
  displayOrder: string;
}

const INITIAL_FORM: ICategoryFormState = {
  name: "",
  slug: "",
  description: "",
  displayOrder: "0"
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof ApiError
    ? error.message
    : fallback;
}

function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<
    IAdminServiceCategory[]
  >([]);

  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [includeDeleted, setIncludeDeleted] =
    useState(false);

  const [sortBy, setSortBy] =
    useState<ServiceCategorySortField>("displayOrder");

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [processingCategoryId, setProcessingCategoryId] =
    useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<IAdminServiceCategory | null>(null);

  const [form, setForm] =
    useState<ICategoryFormState>(INITIAL_FORM);

  const [formError, setFormError] = useState("");

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params: IServiceCategoryListParams = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
        includeDeleted
      };

      if (search) {
        params.search = search;
      }

      if (statusFilter !== "all") {
        params.isActive = statusFilter === "active";
      }

      const result = await getAdminServiceCategories(params);

      setCategories(result.categories);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to retrieve service categories. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    search,
    statusFilter,
    includeDeleted,
    sortBy,
    sortOrder
  ]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setForm(INITIAL_FORM);
    setFormError("");
    setActionError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (
    category: IAdminServiceCategory
  ) => {
    setEditingCategory(category);

    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      displayOrder: String(category.displayOrder)
    });

    setFormError("");
    setActionError("");
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingCategory(null);
    setForm(INITIAL_FORM);
    setFormError("");
  };

  const handleFormChange = (
    field: keyof ICategoryFormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: editingCategory
        ? current.slug
        : createSlug(value)
    }));
  };

  const handleSaveCategory = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setFormError("");

    const input: ICreateServiceCategoryInput = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      displayOrder: Number(form.displayOrder)
    };

    if (
      !input.name ||
      !input.slug ||
      !input.description
    ) {
      setFormError("Please complete all required fields.");
      return;
    }

    if (
      !Number.isInteger(input.displayOrder) ||
      input.displayOrder < 0
    ) {
      setFormError(
        "Display order must be a non-negative whole number."
      );
      return;
    }

    setIsSaving(true);

    try {
      if (editingCategory) {
        await updateServiceCategory(
          editingCategory._id,
          input
        );
      } else {
        await createServiceCategory(input);
      }

      setIsFormOpen(false);
      setEditingCategory(null);
      setForm(INITIAL_FORM);

      await loadCategories();
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          "Unable to save the service category. Please try again."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (
    category: IAdminServiceCategory
  ) => {
    const nextStatus = !category.isActive;

    const confirmed = window.confirm(
      nextStatus
        ? `Activate "${category.name}"?`
        : `Deactivate "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingCategoryId(category._id);
    setActionError("");

    try {
      await updateServiceCategoryStatus(
        category._id,
        { isActive: nextStatus }
      );

      await loadCategories();
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          "Unable to update the category status."
        )
      );
    } finally {
      setProcessingCategoryId(null);
    }
  };

  const handleDeleteCategory = async (
    category: IAdminServiceCategory
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"? This category will be moved to deleted records.`
    );

    if (!confirmed) {
      return;
    }

    setProcessingCategoryId(category._id);
    setActionError("");

    try {
      await deleteServiceCategory(category._id);

      if (categories.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadCategories();
      }
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          "Unable to delete the service category."
        )
      );
    } finally {
      setProcessingCategoryId(null);
    }
  };

  const handleRefresh = () => {
    void loadCategories();
  };

  const totalCategories = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Configuration</span>
            <span>/</span>
            <span className="font-medium text-[#1556D6]">
              Services
            </span>
            <span>/</span>
            <span className="font-medium text-[#1556D6]">
              Categories
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#07152F] sm:text-3xl">
            Service Categories
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organise the services offered by PrimeAce.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1556D6]">
            <Layers3 size={23} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Total Service Categories
            </p>

            <p className="mt-1 text-2xl font-bold tabular-nums text-[#07152F]">
              {isLoading && pagination === null
                ? "—"
                : totalCategories.toLocaleString("en-NG")}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-[#07152F]">
            Category Directory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and organise your service categories.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 lg:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search by category name, slug or description..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Search size={16} />
            Search
          </button>

          {(search || searchInput) && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </form>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor="category-status"
              className="text-sm font-medium text-slate-600"
            >
              Status
            </label>

            <select
              id="category-status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as StatusFilter
                );
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All categories</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(event) => {
                  setIncludeDeleted(event.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-slate-300 text-[#1556D6] focus:ring-blue-200"
              />
              Include deleted categories
            </label>

            <div className="flex items-center gap-2">
              <label
                htmlFor="category-sort"
                className="text-sm font-medium text-slate-600"
              >
                Sort by
              </label>

              <select
                id="category-sort"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(
                    event.target.value as ServiceCategorySortField
                  );
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
              >
                <option value="displayOrder">
                  Display order
                </option>
                <option value="name">Name</option>
                <option value="createdAt">Date created</option>
                <option value="updatedAt">Last updated</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSortOrder((current) =>
                    current === "asc" ? "desc" : "asc"
                  );
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
                title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* General Action Error */}
      {actionError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <p className="text-sm text-red-700">
              {actionError}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActionError("")}
            aria-label="Dismiss error"
            className="rounded-lg p-1 text-red-500 transition hover:bg-red-100"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Loading / Fetch Error */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-900"
          >
            Try again
          </button>
        </div>
      )}

      {/* Category Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <h2 className="font-semibold text-[#07152F]">
            Service Categories
          </h2>

          <p className="text-xs text-slate-500">
            {isLoading
              ? "Loading categories..."
              : `${categories.length} of ${totalCategories.toLocaleString("en-NG")} categories`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Display Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading && categories.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-sm text-slate-500"
                  >
                    <RefreshCw
                      size={22}
                      className="mx-auto mb-3 animate-spin text-[#1556D6]"
                    />
                    Loading categories...
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                categories.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
                      <Layers3
                        size={30}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="font-medium text-slate-700">
                        No service categories found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {search
                          ? "Try a different search term."
                          : "Create a category to organise your services."}
                      </p>

                      {!search && (
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1556D6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          <Plus size={16} />
                          Add Category
                        </button>
                      )}
                    </td>
                  </tr>
                )}

              {categories.map((category) => {
                const isProcessing =
                  processingCategoryId === category._id;

                return (
                  <tr
                    key={category._id}
                    className={`transition hover:bg-slate-50/70 ${
                      category.isDeleted ? "bg-slate-50/60" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#07152F]">
                        {category.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {category.slug}
                      </p>
                    </td>

                    <td className="max-w-xs px-6 py-4">
                      <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                        {category.description}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm tabular-nums text-slate-600">
                      {category.displayOrder}
                    </td>

                    <td className="px-6 py-4">
                      {category.isDeleted ? (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                          Deleted
                        </span>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            category.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {category.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(category.updatedAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {!category.isDeleted && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenEdit(category)
                              }
                              disabled={isProcessing}
                              title="Edit category"
                              aria-label={`Edit ${category.name}`}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-[#1556D6] disabled:opacity-40"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleToggleStatus(category)
                              }
                              disabled={isProcessing}
                              title={
                                category.isActive
                                  ? "Deactivate category"
                                  : "Activate category"
                              }
                              aria-label={
                                category.isActive
                                  ? `Deactivate ${category.name}`
                                  : `Activate ${category.name}`
                              }
                              className={`rounded-lg p-2 transition disabled:opacity-40 ${
                                category.isActive
                                  ? "text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                                  : "text-slate-500 hover:bg-green-50 hover:text-green-700"
                              }`}
                            >
                              {isProcessing ? (
                                <LoaderCircle
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : category.isActive ? (
                                <X size={17} />
                              ) : (
                                <Check size={17} />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDeleteCategory(category)
                              }
                              disabled={isProcessing}
                              title="Delete category"
                              aria-label={`Delete ${category.name}`}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              <Trash2 size={17} />
                            </button>
                          </>
                        )}

                        {category.isDeleted && (
                          <span className="text-xs text-slate-400">
                            No actions available
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {(page - 1) * PAGE_SIZE + 1}
                {" - "}
                {Math.min(
                  page * PAGE_SIZE,
                  totalCategories
                )}
              </span>
              {" "}of{" "}
              <span className="font-medium text-slate-700">
                {totalCategories}
              </span>
              {" "}categories
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                disabled={!hasPreviousPage || isLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="px-2 text-sm text-slate-600">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) => current + 1)
                }
                disabled={!hasNextPage || isLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="category-form-title"
                  className="text-lg font-bold text-[#07152F]"
                >
                  {editingCategory
                    ? "Edit Service Category"
                    : "Add Service Category"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the category information below.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                disabled={isSaving}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveCategory}
              className="space-y-5 p-6"
            >
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
                >
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <p className="text-sm text-red-700">
                    {formError}
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Category Name
                </label>

                <input
                  id="category-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    handleNameChange(event.target.value)
                  }
                  placeholder="e.g. Research & Academic"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="category-slug"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  URL Slug
                </label>

                <input
                  id="category-slug"
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={form.slug}
                  onChange={(event) =>
                    handleFormChange(
                      "slug",
                      event.target.value.toLowerCase()
                    )
                  }
                  placeholder="research-academic"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Use lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="category-description"
                  required
                  minLength={2}
                  maxLength={500}
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    handleFormChange(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe the services that belong to this category..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {form.description.length}/500
                </p>
              </div>

              <div>
                <label
                  htmlFor="category-display-order"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Display Order
                </label>

                <input
                  id="category-display-order"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={form.displayOrder}
                  onChange={(event) =>
                    handleFormChange(
                      "displayOrder",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Lower numbers appear first.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingCategory
                        ? "Save Changes"
                        : "Create Category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceCategoriesPage;
