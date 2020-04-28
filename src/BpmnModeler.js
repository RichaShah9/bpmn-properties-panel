import React, { useEffect, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";
import camundaModdleDescriptor from "camunda-bpmn-moddle/resources/camunda.json";
import Service from "./services/Service";
import SaveIcon from "./assets/save.png";
import ImageIcon from "./assets/image.png";

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

const fetchDiagram = async (id, setWkf) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    let { diagramXml } = wkf;
    setWkf(wkf);
    newBpmnDiagram(diagramXml);
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

const saveSVG = () => {
  bpmnModeler.saveSVG({ format: true }, async function (err, svg) {
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

function BpmnModelerComponent() {
  const [wkf, setWkf] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [isPropertyPanel, setPropertyPanel] = useState(true);
  
  const showAlert = (id, message) => {
    setMessage(message);
    let x = document.getElementById(id);
    x.className = "show";
    setTimeout(function () {
      x.className = x.className.replace("show", "");
    }, 3000);
  };

  const onSave = () => {
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      console.log("xml",xml)
      Service.add("com.axelor.apps.bpm.db.WkfModel", {
        ...wkf,
        diagramXml: xml,
      }).then((res) => {
        if (res && res.data && res.data[0]) {
          setWkf(res.data[0])
          setMessageType("success");
          showAlert("snackbar", "Saved Successfully");
        } else {
          setMessageType("error");
          showAlert(
            "snackbar",
            (res && res.data && (res.data.message || res.data.title)) ||
              "Error!"
          );
        }
      });
    });
  };

  useEffect(() => {
    let modeler = {
      container: "#bpmnview",
      keyboard: { bindTo: document },
    };
    if (isPropertyPanel) {
      modeler.propertiesPanel = {
        parent: "#js-properties-panel",
      };
      modeler.additionalModules = [
        propertiesPanelModule,
        propertiesProviderModule,
      ];
      modeler.moddleExtensions = {
        camunda: camundaModdleDescriptor,
      };
    }
    bpmnModeler = new BpmnModeler({ ...modeler });
    let id = fetchId();
    fetchDiagram(id, setWkf);
  }, [setWkf, isPropertyPanel]);

  return (
    <div id="container">
      <div id="bpmncontainer">
        <div id="propview"></div>
        <div id="bpmnview">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "left",
              padding: "20px 20px 0px 20px",
            }}
          >
            <div className="tooltip">
              <button onClick={onSave} className="property-button">
                <span className="tooltiptext">Save</span>
                <img
                  src={SaveIcon}
                  alt="save"
                  style={{
                    height: 20,
                    width: 20,
                  }}
                />
              </button>
            </div>
            <div className="tooltip">
              <button onClick={saveSVG} className="property-button">
                <span className="tooltiptext">Download SVG</span>
                <img
                  src={ImageIcon}
                  alt="save"
                  style={{
                    height: 20,
                    width: 20,
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div id="mySidenav">
        <div
          id="property"
          onClick={() => setPropertyPanel(!isPropertyPanel)}
          style={{
            marginRight: !isPropertyPanel ? "0px" : "260px",
          }}
        >
          {isPropertyPanel ? ">" : "<"}
        </div>
        <div
          className="properties-panel-parent"
          id="js-properties-panel"
          style={{ display: isPropertyPanel ? "block" : "none" }}
        ></div>
        {message && (
          <div
            id="snackbar"
            style={{
              backgroundColor: messageType === "error" ? "#f44336" : "#4caf50",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default BpmnModelerComponent;
