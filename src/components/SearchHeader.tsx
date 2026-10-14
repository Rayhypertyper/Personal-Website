import { FilterTabs, type FilterName } from "./FilterTabs";
import { SearchBar } from "./SearchBar";
import { getFilterQuery } from "../search";

interface SearchHeaderProps {
  onSearch: (query: string, quick?: boolean) => void;
  resetRequest: { query: string; animate: boolean };
  activeFilter: FilterName;
  resultCount?: string;
  tourActive?: boolean;
  tourSearch?: { query: string; searching: boolean } | null;
}

/** The hero's canonical search and navigation, shared across every section. */
export function SearchHeader({ onSearch, resetRequest, tourSearch, tourActive, ...tabs }: SearchHeaderProps) {
  const handleFilterChange = (filter: FilterName) => {
    if (filter === tabs.activeFilter) return;
    onSearch(getFilterQuery(filter), true);
  };

  return (
    <div className="search-header">
      <SearchBar
        onSearch={onSearch}
        resetRequest={resetRequest}
        previewQuery={tourSearch?.query}
        previewSearching={tourSearch?.searching}
        tourQuery={tourActive ? `Ray Xu${tabs.activeFilter === "All" ? "" : ` ${tabs.activeFilter}`}` : undefined}
      />
      <FilterTabs {...tabs} onFilterChange={handleFilterChange} />
    </div>
  );
}
