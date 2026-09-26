import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

import BranchSelector from './components/BranchSelector';
import MenuPage from './components/MenuPage';
import AdminGate from './components/AdminGate';

function App() {
  const [branch, setBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [query, setQuery] = useState('');

  const [menuData, setMenuData] = useState({
    categories: [],
    products: [],
    offers: [],
  });

  const [loading, setLoading] = useState(true);

  const isAdmin =
    window.location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return undefined;

    let cancelled = false;

    async function loadMenu() {
      try {
        const response = await fetch(
          '/api/public/data',
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error(
            'MENU_LOAD_FAILED'
          );
        }

        const data =
          await response.json();

        if (!cancelled) {
          setBranches(
            Array.isArray(data.branches)
              ? data.branches
              : []
          );

          setMenuData({
            categories:
              Array.isArray(
                data.categories
              )
                ? data.categories
                : [],

            products:
              Array.isArray(
                data.products
              )
                ? data.products
                : [],

            offers:
              Array.isArray(
                data.offers
              )
                ? data.offers
                : [],
          });
        }
      } catch (error) {
        console.error(
          'Menu load error:',
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || !branch) return undefined;

    let cancelled = false;

    async function loadBranchMenu() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/public/data?branchId=${encodeURIComponent(branch.id)}`,
          { credentials: 'include', cache: 'no-store' }
        );

        if (!response.ok) throw new Error('MENU_LOAD_FAILED');

        const data = await response.json();

        if (!cancelled) {
          setBranches(Array.isArray(data.branches) ? data.branches : []);
          setMenuData({
            categories: Array.isArray(data.categories) ? data.categories : [],
            products: Array.isArray(data.products) ? data.products : [],
            offers: Array.isArray(data.offers) ? data.offers : [],
          });
          setQuery('');
          setSelectedProduct(null);
        }
      } catch (error) {
        console.error('Branch menu load error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBranchMenu();

    return () => {
      cancelled = true;
    };
  }, [branch, isAdmin]);

  const visibleProducts =
    useMemo(() => {
      const normalized =
        query
          .trim()
          .toLowerCase();

      return menuData.products.filter(
        (product) => {
          if (
            product.isAvailable ===
            false
          ) {
            return false;
          }

          if (!normalized) {
            return true;
          }

          const searchableText = `
            ${product.name || ''}
            ${product.nameAr || ''}
            ${product.description || ''}
          `.toLowerCase();

          return searchableText.includes(
            normalized
          );
        }
      );
    }, [
      menuData.products,
      query,
    ]);

  if (isAdmin) {
    return <AdminGate />;
  }

  if (loading) {
    return (
      <main className="menu-loading-screen">
        <div className="menu-loading-card">
          <strong>
            BITE HOUSE
          </strong>

          <span>
            جاري تحميل المنيو...
          </span>
        </div>
      </main>
    );
  }

  if (!branch) {
    return (
      <BranchSelector
        branches={branches}
        onSelectBranch={setBranch}
      />
    );
  }

  return (
    <MenuPage
      branch={branch}
      categories={menuData.categories}
      offers={menuData.offers}
      query={query}
      setQuery={setQuery}
      visibleProducts={
        visibleProducts
      }
      selectedProduct={
        selectedProduct
      }
      setSelectedProduct={
        setSelectedProduct
      }
      onChangeBranch={() => {
        setSelectedProduct(null);
        setBranch(null);
      }}
    />
  );
}

createRoot(
  document.getElementById('root')
).render(
  <App />
);