import { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import ThemeToggle from './ThemeToggle';

const EMPTY_DATA = {
  branches: [],
  categories: [],
  products: [],
  offers: [],
  currentAdminEmail: '',
  adminEmails: [],
};

async function requestJson(
  url,
  options = {}
) {
  const response =
    await fetch(
      url,
      {
        credentials: 'include',
        cache: 'no-store',
        ...options,

        headers: {
          'Content-Type':
            'application/json',

          ...(options.headers ||
            {}),
        },
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    const error =
      new Error(
        data.message ||
          'حدث خطأ غير متوقع.'
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}

export default function AdminGate() {
  const [
    authenticated,
    setAuthenticated,
  ] = useState(false);

  const [
    checking,
    setChecking,
  ] = useState(true);

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    data,
    setData,
  ] = useState(EMPTY_DATA);

  const [
    dataLoading,
    setDataLoading,
  ] = useState(false);

  async function loadData() {
    setDataLoading(true);

    try {
      const result =
        await requestJson(
          '/api/admin/data'
        );

      setData({
        branches:
          Array.isArray(result.branches)
            ? result.branches
            : [],

        categories:
          Array.isArray(
            result.categories
          )
            ? result.categories
            : [],

        products:
          Array.isArray(
            result.products
          )
            ? result.products
            : [],

        offers:
          Array.isArray(
            result.offers
          )
            ? result.offers
            : [],

        currentAdminEmail:
          result.currentAdminEmail ||
          '',

        adminEmails:
          Array.isArray(
            result.adminEmails
          )
            ? result.adminEmails
            : [],
      });

      return result;
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const result =
          await requestJson(
            '/api/admin/me'
          );

        if (cancelled) {
          return;
        }

        if (
          result.authenticated
        ) {
          setAuthenticated(true);

          try {
            await loadData();
          } catch (loadError) {
            if (!cancelled) {
              setError(
                loadError.message
              );
            }
          }
        }
      } catch {
        // المستخدم غير مسجل دخول
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(event) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      await requestJson(
        '/api/admin/login',
        {
          method: 'POST',

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      setAuthenticated(true);
      setPassword('');

      await loadData();
    } catch (loginError) {
      setAuthenticated(false);

      setError(
        loginError.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch(
        '/api/admin/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      );
    } finally {
      setAuthenticated(false);

      setData(
        EMPTY_DATA
      );

      window.location.href =
        '/';
    }
  }

  async function refreshData() {
    try {
      await loadData();
    } catch (refreshError) {
      if (
        refreshError.status ===
        401
      ) {
        await logout();
        return;
      }

      throw refreshError;
    }
  }

  if (checking) {
    return (
      <main className="admin-login-page">
        <div className="admin-theme-toggle"><ThemeToggle /></div>
        <div className="admin-login-card card shadow-sm">
          <p className="eyebrow">
            PRIVATE AREA
          </p>

          <h1>
            إدارة المنيو
          </h1>

          <p className="muted">
            جاري التحقق من جلسة الدخول...
          </p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-login-page">
        <div className="admin-theme-toggle"><ThemeToggle /></div>
        <form
          className="admin-login-card card shadow-sm"
          onSubmit={login}
        >
          <p className="eyebrow">
            PRIVATE AREA
          </p>

          <h1>
            إدارة المنيو
          </h1>

          <p className="muted">
            اكتبي بيانات الدخول الخاصة بلوحة التحكم.
          </p>

          <input
            className="form-control"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="الإيميل"
            autoComplete="username"
            autoFocus
            required
          />

          <input
            className="form-control"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="كلمة المرور"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            className="primary-button full"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'جاري الدخول...'
              : 'دخول'}
          </button>

          <a
            className="back-link"
            href="/"
          >
            العودة للموقع
          </a>
        </form>
      </main>
    );
  }

  return (
    <Dashboard
      data={data}
      onDataChange={
        refreshData
      }
      onLogout={logout}
      dataLoading={
        dataLoading
      }
    />
  );
}