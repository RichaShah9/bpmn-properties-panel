import React, { useEffect, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";
import camundaModdleDescriptor from "camunda-bpmn-moddle/resources/camunda.json";

import Service from "./services/Service";
import { SaveIcon, ImageIcon, UploadIcon, DownloadIcon } from "./assets";
import { download } from "./utils";

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
    download(svg, "diagram.svg");
  });
};

const uploadXml = () => {
  document.getElementById("inputFile").click();
};

const downloadXml = () => {
  bpmnModeler.saveXML({ format: true }, async function (err, xml) {
    download(xml, "diagram.bpmn");
  });
};

function BpmnModelerComponent() {
  const [wkf, setWkf] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const showAlert = (id, message) => {
    setMessage(message);
    let x = document.getElementById(id);
    if (!x) return;
    x.className = "show";
    setTimeout(function () {
      x.className = x.className.replace("show", "");
    }, 3000);
  };

  const uploadFile = (e) => {
    let files = e.target.files;
    let reader = new FileReader();
    if (
      files &&
      files[0] &&
      files[0].name &&
      !files[0].name.includes(".bpmn")
    ) {
      setMessageType("error");
      showAlert("snackbar", "Upload Bpmn files only");
      return;
    }
    reader.readAsText(files[0]);
    reader.onload = (e) => {
      openBpmnDiagram(e.target.result);
    };
  };

  const onSave = () => {
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      Service.add("com.axelor.apps.bpm.db.WkfModel", {
        ...wkf,
        diagramXml: xml,
      }).then((res) => {
        if (res && res.data && res.data[0]) {
          setWkf({ ...res.data[0] });
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

  const deployDiagram = async () => {
    let res = await Service.action({
      model: "com.axelor.apps.bpm.db.WkfModel",
      action: "save,action-wkf-model-method-deploy",
      data: {
        context: {
          _model: "com.axelor.apps.bpm.db.WkfModel",
          ...wkf,
        },
      },
    });
    if (res && res.data && res.data[0]) {
      setMessageType("success");
      showAlert("snackbar", "Deployed Successfully");
      fetchDiagram(wkf.id, setWkf);
    } else {
      setMessageType("error");
      showAlert(
        "snackbar",
        (res && res.data && (res.data.message || res.data.title)) || "Error!"
      );
    }
  };

  const toolBarButtons = [
    { name: "Save", icon: SaveIcon, tooltipText: "Save", onClick: onSave },
    {
      name: "Image",
      icon: ImageIcon,
      tooltipText: "Download SVG",
      onClick: saveSVG,
    },
    {
      name: "UploadXml",
      icon: UploadIcon,
      tooltipText: "Upload",
      onClick: uploadXml,
    },
    {
      name: "DownloadXml",
      icon: DownloadIcon,
      tooltipText: "Download",
      onClick: downloadXml,
    },
  ];

  useEffect(() => {
    let modeler = {
      container: "#bpmnview",
      keyboard: { bindTo: document },
      propertiesPanel: {
        parent: "#js-properties-panel",
      },
      additionalModules: [propertiesPanelModule, propertiesProviderModule],
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    };
    bpmnModeler = new BpmnModeler({ ...modeler });
    let id = fetchId();
    fetchDiagram(id, setWkf);
  }, [setWkf]);

  return (
    <div id="container">
      <div id="bpmncontainer">
        <div id="propview"></div>
        <div id="bpmnview">
          <div className="toolbar-buttons">
            {toolBarButtons.map((btn) => (
              <div className="tooltip" key={btn.name}>
                {btn.name === "UploadXml" && (
                  <input
                    id="inputFile"
                    type="file"
                    name="file"
                    onChange={uploadFile}
                    style={{ display: "none" }}
                  />
                )}
                <button onClick={btn.onClick} className="property-button">
                  <span className="tooltiptext">{btn.tooltipText}</span>
                  {btn.icon && (
                    <img
                      src={btn.icon}
                      alt={btn.name}
                      style={{
                        height: 20,
                        width: 20,
                      }}
                    />
                  )}
                </button>
              </div>
            ))}
            <div className="tooltip" key="Deploy">
              <button
                onClick={deployDiagram}
                className="property-button"
                style={{
                  padding: 9,
                  width: "fit-content",
                }}
              >
                <span className="tooltiptext">Deploy</span>
                Deploy
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="properties-panel-parent" id="js-properties-panel"></div>
      <div
        id="snackbar"
        style={{
          backgroundColor: messageType === "error" ? "#f44336" : "#4caf50",
        }}
      >
        {message}
      </div>
    </div>
  );
}

export default BpmnModelerComponent;
