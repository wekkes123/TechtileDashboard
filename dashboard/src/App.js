import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from "./Dashboard";
import MqttListener from "./Components/mqttListener";

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
