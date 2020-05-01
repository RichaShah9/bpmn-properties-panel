import React, { useEffect, useState } from "react";
import BpmnModelerComponent from "./BpmnModeler";
import BpmnViewerComponent from "./BpmnViewer";

import "./App.css";

const fetchId = () => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const regexBPMNTask = /[?&]taskIds=([^&#]*)/g; // ?id=1&taskIds=1,2
  const url = window.location.href;
  let matchBPMNId, matchBPMNTasksId, id, taskIds;

  while ((matchBPMNTasksId = regexBPMNTask.exec(url))) {
    let ids = matchBPMNTasksId[1];
    taskIds = ids.split(",");
  }

  while ((matchBPMNId = regexBPMN.exec(url))) {
    id = matchBPMNId[1];
    return { id, taskIds };
  }
};

function App() {
  const [taskIds, setTaskIds] = useState(null);

  useEffect(() => {
    let { taskIds } = fetchId() || {};
    setTaskIds(taskIds);
  }, [setTaskIds]);

  return (
    <React.Fragment>
      {taskIds && taskIds.length > 0 ? (
        <BpmnViewerComponent />
      ) : (
        <BpmnModelerComponent />
      )}
    </React.Fragment>
  );
}

export default App;
