export type FilterType = "all" | "active" | "completed";

interface TodoFiltersProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  activeCount: number;
  completedCount: number;
  totalCount: number;
}

export function TodoFilters(props: TodoFiltersProps) {
  return () => (
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div class="flex gap-2">
        <button
          onClick={() => props.onFilterChange("all")}
          class={`px-4 py-2 rounded-lg font-medium transition-colors ${
            props.currentFilter === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All
        </button>
        <button
          onClick={() => props.onFilterChange("active")}
          class={`px-4 py-2 rounded-lg font-medium transition-colors ${
            props.currentFilter === "active"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => props.onFilterChange("completed")}
          class={`px-4 py-2 rounded-lg font-medium transition-colors ${
            props.currentFilter === "completed"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Completed
        </button>
      </div>
      <div class="text-sm text-gray-600">
        {props.activeCount} active • {props.completedCount} completed •{" "}
        {props.totalCount} total
      </div>
    </div>
  );
}
