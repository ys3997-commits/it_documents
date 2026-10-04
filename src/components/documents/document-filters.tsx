"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cx } from "@/lib/cx";
import { formatFinancialYear, recentFinancialYears } from "@/lib/financial-year";
import type { Category, Entity, Tag } from "@/types/records";

export function DocumentFilters({
  entities,
  categories,
  tags,
}: {
  entities: Entity[];
  categories: Category[];
  tags: Tag[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryParam = params.get("q") ?? "";
  const selectedTags = new Set((params.get("tags") ?? "").split(",").filter(Boolean));
  const active = params.toString().length > 0;
  const years = recentFinancialYears();

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const search = next.toString();
    router.push(search ? `${pathname}?${search}` : pathname);
  }

  function toggleTag(id: string) {
    const current = (params.get("tags") ?? "").split(",").filter(Boolean);
    const next = current.includes(id)
      ? current.filter((tagId) => tagId !== id)
      : [...current, id];
    update({ tags: next.length ? next.join(",") : null });
  }

  return (
    <div className="card mb-4 space-y-4 p-4">
      <form
        key={queryParam}
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
          update({ q: value || null });
        }}
      >
        <label className="sr-only" htmlFor="document-search">
          Search documents
        </label>
        <input
          id="document-search"
          className="field"
          name="q"
          defaultValue={queryParam}
          placeholder="Search name, person, company, tag, year…"
        />
        <button className="btn btn-secondary" type="submit">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!params.get("fy")} onClick={() => update({ fy: null })}>
          All years
        </FilterChip>
        {years.map((year) => (
          <FilterChip
            key={year}
            active={params.get("fy") === String(year)}
            onClick={() => update({ fy: String(year) })}
          >
            {formatFinancialYear(year)}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!params.get("type")} onClick={() => update({ type: null })}>
          All entities
        </FilterChip>
        <FilterChip
          active={params.get("type") === "individual"}
          onClick={() => update({ type: "individual" })}
        >
          Individual
        </FilterChip>
        <FilterChip
          active={params.get("type") === "company"}
          onClick={() => update({ type: "company" })}
        >
          Company
        </FilterChip>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Person or company"
          value={params.get("entity") ?? ""}
          onChange={(value) => update({ entity: value || null })}
        >
          <option value="">All</option>
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </Select>
        <Select
          label="Category"
          value={params.get("category") ?? ""}
          onChange={(value) => update({ category: value || null })}
        >
          <option value="">All</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <DateField
          label="From"
          value={params.get("from") ?? ""}
          onChange={(value) => update({ from: value || null })}
        />
        <DateField
          label="To"
          value={params.get("to") ?? ""}
          onChange={(value) => update({ to: value || null })}
        />
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <FilterChip
              key={tag.id}
              active={selectedTags.has(tag.id)}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </FilterChip>
          ))}
        </div>
      ) : null}

      {active ? (
        <button
          type="button"
          className="text-sm font-medium text-accent"
          onClick={() => router.push(pathname)}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={cx("chip", active && "chip-active")} onClick={onClick}>
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="field"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
