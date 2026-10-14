import { FilterTabs, type FilterName } from "./FilterTabs";
import { SearchBar } from "./SearchBar";

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  activeFilter: FilterName;
  onFilterChange: (filter: FilterName) => void;
  resultCount?: string;
  tourActive?: boolean;
  tourSearch?: { query: string; searching: boolean } | null;
}

/** The hero's canonical search and navigation, shared across every section. */
export function SearchHeader({ onSearch, tourSearch, tourActive, ...tabs }: SearchHeaderProps) {
  return (
    <div className="search-header">
      <SearchBar onSearch={onSearch} previewQuery={tourSearch?.query} previewSearching={tourSearch?.searching} tourQuery={tourActive ? `Ray Xu${tabs.activeFilter === "All" ? "" : ` ${tabs.activeFilter.toLowerCase()}`}` : undefined} />
      <FilterTabs {...tabs} />
    </div>
  );
}
