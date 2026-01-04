import React from "react";
import { Route, Routes } from "react-router";
import { Lottery } from "./pages/Lottery";
import { Home } from "./pages/Home";
import { Bonus } from "./pages/Bonus";
import { DrawStage } from "./pages/DrawStage";
import { BonusReady } from "./pages/BonusReady";
import { DrawResults } from "./pages/DrawResults";
import { RaffleProvider } from "./contexts/RaffleContext";

const App = () => {
  return (
    <RaffleProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lottery" element={<Lottery />} />
        <Route path="/bonus" element={<Bonus />} />
        <Route path="/bonus-ready" element={<BonusReady />} />
        {/* <Route path="*" element={<ErrorRecovery />} /> */}
        <Route path="/draw-stage" element={<DrawStage />} />
        <Route path="/draw-results" element={<DrawResults />} />
      </Routes>
    </RaffleProvider>
  );
}

export default App;
