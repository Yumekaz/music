import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./app/providers.jsx";
import { router } from "./app/router.jsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
