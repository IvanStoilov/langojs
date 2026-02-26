import { useEffect, useRef } from "preact/hooks";
import type { Signal } from "@preact/signals";
import type { TranslationStatus } from "../../types/index.js";

type StatusFilter =
  | "all"
  | "missing"
  | "partial"
  | "pending"
  | "complete"
  | "unused";

interface SidebarProps {
  items: TranslationStatus[];
  selectedKey: Signal<string | null>;
  searchQuery: Signal<string>;
  statusFilter: Signal<StatusFilter>;
  pendingApproval: string[];
  unusedKeys: string[];
  onSearch: (query: string) => void;
  onSelect: (key: string) => void;
  onFilterChange: (filter: StatusFilter) => void;
  stats: {
    total: number;
    complete: number;
    partial: number;
    missing: number;
    pending: number;
    unused: number;
  };
}

export function Sidebar({
  items,
  selectedKey,
  searchQuery,
  statusFilter,
  pendingApproval,
  unusedKeys,
  onSearch,
  onSelect,
  onFilterChange,
  stats,
}: SidebarProps) {
  return (
    <aside class="w-96 flex-shrink-0 border-r border-[var(--color-border)] flex flex-col h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <div class="p-4 border-b border-[var(--color-border)]">
        <div class="flex items-center gap-2 mb-1">
          <div class="w-6 h-6 rounded bg-[var(--color-accent)] flex items-center justify-center">
            <svg
              class="w-3.5 h-3.5 text-[var(--color-bg)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </div>
          <h1 class="text-base font-semibold text-[var(--color-text)]">
            LangoJS
          </h1>
        </div>
        <div class="flex gap-3 text-xs text-[var(--color-text-muted)] mt-3">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"></span>
            {stats.complete}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]"></span>
            {stats.partial}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-error)]"></span>
            {stats.missing}
          </span>
          <span class="text-[var(--color-text-dim)] ml-auto">
            {stats.total} total
          </span>
        </div>
        {(stats.pending > 0 || stats.unused > 0) && (
          <div class="flex items-center gap-3 mt-2 text-xs">
            {stats.pending > 0 && (
              <span class="flex items-center gap-1.5 text-[var(--color-warning)]">
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {stats.pending} pending
              </span>
            )}
            {stats.unused > 0 && (
              <span class="flex items-center gap-1.5 text-[var(--color-text-dim)]">
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                {stats.unused} unused
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div class="p-3 border-b border-[var(--color-border-subtle)]">
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-dim)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search translations..."
            value={searchQuery.value}
            onInput={(e) => onSearch((e.target as HTMLInputElement).value)}
            class="search-input"
          />
        </div>

        {/* Status Filter */}
        <div class="flex gap-1 mt-2 flex-wrap">
          <FilterButton
            label="All"
            value="all"
            current={statusFilter.value}
            onClick={onFilterChange}
          />
          <FilterButton
            label="Missing"
            value="missing"
            current={statusFilter.value}
            onClick={onFilterChange}
            color="error"
          />
          <FilterButton
            label="Partial"
            value="partial"
            current={statusFilter.value}
            onClick={onFilterChange}
            color="warning"
          />
          <FilterButton
            label="Pending"
            value="pending"
            current={statusFilter.value}
            onClick={onFilterChange}
            color="warning"
          />
          <FilterButton
            label="Complete"
            value="complete"
            current={statusFilter.value}
            onClick={onFilterChange}
            color="success"
          />
          <FilterButton
            label="Unused"
            value="unused"
            current={statusFilter.value}
            onClick={onFilterChange}
          />
        </div>
      </div>

      {/* Translation List */}
      <TranslationList
        items={items}
        selectedKey={selectedKey}
        pendingApproval={pendingApproval}
        unusedKeys={unusedKeys}
        onSelect={onSelect}
      />
    </aside>
  );
}

interface TranslationListProps {
  items: TranslationStatus[];
  selectedKey: Signal<string | null>;
  pendingApproval: string[];
  unusedKeys: string[];
  onSelect: (key: string) => void;
}

function TranslationList({
  items,
  selectedKey,
  pendingApproval,
  unusedKeys,
  onSelect,
}: TranslationListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view when selection changes
  useEffect(() => {
    if (!selectedKey.value || !listRef.current) return;

    const selectedElement = listRef.current.querySelector(
      `[data-key="${selectedKey.value}"]`,
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedKey.value]);

  if (items.length === 0) {
    return (
      <div class="flex-1 overflow-y-auto sidebar-scroll">
        <div class="p-4 text-center text-[var(--color-text-dim)] text-sm">
          No translations found
        </div>
      </div>
    );
  }

  return (
    <div ref={listRef} class="flex-1 overflow-y-auto sidebar-scroll">
      <div class="py-1">
        {items.map((item) => {
          const hasPending = pendingApproval.some((p) =>
            p.endsWith(`:${item.key}`),
          );
          const isUnused = unusedKeys.includes(item.key);
          return (
            <TranslationListItem
              key={item.key}
              item={item}
              isSelected={selectedKey.value === item.key}
              hasPending={hasPending}
              isUnused={isUnused}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

interface TranslationListItemProps {
  item: TranslationStatus;
  isSelected: boolean;
  hasPending: boolean;
  isUnused: boolean;
  onSelect: (key: string) => void;
}

function TranslationListItem({
  item,
  isSelected,
  hasPending,
  isUnused,
  onSelect,
}: TranslationListItemProps) {
  const statusColors = {
    complete: "bg-[var(--color-success)]",
    partial: "bg-[var(--color-warning)]",
    missing: "bg-[var(--color-error)] status-dot-missing",
  };

  return (
    <button
      onClick={() => onSelect(item.key)}
      data-key={item.key}
      class={`translation-item w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-[var(--color-surface-raised)] cursor-pointer ${isSelected ? "active" : ""}`}
    >
      <span
        class={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${statusColors[item.status]}`}
      ></span>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <span class="font-mono text-xs text-[var(--color-text)] truncate">
            {item.key}
          </span>
          {hasPending && (
            <svg
              class="w-3 h-3 flex-shrink-0 text-[var(--color-warning)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              title="Pending approval"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {isUnused && (
            <svg
              class="w-3 h-3 flex-shrink-0 text-[var(--color-text-dim)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              title="Unused - not found in codebase"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          )}
        </div>
        <div class="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wide mt-0.5">
          {item.group}
        </div>
      </div>
    </button>
  );
}

interface FilterButtonProps {
  label: string;
  value: StatusFilter;
  current: StatusFilter;
  onClick: (value: StatusFilter) => void;
  color?: "error" | "warning" | "success";
}

function FilterButton({
  label,
  value,
  current,
  onClick,
  color,
}: FilterButtonProps) {
  const isActive = current === value;

  const colorClasses = {
    error: isActive
      ? "bg-[var(--color-error)] text-white"
      : "text-[var(--color-error)] hover:bg-[var(--color-error)]/10",
    warning: isActive
      ? "bg-[var(--color-warning)] text-white"
      : "text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10",
    success: isActive
      ? "bg-[var(--color-success)] text-white"
      : "text-[var(--color-success)] hover:bg-[var(--color-success)]/10",
  };

  const baseClass = isActive
    ? "bg-[var(--color-accent)] text-white"
    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]";

  return (
    <button
      onClick={() => onClick(value)}
      class={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${color ? colorClasses[color] : baseClass}`}
    >
      {label}
    </button>
  );
}
