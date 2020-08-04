import React, { useEffect } from "react";
import CmmnViewer from "cmmn-js/lib/NavigatedViewer";
import xml2js, { parseString } from "xml2js";
import _ from "lodash";

import Service from "../services/Service";
import Tooltip from "../BPMN/components/Tooltip";
import { download } from "../utils";

import "cmmn-js/dist/assets/diagram-js.css";
import "cmmn-font/dist/css/cmmn-embedded.css";

let cmmnViewer = null;

const fetchId = (isInstance) => {
  const regexCMMN = /[?&]id=([^&#]*)/g; // ?id=1
  const regexCMMNTask = /[?&]taskIds=([^&#]*)/g; // ?id=1&taskIds=1,2
  const regexCMMNActivityCounts = /[?&]activityCount=([^&#]*)/g; // ?id=1&taskIds=1,2&activityCount=activiti1:1,activit2:1,activit3:2,activit4:1
  const regexCMMNInstanceId = /[?&]instanceId=([^&#]*)/g; // ?instanceId=1&taskIds=1,2&activityCount=activiti1:1,activit2:1,activit3:2,activit4:1

  const url = window.location.href;
  let matchCMMNId,
    matchCMMNTasksId,
    matchActivityCounts,
    activityCounts,
    matchInstanceId,
    id,
    taskIds;

  while ((matchCMMNTasksId = regexCMMNTask.exec(url))) {
    let ids = matchCMMNTasksId[1];
    taskIds = ids.split(",");
  }

  while ((matchActivityCounts = regexCMMNActivityCounts.exec(url))) {
    activityCounts = matchActivityCounts[1];
  }

  if (isInstance) {
    while ((matchInstanceId = regexCMMNInstanceId.exec(url))) {
      id = matchInstanceId[1];
      return { id, taskIds, activityCounts };
    }
  } else {
    while ((matchCMMNId = regexCMMN.exec(url))) {
      id = matchCMMNId[1];
      return { id, taskIds, activityCounts };
    }
  }
};

const fetchDiagram = async (id, taskIds, activityCounts) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfCmmnModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    const { diagramXml } = wkf;
    openDiagramImage(taskIds, diagramXml, activityCounts);
  }
};

const fetchInstanceDiagram = async (id, taskIds, activityCounts) => {
  if (id) {
    let actionRes = await Service.action({
      model: "com.axelor.apps.bpm.db.WkfCmmnModel",
      action: "action-wkf-case-instance-method-get-instance-xml",
      data: {
        context: {
          _model: "com.axelor.apps.bpm.db.WkfCmmnModel",
          instanceId: id,
        },
      },
    });
    if (
      actionRes &&
      actionRes.data &&
      actionRes.data[0] &&
      actionRes.data[0].values
    ) {
      const { xml } = actionRes.data[0].values;
      openDiagramImage(taskIds, xml, activityCounts);
    }
  }
};

function updateSVGStroke(obj, taskIds = []) {
  return _.forEach(obj, (value, key) => {
    if (obj[key]["g"]) {
      if (taskIds.includes(obj[key]["g"][0]["$"]["data-element-id"])) {
        let reactangle = obj[key]["g"][0]["g"][0].rect[0];
        let newStyle = reactangle["$"].style.replace(
          "stroke: black",
          "stroke: #1e88e5"
        );
        reactangle["$"].style = newStyle;
      }
      updateSVGStroke(obj[key]["g"], taskIds);
    } else {
      return;
    }
  });
}

const openDiagramImage = (taskIds, diagramXml, activityCounts) => {
  if (!diagramXml) return;
  cmmnViewer.importXML(diagramXml, (err) => {
    if (err) {
      return console.error("could not import CMMN diagram", err);
    }
    let canvas = cmmnViewer.get("canvas");
    canvas.zoom("fit-viewport");
    let elementRegistry = cmmnViewer.get("elementRegistry");
    let nodes = elementRegistry && elementRegistry._elements;
    if (!nodes) return;
    let filteredElements = Object.keys(nodes).filter(
      (element) => taskIds && taskIds.includes(element)
    );
    filteredElements.forEach((element) => {
      canvas.addMarker(element, "highlight");
    });

    const activities = (activityCounts && activityCounts.split(",")) || [];
    const overlayActivies = [];
    const nodeKeys = Object.keys(nodes) || [];
    if (nodeKeys.length < 1) return;
    if (activities.length <= 0) return;
    activities.forEach((activity) => {
      let taskActivity = activity.split(":");
      if (nodeKeys.includes(taskActivity[0])) {
        overlayActivies.push({
          id: taskActivity[0],
          count: taskActivity[1],
        });
      }
    });

    let overlays = cmmnViewer.get("overlays");
    if (overlayActivies.length <= 0) return;
    overlayActivies.forEach((overlayActivity) => {
      overlays.add(overlayActivity.id, "note", {
        position: {
          bottom: 18,
          right: 18,
        },
        html: `<div class="diagram-note">${overlayActivity.count}</div>`,
      });
    });
  });
};

const zoomIn = () => {
  cmmnViewer.get("zoomScroll").stepZoom(1);
};

const zoomOut = () => {
  cmmnViewer.get("zoomScroll").stepZoom(-1);
};

const resetZoom = () => {
  cmmnViewer.get("canvas").zoom("fit-viewport");
};

function CmmnViewerComponent({ isInstance }) {
  const [taskIds, setTaskIds] = React.useState(null);

  const saveSVG = () => {
    cmmnViewer.saveSVG({ format: true }, async function (err, svg) {
      parseString(svg, function (err, result) {
        let updatedSVG = updateSVGStroke(result, taskIds);
        let builder = new xml2js.Builder();
        let xml = builder.buildObject(updatedSVG);
        download(xml, "diagram.svg");
      });
    });
  };

  const toolBarButtons = [
    {
      name: "DownloadSVG",
      icon: <i className="fa fa-picture-o" style={{ fontSize: 18 }}></i>,
      tooltipText: "Download SVG",
      onClick: saveSVG,
      classname: "property-button",
    },
    {
      name: "ZoomInIcon",
      icon: <i className="fa fa-plus" aria-hidden="true"></i>,
      tooltipText: "Zoom In",
      onClick: zoomIn,
      classname: "zoom-buttons",
    },
    {
      name: "zoomOut",
      icon: <i className="fa fa-minus" aria-hidden="true"></i>,
      tooltipText: "Zoom Out",
      onClick: zoomOut,
      classname: "zoom-buttons",
    },
    {
      name: "resetZoom",
      icon: <i className="fa fa-refresh" aria-hidden="true"></i>,
      tooltipText: "Reset Zoom",
      onClick: resetZoom,
      classname: "zoom-buttons",
    },
  ];

  useEffect(() => {
    cmmnViewer = new CmmnViewer({
      container: "#canvas-task",
    });
    let { id, taskIds, activityCounts } = fetchId(isInstance) || {};
    setTaskIds(taskIds);
    if (isInstance) {
      fetchInstanceDiagram(id, taskIds, activityCounts);
    } else {
      fetchDiagram(id, taskIds, activityCounts);
    }
  }, [isInstance, setTaskIds]);

  return (
    <React.Fragment>
      <div style={{ display: "flex", padding: 10 }}>
        {toolBarButtons.map((btn) => (
          <div key={btn.name} style={{ display: "flex" }}>
            <Tooltip
              title={btn.tooltipText}
              children={
                <button onClick={btn.onClick} className={btn.classname}>
                  {btn.icon}
                </button>
              }
            />
          </div>
        ))}
      </div>
      <div id="canvas-task"></div>
    </React.Fragment>
  );
}

export default CmmnViewerComponent;
