import React, { useEffect } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";
import camundaModdleDescriptor from "camunda-bpmn-moddle/resources/camunda.json";
import Service from "./services/Service";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "./App.css";

let bpmnModeler = null;

const fetchId = () => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const url = window.location.href;
  let matchBPMNId, id;
  while ((matchBPMNId = regexBPMN.exec(url))) {
    id = matchBPMNId[1];
    return id;
  }
};

const fetchDiagram = async (id) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.workflow.db.Wkf", id);
    let { bpmnXml } = (res && res.data && res.data[0]) || {};
    newBpmnDiagram(bpmnXml);
  } else {
    newBpmnDiagram();
  }
};

const newBpmnDiagram = (rec) => {
  const diagram =
    rec ||
    `<?xml version="1.0" encoding="UTF-8" ?>
    <bpmn2:definitions 
      xmlns:xs="http://www.w3.org/2001/XMLSchema-instance" 
      xs:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" 
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
      xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
      xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
      xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
      xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
      id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
      <bpmn2:process id="Process_1" isExecutable="false">
        <bpmn2:startEvent id="StartEvent_1" />
      </bpmn2:process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
          <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
            <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0" />
          </bpmndi:BPMNShape>
        </bpmndi:BPMNPlane>
      </bpmndi:BPMNDiagram>
    </bpmn2:definitions>`;
  openBpmnDiagram(diagram);
};

const openBpmnDiagram = (xml) => {
  bpmnModeler.importXML(xml, (error) => {
    if (error) {
      return console.log("Error! Can't import XML");
    }
    let canvas = bpmnModeler.get("canvas");
    canvas.zoom("fit-viewport");
  });
};

function App() {
  const onSave = () => {
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      console.log(xml);
      let element = window.top.document.getElementsByName("bpmnXml");
      let childElements = element && element.length > 0 && element[0].children;
      console.log("element", element, childElements);
      if (childElements && childElements.length > 0) {
        childElements[0].innerText = xml;
        console.log("element", childElements[0].innerText);
      }
    });
  };

  useEffect(() => {
    bpmnModeler = new BpmnModeler({
      container: "#bpmnview",
      propertiesPanel: {
        parent: "#js-properties-panel",
      },
      additionalModules: [propertiesPanelModule, propertiesProviderModule],
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    });
    let id = fetchId();
    fetchDiagram(id);

    bpmnModeler.on(
      [
        "shape.added",
        "connection.added",
        "shape.removed",
        "connection.removed",
        "shape.changed",
        "connection.changed",
      ],
      function () {
        onSave();
      }
    );
  });

  return (
    <div id="container">
      <div id="bpmncontainer">
        <div id="propview"></div>
        <div id="bpmnview"></div>
        <div className="properties-panel-parent" id="js-properties-panel"></div>
      </div>
    </div>
  );
}

export default App;
