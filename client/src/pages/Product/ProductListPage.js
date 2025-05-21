// File: client/src/pages/Product/ProductListPage.js (Final Example)
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductList from '../../components/Product/ProductList';
import ProductFilter from '../../components/Product/ProductFilter'; // Assuming this component exists
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Pagination from '../../components/Common/Pagination'; // Assuming this component exists
import api from '../../services/api';
import styles from './ProductListPage.module.css'; // Example CSS module

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]); // For filter options
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
    });
    const [searchParams, setSearchParams] = useSearchParams();

    // Function to fetch products based on current search params
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
             // Construct query params from URL search params
             const params = Object.fromEntries(searchParams.entries());
            const response = await api.getProducts(params);
            setProducts(response.data.data.products);
            setPagination({
                currentPage: response.data.currentPage,
                totalPages: response.data.totalPages,
                totalProducts: response.data.totalProducts,
            });
        } catch (err) {
            console.error("Failed to fetch products:", err);
            setError(err.response?.data?.message || 'Could not load products. Please try again.');
            setProducts([]); // Clear products on error
             setPagination({ currentPage: 1, totalPages: 1, totalProducts: 0 }); // Reset pagination
        } finally {
            setLoading(false);
        }
    }, [searchParams]); // Re-run fetchProducts when searchParams change

     // Fetch categories for the filter component
     const fetchCategories = useCallback(async () => {
        try {
            const response = await api.getCategories(); // Assuming an API endpoint exists
            setCategories(response.data.data.categories || []);
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            // Handle category fetch error silently or show a message
        }
    }, []);


    // Effect to fetch data when the component mounts or search params change
    useEffect(() => {
        fetchProducts();
        fetchCategories(); // Fetch categories once on mount
    }, [fetchProducts, fetchCategories]); // Dependencies include the memoized fetch functions


    // Handler for filter changes (updates URL search params)
    const handleFilterChange = (newFilters) => {
        const currentParams = Object.fromEntries(searchParams.entries());
        // Merge new filters, remove empty ones, reset page to 1
        const updatedParams = { ...currentParams, ...newFilters, page: '1' };

         // Remove keys with empty values to keep URL clean
         Object.keys(updatedParams).forEach(key => {
            if (!updatedParams[key] || updatedParams[key] === '') {
                delete updatedParams[key];
            }
         });

        setSearchParams(updatedParams);
    };

    // Handler for pagination changes
    const handlePageChange = (newPage) => {
        // Update the 'page' search param
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            params.set('page', newPage.toString());
            return params;
        });
    };

    // Handler for sort changes
     const handleSortChange = (sortValue) => {
         setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (sortValue) {
                params.set('sort', sortValue);
            } else {
                params.delete('sort'); // Remove sort if default is selected
            }
            params.set('page', '1'); // Reset to page 1 on sort change
            return params;
        });
     };


    return (
        <div className={styles.pageContainer}>
            <h1>Products</h1>
            <div className={styles.contentWrapper}>
                <aside className={styles.filterSidebar}>
                    {/* Pass current filters derived from searchParams */}
                    <ProductFilter
                        categories={categories}
                        currentFilters={Object.fromEntries(searchParams.entries())}
                        onFilterChange={handleFilterChange}
                        onSortChange={handleSortChange} // Add sort handler
                    />
                </aside>
                <main className={styles.productListArea}>
                    {loading && <div className={styles.centered}><LoadingSpinner /></div>}
                    {error && <p className={styles.error}>{error}</p>}
                    {!loading && !error && (
                        <>
                            {products.length > 0 ? (
                                <ProductList products={products} />
                            ) : (
                                <p>No products found matching your criteria.</p>
                            )}
                            {pagination.totalPages > 1 && (
                                <Pagination
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.totalPages}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProductListPage;