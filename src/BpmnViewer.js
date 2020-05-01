import React, { useEffect } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import xml2js, { parseString } from "xml2js";
import _ from "lodash";

import Service from "./services/Service";
import { ImageIcon } from "./assets";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "./App.css";

let bpmnViewer = null;

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

const fetchDiagram = async (id, taskIds) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    const { diagramXml } = wkf;
    openDiagramImage(taskIds, diagramXml);
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

function svgUrlToPng(svgUrl, callback) {
  const svgImage = document.createElement("img");
  document.body.appendChild(svgImage);
  svgImage.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = svgImage.clientWidth;
    canvas.height = svgImage.clientHeight;
    const canvasCtx = canvas.getContext("2d");
    canvasCtx.drawImage(svgImage, 0, 0);
    const imgData = canvas.toDataURL("image/png");
    callback(imgData);
  };
  svgImage.src = svgUrl;
  svgImage.style.visibility = "hidden"

}

function svgToPng(svg, callback) {
  const url = getSvgUrl(svg);
  svgUrlToPng(url, (imgData) => {
    callback(imgData);
    URL.revokeObjectURL(url);
  });
}

function getSvgUrl(svg) {
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}

const clearUrl = (url) => url.replace(/^data:image\/\w+;base64,/, "");

const downloadImage = (name, content, type) => {
  let link = document.createElement("a");
  link.style = "position: fixed; left -10000px;";
  link.href = `data:application/octet-stream;base64,${encodeURIComponent(
    content
  )}`;
  link.download = /\.\w+/.test(name) ? name : `${name}.${type}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const saveSVG = (taskIds) => {
  bpmnViewer.saveSVG({ format: true }, async function (err, svg) {
    parseString(svg, function (err, result) {
      let updatedSVG = updateSVGStroke(result, taskIds);
      let builder = new xml2js.Builder();
      let xml = builder.buildObject(updatedSVG);
      svgToPng(xml, (imgData) => {
        downloadImage("diagram", clearUrl(imgData), "png");
      });
    });
  });
};

const openDiagramImage = (taskIds, diagramXml) => {
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
    saveSVG(taskIds);
  });
};

function BpmnViewerComponent() {
  const [taskIds, setTaskIds] = React.useState(null);
  useEffect(() => {
    bpmnViewer = new BpmnViewer({
      container: "#canvas-task",
    });
    let { id, taskIds } = fetchId();
    setTaskIds(taskIds);
    fetchDiagram(id, taskIds);
  }, [setTaskIds]);

  return (
    <React.Fragment>
      <div className="tooltip" style={{ padding: 15 }}>
        <button
          onClick={() => saveSVG(taskIds)}
          className="property-button"
          style={{
            width: "fit-content",
          }}
        >
          <span className="tooltiptext">Download Png</span>
          <img
            src={ImageIcon}
            alt={"diagram"}
            style={{
              height: 20,
              width: 20,
            }}
          />
        </button>
      </div>
      <div id="canvas-task"></div>
    </React.Fragment>
  );
}

export default BpmnViewerComponent;
