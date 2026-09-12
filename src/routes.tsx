import { RouteObject } from 'react-router';
import HomePage from './pages/index';
import TradeServicesPage from './pages/trade-services';
import CategoriesPage from './pages/categories';
import CompanyPage from './pages/company';
import ContactPage from './pages/contact';
// Eager import so renderToString doesn't hit a Suspense boundary on 404 routes
// and abort to client rendering. The prod 404 page is tiny; the dev-tools
// variant stays lazy because it pulls in dev-only code we don't want in
// production bundles.
import ProdNotFoundPage from './pages/_404';

const NotFoundPage = ProdNotFoundPage;

/**
 * Route id for the catch-all. The SSR entry looks for this in the matched
 * route chain so an unknown URL answers with a real 404 status instead of
 * rendering the 404 page under HTTP 200 (a soft 404, which search engines
 * index as a normal page).
 */
export const NOT_FOUND_ROUTE_ID = 'not-found';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/trade-services',
    element: <TradeServicesPage />,
  },
  {
    path: '/categories',
    element: <CategoriesPage />,
  },
  {
    path: '/company',
    element: <CompanyPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    id: NOT_FOUND_ROUTE_ID,
    path: '*',
    element: <NotFoundPage />,
  },
];

// Types for type-safe navigation
export type Path = '/' | '/trade-services' | '/categories' | '/company' | '/contact';

export type Params = Record<string, string | undefined>;
