import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { TodayPage } from "./pages/TodayPage";
import { MealsPage } from "./pages/MealsPage";
import { TrainPage } from "./pages/TrainPage";
import { ProgressPage } from "./pages/ProgressPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/meals" element={<MealsPage />} />
        <Route path="/train" element={<TrainPage />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Routes>
    </AppShell>
  );
}
