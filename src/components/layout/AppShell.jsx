import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "../home/Home";
import RamadanCalendar from "../calendar/RamadanCalendar";
import AppBackground from "./AppBackground";
import ErrorBanner from "./ErrorBanner";

function AppShell({ data, loading, error }) {
  const location = useLocation();

  return (
    <main className="relative h-screen w-screen overflow-hidden text-white bg-black flex flex-col items-center font-sans">
      <AppBackground />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home data={data} loading={loading} />} />
          <Route path="/ramadan" element={<RamadanCalendar data={data} loading={loading} />} />
        </Routes>
      </AnimatePresence>
      {error && !data ? <ErrorBanner message={error} /> : null}
    </main>
  );
}

export default AppShell;
