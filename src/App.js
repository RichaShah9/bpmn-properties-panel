import React, { useEffect, useState } from "react";
import BpmnModelerComponent from "./BPMN/BpmnModeler";
import BpmnViewerComponent from "./BPMN/BpmnViewer";
import DMNModeler from "./DMN/DMNModeler";
import CMMNModeler from "./CMMN/CMMNModeler";

let isInstance = false;

const fetchId = () => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const regexBPMNTask = /[?&]taskIds=([^&#]*)/g; // ?id=1&taskIds=1,2
  const regexBPMNInstance = /[?&]instanceId=([^&#]*)/g; // ?instanceId=1
  const regexDMN = /[?&]type=dmn([^&#]*)/g; // ?type=dmn?id=1
  const regexCMMN = /[?&]type=cmmn([^&#]*)/g; // ?type=cmmn?id=1

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

  while (regexCMMN.exec(url)) {
    type = "cmmnModeler";
  }

  while (regexBPMNInstance.exec(url)) {
    type = "bpmnViewer";
    isInstance = true;
  }

  return type;
};

function App() {
  const [type, setType] = useState(null);

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
      ) : type === "bpmnViewer" ? (
        <BpmnViewerComponent isInstance={isInstance} />
      ) : type === "cmmnModeler" ? (
        <CMMNModeler />
      ) : (
        <React.Fragment></React.Fragment>
      )}
    </React.Fragment>
  );
}

export default App;
