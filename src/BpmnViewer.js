import React, { useEffect } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import xml2js, { parseString } from "xml2js";
import _ from "lodash";

import { download } from "./utils";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "./App.css";

let bpmnViewer = null;

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

const saveSVG = (taskIds) => {
  bpmnViewer.saveSVG({ format: true }, async function (err, svg) {
    parseString(svg, function (err, result) {
      let updatedSVG = updateSVGStroke(result, taskIds);
      var builder = new xml2js.Builder();
      var xml = builder.buildObject(updatedSVG);
      download(xml, "diagram.svg");
    });
  });
};

const openDiagramImage = (taskIds, diagramXml) => {
  if (!diagramXml) return;
  bpmnViewer.importXML(diagramXml, (err) => {
    if (err) {
      return console.error("could not import BPMN 2.0 diagram", err);
    }
    var canvas = bpmnViewer.get("canvas");
    canvas.zoom("fit-viewport");
    var elementRegistry = bpmnViewer.get("elementRegistry");
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

function BpmnViewerComponent(props) {
  const { wkf, taskIds } = props;
  const { diagramXml } = wkf || {};

  useEffect(() => {
    bpmnViewer = new BpmnViewer({
      container: "#canvas-task",
    });
    openDiagramImage(taskIds, diagramXml);
  }, [diagramXml, taskIds]);

  return <div id="canvas-task"></div>;
}

export default BpmnViewerComponent;
