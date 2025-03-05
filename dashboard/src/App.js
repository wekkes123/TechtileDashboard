import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from "./Pages/Dashboard";
import MqttListener from "./Pages/mqttListener";

const App = () => {
  return (
      <Router>
        <Routes>
            <Route path="/test" element={<MqttListener />} />
            <Route path="*" element={<Dashboard/>} />
        </Routes>
      </Router>
  );
};

export default App;
