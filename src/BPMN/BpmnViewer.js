import React, { useEffect } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import xml2js, { parseString } from "xml2js";
import _ from "lodash";

import Service from "../services/Service";
import { download } from "../utils";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "./bpmn.css";

let bpmnViewer = null;

const fetchId = () => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const regexBPMNTask = /[?&]taskIds=([^&#]*)/g; // ?id=1&taskIds=1,2
  const regexBPMNActivityCounts = /[?&]activityCount=([^&#]*)/g; // ?id=1&taskIds=1,2&activityCount=activiti1:1,activit2:1,activit3:2,activit4:1

  const url = window.location.href;
  let matchBPMNId,
    matchBPMNTasksId,
    matchActivityCounts,
    activityCounts,
    id,
    taskIds;

  while ((matchBPMNTasksId = regexBPMNTask.exec(url))) {
    let ids = matchBPMNTasksId[1];
    taskIds = ids.split(",");
  }

  while ((matchActivityCounts = regexBPMNActivityCounts.exec(url))) {
    activityCounts = matchActivityCounts[1];
  }

  while ((matchBPMNId = regexBPMN.exec(url))) {
    id = matchBPMNId[1];
    return { id, taskIds, activityCounts };
  }
};

const fetchDiagram = async (id, taskIds, activityCounts) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    const { diagramXml } = wkf;
    openDiagramImage(taskIds, diagramXml, activityCounts);
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
  bpmnViewer.importXML(diagramXml, (err) => {
    if (err) {
      return console.error("could not import BPMN 2.0 diagram", err);
    }
    let canvas = bpmnViewer.get("canvas");
    canvas.zoom("fit-viewport");
    let elementRegistry = bpmnViewer.get("elementRegistry");
    let nodes = elementRegistry && elementRegistry._elements;
    if (!nodes) return;
    let filteredElements = Object.keys(nodes).filter((element) =>
      taskIds.includes(element)
    );
    filteredElements.forEach((element) => {
      canvas.addMarker(element, "highlight");
    });

    if (!activityCounts) return;
    const activities = activityCounts.split(",") || [];
    const overlayActivies = [];

    if (activities.length <= 0) return;
    activities.forEach((activity) => {
      let taskActivity = activity.split(":");
      overlayActivies.push({
        id: taskActivity[0],
        count: taskActivity[1],
      });
    });

    let overlays = bpmnViewer.get("overlays");
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
  bpmnViewer.get("zoomScroll").stepZoom(1);
};

const zoomOut = () => {
  bpmnViewer.get("zoomScroll").stepZoom(-1);
};

const resetZoom = () => {
  bpmnViewer.get("canvas").zoom("fit-viewport");
};

function BpmnViewerComponent() {
  const [taskIds, setTaskIds] = React.useState(null);

  const saveSVG = () => {
    bpmnViewer.saveSVG({ format: true }, async function (err, svg) {
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
    bpmnViewer = new BpmnViewer({
      container: "#canvas-task",
    });
    let { id, taskIds, activityCounts } = fetchId() || {};
    setTaskIds(taskIds);
    fetchDiagram(id, taskIds, activityCounts);
  }, [setTaskIds]);

  return (
    <React.Fragment>
      <div style={{ display: "flex", padding: 10 }}>
        {toolBarButtons.map((btn) => (
          <div className="tooltip" key={btn.name} style={{ display: "flex" }}>
            <button onClick={btn.onClick} className={btn.classname}>
              <span className="tooltiptext">{btn.tooltipText}</span>
              {btn.icon}
            </button>
          </div>
        ))}
      </div>
      <div id="canvas-task"></div>
    </React.Fragment>
  );
}

export default BpmnViewerComponent;
