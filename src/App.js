import React, { useEffect, useState } from "react";
import Service from "./services/Service";
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

const fetchDiagram = async (id, setWkf) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    setWkf(wkf);
  }
};

function App() {
  const [taskIds, setTaskIds] = useState(null);
  const [wkf, setWkf] = useState(null);

  useEffect(() => {
    let { id, taskIds } = fetchId() || {};
    setTaskIds(taskIds);
    if(taskIds && taskIds.length > 0 ){
      fetchDiagram(id, setWkf);
    }
  }, [setTaskIds]);

  return (
    <React.Fragment>
      {taskIds && taskIds.length > 0 ? (
        <BpmnViewerComponent taskIds={taskIds} wkf={wkf} />
      ) : (
        <BpmnModelerComponent />
      )}
    </React.Fragment>
  );
}

export default App;
