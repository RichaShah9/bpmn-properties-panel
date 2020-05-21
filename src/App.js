import React, { useEffect, useState } from "react";
import BpmnModelerComponent from "./BpmnModeler";
import BpmnViewerComponent from "./BpmnViewer";
import DMNModeler from "./DMNModeler";

import "./App.css";

const fetchId = () => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const regexBPMNTask = /[?&]taskIds=([^&#]*)/g; // ?id=1&taskIds=1,2
  const regexDMN = /[?&]type=dmn([^&#]*)/g; // ?type=dmn?id=1

  const url = window.location.href;
  let type = "bpmnModeler";

  while (regexBPMN.exec(url)) {
    type = "bpmnModeler";
  }

  while (regexBPMNTask.exec(url)) {
    type = "bpmnViewer";
  }

  while (regexDMN.exec(url)) {
    type = "dmnModeler";
  }

  return type;
};

function App() {
  const [type, setType] = useState("bpmnModeler");

  useEffect(() => {
    let type = fetchId() || {};
    setType(type);
  }, [setType]);

  return (
    <React.Fragment>
      {type === "dmnModeler" ? (
        <DMNModeler />
      ) : type === "bpmnModeler" ? (
        <BpmnModelerComponent />
      ) : (
        <BpmnViewerComponent />
      )}
    </React.Fragment>
  );
}

export default App;
