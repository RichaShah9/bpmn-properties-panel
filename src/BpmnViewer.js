import React, { useEffect } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "./App.css";

let bpmnViewer = null;

const saveSVG = () => {
  bpmnViewer.saveSVG({ format: true }, async function (err, svg) {
    let encodedData = encodeURIComponent(svg);
    let dl = document.createElement("a");
    document.body.appendChild(dl);
    dl.setAttribute(
      "href",
      "data:application/bpmn20-xml;charset=UTF-8," + encodedData
    );
    dl.setAttribute("download", "diagram.svg");
    dl.click();
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
    saveSVG();
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
