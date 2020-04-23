import React, { useEffect } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";
import camundaModdleDescriptor from "camunda-bpmn-moddle/resources/camunda.json";
import save from "./save.png";
import Service from "./services/Service";
import { translate } from "./utils";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "./App.css";

let bpmnModeler = null;

const fetchId = () => {
  const regexReportPlanning = /[?&]id=([^&#]*)/g; // ?id=1
  const url = window.location.href;
  let matchBusinessRuleId, id;

  //while id is in URL
  while ((matchBusinessRuleId = regexReportPlanning.exec(url))) {
    id = matchBusinessRuleId[1];
    return id;
  }
};

const fetchDiagram = async (id, setBusinessRule) => {
  if (id) {
    let res = await Service.fetchId(
      "com.axelor.apps.orpea.planning.db.BusinessRule",
      id
    );
    let { diagramXml } = (res && res.data[0]) || {};
    setBusinessRule(res && res.data[0]);
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
      let x = document.getElementById("snackbar-alert");
      x.className = "show";
      x.innerHTML = translate("Error! Can't import XML");
      setTimeout(function () {
        x.className = x.className.replace("show", "");
      }, 3000);
      return console.log("Error! Can't import XMLl");
    }
    let canvas = bpmnModeler.get("canvas");
    canvas.zoom("fit-viewport");
  });
};

function App() {
  const [businessRule, setBusinessRule] = React.useState({
    name: "",
  });
  const [message, setMessage] = React.useState("");

  const showAlert = (id, message) => {
    setMessage(translate(message));
    let x = document.getElementById(id);
    x.className = "show";
    setTimeout(function () {
      x.className = x.className.replace("show", "");
    }, 3000);
  };

  const onSave = () => {
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      console.log("XML", xml);
      // let isValid = true;
      // const obj = bpmnModeler._definitions.rootElements[0].flowElements;
      // const modelElements = Array.from(obj);
      // Object.values(modelElements).forEach((r) => {
      //   if (r.$type !== "bpmn:ExclusiveGateway") {
      //     if (r.outgoing && r.outgoing.length > 1) {
      //       isValid = false;
      //       showAlert(
      //         "snackbar-alert",
      //         `Node ${
      //           r && r.name ? r.name : ""
      //         } should have only one outgoing node`
      //       );
      //       return;
      //     }
      //   } else {
      //     if (r.outgoing && r.outgoing.length > 2) {
      //       isValid = false;
      //       showAlert(
      //         "snackbar-alert",
      //         "Logic node has more than two connected nodes"
      //       );
      //       return;
      //     }
      //   }
      // });

      // let res =
      //   isValid &&
      //   (await Service.add("com.axelor.apps.orpea.planning.db.BusinessRule", {
      //     ...businessRule,
      //     diagramXml: xml,
      //   }));

      // if (res.status === -1) {
      //   showAlert("snackbar-alert", res.data.message || res.data.title);
      // } else {
      //   if (res && res.data && res.data[0]) {
      //     setBusinessRule(res.data[0]);
      //     let x = document.getElementById("snackbar");
      //     x.className = "show";
      //     setTimeout(function () {
      //       x.className = x.className.replace("show", "");
      //     }, 3000);
      //   }
      // }
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
    fetchDiagram(id, setBusinessRule);
  }, [setBusinessRule]);

  const openDiagramWindow = () => {
    let container = document.getElementById("message");
    container.style.display = "none";

    let bpmncontainer = document.getElementById("bpmncontainer");
    bpmncontainer.style.visibility = "visible";
  };
  return (
    <div id="container">
      <div id="message">
        <span style={{ fontSize: 18 }}>Create a </span>
        <button id="js-create-diagram" onClick={openDiagramWindow}>
          BPMN Diagram
        </button>
      </div>

      <div id="bpmncontainer">
        <div
          id="propview"
          style={{
            width: "100%",
            overflowX: "auto",
          }}
        ></div>
        <div
          id="bpmnview"
          style={{ width: "100%", height: "84vh", float: "left" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "left",
              padding: 20,
            }}
          >
            <button
              onClick={onSave}
              style={{
                width: 50,
                padding: 10,
                color: "white",
              }}
            >
              <img
                src={save}
                alt="save"
                style={{
                  height: 20,
                  width: 20,
                }}
              />
              {/* {translate("Save")} */}
            </button>
          </div>
        </div>
        <div className="properties-panel-parent" id="js-properties-panel"></div>
        <div id="snackbar">{translate("Saved Successfully")}</div>
        <div id="snackbar-alert">{message}</div>
      </div>
    </div>
  );
}

export default App;
