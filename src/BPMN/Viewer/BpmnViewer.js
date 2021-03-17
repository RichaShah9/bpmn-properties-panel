import React, { useEffect } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Service from "../../services/Service";
import Tooltip from "../../components/Tooltip";
import readOnlyModule from "./custom/readonly";
import { download, getBool } from "../../utils";
import { getInfo, getTranslations } from "../../services/api";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "../css/bpmn.css";

let bpmnViewer = null;

const updateTranslations = async (nodes) => {
  nodes &&
    Object.entries(nodes).forEach(async ([id, value]) => {
      let { element } = value;
      const bo = getBusinessObject(element);
      const key = bo.$attrs["camunda:key"];
      if (!key || !element) return;
      const isTranslation =
        (bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
      if (!getBool(isTranslation)) return;
      const translations = await getTranslations(key);
      if (translations && translations.length > 0) {
        const info = await getInfo();
        const language = info && info["user.lang"];
        if (!language) return;
        const selectedTranslation = translations.find(
          (t) => t.language === language
        );
        const value = selectedTranslation && selectedTranslation.message;
        const elementType = element && element.type;
        let modelProperty =
          elementType === "bpmn:TextAnnotation"
            ? "text"
            : elementType === "bpmn:Group"
            ? "categoryValue"
            : "name";
        const name = bo[modelProperty];
        const newKey = bo.$attrs["camunda:key"];
        const diagramValue = value || newKey || name;
        element.businessObject[modelProperty] = diagramValue;
        let elementRegistry = bpmnViewer.get("elementRegistry");
        let modeling = bpmnViewer.get("modeling");
        let shape = elementRegistry.get(element.id);
        modeling &&
          modeling.updateProperties(shape, {
            [modelProperty]: diagramValue,
          });
      }
    });
};

const fetchId = (isInstance) => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const regexBPMNTask = /[?&]taskIds=([^&#]*)/g; // ?id=1&taskIds=1,2
  const regexBPMNActivityCounts = /[?&]activityCount=([^&#]*)/g; // ?id=1&taskIds=1,2&activityCount=activiti1:1,activit2:1,activit3:2,activit4:1
  const regexBPMNInstanceId = /[?&]instanceId=([^&#]*)/g; // ?instanceId=1&taskIds=1,2&activityCount=activiti1:1,activit2:1,activit3:2,activit4:1

  const url = window.location.href;
  let matchBPMNId,
    matchBPMNTasksId,
    matchActivityCounts,
    activityCounts,
    matchInstanceId,
    id,
    taskIds;

  while ((matchBPMNTasksId = regexBPMNTask.exec(url))) {
    let ids = matchBPMNTasksId[1];
    taskIds = ids.split(",");
  }

  while ((matchActivityCounts = regexBPMNActivityCounts.exec(url))) {
    activityCounts = matchActivityCounts[1];
  }

  if (isInstance) {
    while ((matchInstanceId = regexBPMNInstanceId.exec(url))) {
      id = matchInstanceId[1];
      return { id, taskIds, activityCounts };
    }
  } else {
    while ((matchBPMNId = regexBPMN.exec(url))) {
      id = matchBPMNId[1];
      return { id, taskIds, activityCounts };
    }
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

const fetchInstanceDiagram = async (id, taskIds, activityCounts) => {
  if (id) {
    let actionRes = await Service.action({
      model: "com.axelor.apps.bpm.db.WkfModel",
      action: "action-wkf-instance-method-get-instance-xml",
      data: {
        context: {
          _model: "com.axelor.apps.bpm.db.WkfModel",
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

const openDiagramImage = (taskIds, diagramXml, activityCounts) => {
  if (!diagramXml) return;
  bpmnViewer.importXML(diagramXml, (err) => {
    if (err) {
      return console.error("could not import BPMN 2.0 diagram", err);
    }
    let canvas = bpmnViewer.get("canvas");
    canvas.zoom("fit-viewport");
    bpmnViewer.get("readOnly").readOnly(true);
    let elementRegistry = bpmnViewer.get("elementRegistry");
    let nodes = elementRegistry && elementRegistry._elements;
    if (!nodes) return;
    updateTranslations(nodes);
    let filteredElements = Object.keys(nodes).filter(
      (element) => taskIds && taskIds.includes(element)
    );
    filteredElements.forEach((element) => {
      let modeling = bpmnViewer.get("modeling");
      modeling.setColor(nodes[element].element, {
        stroke: "#006400",
      });
      // canvas.addMarker(element, "highlight");
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

function BpmnViewerComponent({ isInstance }) {
  const saveSVG = () => {
    bpmnViewer.saveSVG({ format: true }, async function (err, svg) {
      download(svg, "diagram.svg");
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
    bpmnViewer = new BpmnModeler({
      container: "#canvas-task",
      additionalModules: [readOnlyModule],
    });
    let { id, taskIds, activityCounts } = fetchId(isInstance) || {};
    if (isInstance) {
      fetchInstanceDiagram(id, taskIds, activityCounts);
    } else {
      fetchDiagram(id, taskIds, activityCounts);
    }
  }, [isInstance]);

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

export default BpmnViewerComponent;
