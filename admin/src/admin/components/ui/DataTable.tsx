import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface FilterOption {
  label: string;
  value: string;
}

export interface TableFilter {
  key: string;
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: TableFilter[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  actions?: React.ReactNode;
  emptyMessage?: string;
  emptySubtitle?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Поиск по таблице...',
  searchValue,
  onSearchChange,
  filters,
  pageSize = 10,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  actions,
  emptyMessage = 'Ничего не найдено',
  emptySubtitle = 'Попробуйте изменить параметры поиска или фильтрации',
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const currentSearch = searchValue !== undefined ? searchValue : localSearch;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
    }
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [data, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const allPageIds = paginatedData.map(keyExtractor);
  const isAllPageSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllPage = () => {
    if (!onSelectionChange) return;
    if (isAllPageSelected) {
      onSelectionChange(selectedIds.filter((id) => !allPageIds.includes(id)));
    } else {
      const newSet = new Set([...selectedIds, ...allPageIds]);
      onSelectionChange(Array.from(newSet));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#E2DED5] overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-[#E2DED5] flex flex-wrap items-center justify-between gap-3 bg-[#FCFBF9]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
            <input
              type="text"
              value={currentSearch}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E2DED5] rounded-md text-[#171717] placeholder-[#A8A29E] focus:outline-none focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36]/30 transition-all"
            />
          </div>

          {/* Filters */}
          {filters && filters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-[#78716C] flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#A8A29E]" /> Фильтры:
              </span>
              {filters.map((filter) => (
                <select
                  key={filter.key}
                  value={filter.selectedValue}
                  onChange={(e) => {
                    filter.onChange(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-white border border-[#E2DED5] rounded-md text-[#171717] focus:outline-none focus:border-[#FF5A36] cursor-pointer"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E2DED5] bg-[#F7F6F2] text-[#78716C] font-medium">
              {selectable && (
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={toggleSelectAllPage}
                    className="rounded border-[#D5D0C5] text-[#FF5A36] focus:ring-[#FF5A36] w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`py-2.5 px-3 select-none ${col.headerClassName || ''} ${
                    col.sortable ? 'cursor-pointer hover:text-[#171717]' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-[#A8A29E]">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3 text-[#FF5A36]" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-[#FF5A36]" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DED5]">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-[#78716C]"
                >
                  <p className="font-medium text-sm text-[#171717]">{emptyMessage}</p>
                  <p className="text-xs text-[#A8A29E] mt-1">{emptySubtitle}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const rowId = keyExtractor(row);
                const isSelected = selectedIds.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors duration-100 ${
                      onRowClick ? 'cursor-pointer hover:bg-[#F9F8F5]' : ''
                    } ${isSelected ? 'bg-[#FFF7F5]' : ''}`}
                  >
                    {selectable && (
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => toggleSelectRow(rowId, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-[#D5D0C5] text-[#FF5A36] focus:ring-[#FF5A36] w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-3 px-3 text-[#171717] align-middle ${col.className || ''}`}
                      >
                        {col.cell ? col.cell(row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-[#E2DED5] flex items-center justify-between text-xs text-[#78716C] bg-[#FCFBF9]">
        <div>
          Показано{' '}
          <span className="font-semibold text-[#171717]">
            {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          —{' '}
          <span className="font-semibold text-[#171717]">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </span>{' '}
          из <span className="font-semibold text-[#171717]">{sortedData.length}</span> записей
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-[#E2DED5] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F3EE] cursor-pointer"
            aria-label="Предыдущая страница"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#171717]" />
          </button>
          <span className="px-2 text-xs font-medium text-[#171717]">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-[#E2DED5] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F3EE] cursor-pointer"
            aria-label="Следующая страница"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#171717]" />
          </button>
        </div>
      </div>
    </div>
  );
}
