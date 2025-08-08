import React, { useState, useCallback, useEffect } from 'react';
import searchApi, { DishSearchResult, UserSearchResult, ReviewSearchResult, PaginatedResponse } from '../api/searchApi';
import '../css/AdminLayout.css';

interface AdminSearchComponentProps {
  searchType: 'dishes' | 'users' | 'reviews';
  placeholder?: string;
  onResultSelect?: (result: any) => void;
  className?: string;
  showAdvanced?: boolean;
}

const AdminSearchComponent: React.FC<AdminSearchComponentProps> = ({
  searchType,
  placeholder = 'Tìm kiếm...',
  onResultSelect,
  className = '',
  showAdvanced = false
}) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    status: '',
    role: ''
  });

  // Type guard functions
  const isPaginatedResponse = (data: any): data is PaginatedResponse<any> => {
    return data && typeof data === 'object' && 
           Array.isArray(data.content) && 
           typeof data.number === 'number' && 
           typeof data.totalPages === 'number';
  };

  // Debounced search for suggestions
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (keyword.length > 1) {
      const timeout = setTimeout(async () => {
        try {
          let response: { data: any[] | PaginatedResponse<any> };
          switch (searchType) {
            case 'dishes':
              response = await searchApi.searchSuggestions(keyword);
              if (isPaginatedResponse(response.data)) {
                setSuggestions(response.data.content.slice(0, 5));
              } else {
                setSuggestions((response.data || []).slice(0, 5));
              }
              break;
            case 'users':
              response = await searchApi.searchUsers({ query: keyword, size: 5 });
              if (isPaginatedResponse(response.data)) {
                setSuggestions(response.data.content);
              } else {
                setSuggestions(response.data || []);
              }
              break;
            case 'reviews':
              response = await searchApi.searchReviews({ query: keyword, size: 5 });
              if (isPaginatedResponse(response.data)) {
                setSuggestions(response.data.content);
              } else {
                setSuggestions(response.data || []);
              }
              break;
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      }, 300);

      setSearchTimeout(timeout);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [keyword, searchType]);

  const performSearch = useCallback(async (searchKeyword: string, searchFilters = filters) => {
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      let response: { data: any[] | PaginatedResponse<any> };

      switch (searchType) {
        case 'dishes':
          if (searchFilters.category || searchFilters.minPrice || searchFilters.maxPrice) {
            response = await searchApi.searchDishesWithFilters({
              keyword: searchKeyword,
              category: searchFilters.category || undefined,
              minPrice: searchFilters.minPrice ? Number(searchFilters.minPrice) : undefined,
              maxPrice: searchFilters.maxPrice ? Number(searchFilters.maxPrice) : undefined,
            });
          } else {
            response = await searchApi.searchDishesAdvanced(searchKeyword);
          }
          break;
        case 'users':
          response = await searchApi.searchUsers({ 
            query: searchKeyword, 
            size: 20 
          });
          break;
        case 'reviews':
          response = await searchApi.searchReviews({ 
            query: searchKeyword, 
            size: 20 
          });
          break;
        default:
          response = { data: [] };
      }

      let resultData: any[];
      if (isPaginatedResponse(response.data)) {
        resultData = response.data.content;
      } else {
        resultData = response.data || [];
      }

      setResults(resultData);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchType, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(keyword);
  };

  const handleSuggestionClick = (suggestion: any) => {
    setKeyword(getDisplayName(suggestion));
    setSuggestions([]);
    if (onResultSelect) {
      onResultSelect(suggestion);
    }
  };

  const handleResultClick = (result: any) => {
    setShowResults(false);
    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const getDisplayName = (item: any) => {
    switch (searchType) {
      case 'dishes':
        return item.name;
      case 'users':
        return item.username || item.fullName;
      case 'reviews':
        return `Review by ${item.customerName}`;
      default:
        return item.name || item.title;
    }
  };

  const getDisplayInfo = (item: any) => {
    switch (searchType) {
      case 'dishes':
        return `${item.category} - ${item.price.toLocaleString()}₫`;
      case 'users':
        return `${item.email} - ${item.roleName}`;
      case 'reviews':
        return `Rating: ${item.rating}/5 - ${item.dishId ? `Dish ID: ${item.dishId}` : ''}`;
      default:
        return '';
    }
  };

  const renderAdvancedFilters = () => {
    if (!showAdvanced) return null;

    return (
      <div className="advanced-filters mt-3 p-3 bg-light rounded">
        <div className="row g-2">
          {searchType === 'dishes' && (
            <>
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Danh mục"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Giá từ"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Giá đến"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                />
              </div>
            </>
          )}
          {searchType === 'users' && (
            <>
              <div className="col-md-6">
                <select
                  className="form-select form-select-sm"
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="ADMIN">Admin</option>
                  <option value="USER">User</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              <div className="col-md-6">
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Không hoạt động</option>
                </select>
              </div>
            </>
          )}
          {searchType === 'reviews' && (
            <div className="col-md-6">
              <select
                className="form-select form-select-sm"
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
              >
                <option value="">Tất cả đánh giá</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`admin-search-component position-relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isSearching}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={isSearching || !keyword.trim()}
          >
            {isSearching ? (
              <span className="spinner-border spinner-border-sm me-1" />
            ) : (
              <i className="bi bi-search"></i>
            )}
            {isSearching ? 'Đang tìm...' : 'Tìm'}
          </button>
        </div>
      </form>

      {renderAdvancedFilters()}

      {/* Rest of the component remains the same... */}
    </div>
  );
};

export default AdminSearchComponent;