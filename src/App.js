import React, { useEffect, useState } from "react";
import BpmnModelerComponent from "./BpmnModeler";
import BpmnViewerComponent from "./BpmnViewer";
import DMNModeler from "./DMNModeler";

import "./App.css";

const fetchId = () => {
  const regexBPMN = /[?&]type=bpmn([^&#]*)/g; // ?type=bpmn?id=1
  const regexBPMNTask = /[?&]taskIds=([^&#]*)/g; // ?type=bpmn?id=1&taskIds=1,2
  const regexDMN = /[?&]type=dmn([^&#]*)/g; // ?type=dmn?id=1

  const url = window.location.href;
  let type = "dmnModeler";

  while (regexDMN.exec(url)) {
    type = "dmnModeler";
  }

  while (regexBPMN.exec(url)) {
    type = "bpmnModeler";
  }

  while (regexBPMNTask.exec(url)) {
    type = "bpmnViewer";
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
