import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";

import { Shell } from "./components/layout/Shell";
import Brief from "./pages/Brief";
import Dashboard from "./pages/Dashboard";
import EntityDetail from "./pages/EntityDetail";
import IncidentDetail from "./pages/IncidentDetail";
import Incidents from "./pages/Incidents";
import Items from "./pages/Items";
import Regulations from "./pages/Regulations";
import SearchResults from "./pages/SearchResults";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Standards from "./pages/Standards";
import Watchlist from "./pages/Watchlist";
// TEMPORARY design playground (delete folder + these routes after direction chosen)
import DesignIndex from "./design-prototypes/DesignIndex";
import DirectionA from "./design-prototypes/DirectionA";
import DirectionB from "./design-prototypes/DirectionB";
import DirectionC from "./design-prototypes/DirectionC";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* TEMPORARY design playground — standalone, outside the production Shell */}
        <Route path="design" element={<DesignIndex />} />
        <Route path="design/a" element={<DirectionA />} />
        <Route path="design/b" element={<DirectionB />} />
        <Route path="design/c" element={<DirectionC />} />
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="brief" element={<Brief />} />
          <Route path="regulatory" element={<Regulations />} />
          <Route path="standards" element={<Standards />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="incidents/:id" element={<IncidentDetail />} />
          <Route path="items" element={<Items />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="entities/:slug" element={<EntityDetail />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}
