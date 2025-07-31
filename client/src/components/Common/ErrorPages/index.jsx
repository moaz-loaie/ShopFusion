import React from 'react';
import ErrorPage from './ErrorPage';

export const NotFoundPage = () => (
  <ErrorPage
    code="404"
    title="Page Not Found"
    message="The page you are looking for doesn't exist or has been moved."
  />
);

export const ServerErrorPage = () => (
  <ErrorPage
    code="500"
    title="Server Error"
    message="We're experiencing some technical difficulties. Please try again later."
  />
);

export const ForbiddenPage = () => (
  <ErrorPage
    code="403"
    title="Access Denied"
    message="You don't have permission to access this page."
  />
);

export const MaintenancePage = () => (
  <ErrorPage
    code="503"
    title="Under Maintenance"
    message="We're performing scheduled maintenance. Please check back soon."
    showBack={false}
  />
);

export const UnauthorizedPage = () => (
  <ErrorPage
    code="401"
    title="Unauthorized"
    message="Please log in to access this page."
    customAction={{
      label: 'Log In',
      onClick: () => window.location.href = '/login'
    }}
  />
);

export const NetworkErrorPage = () => (
  <ErrorPage
    code="ERR"
    title="Network Error"
    message="Unable to connect to the server. Please check your internet connection."
    customAction={{
      label: 'Retry Connection',
      onClick: () => window.location.reload()
    }}
  />
);
