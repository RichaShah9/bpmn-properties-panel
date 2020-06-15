import React, { useState, useEffect } from "react";
import DmnModeler from "dmn-js/lib/Modeler";
import { migrateDiagram } from "@bpmn-io/dmn-migrate";
import propertiesPanelModule from "dmn-js-properties-panel";
import drdAdapterModule from "dmn-js-properties-panel/lib/adapter/drd";
import propertiesProviderModule from "dmn-js-properties-panel/lib/provider/camunda";
import camundaModdleDescriptor from "camunda-dmn-moddle/resources/camunda";

import Service from "../services/Service";
import { download } from "../utils";

import "dmn-js-properties-panel/dist/assets/dmn-js-properties-panel.css";
import "./css/dmnModeler.css";

let dmnModeler = null;

const defaultDMNDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd" xmlns:biodi="http://bpmn.io/schema/dmn/biodi/1.0" id="Definitions_1oj7khq" name="DRD" namespace="http://camunda.org/schema/1.0/dmn">
  <decision id="Decision_1jui1qf" name="Decision 1">
    <extensionElements>
      <biodi:bounds x="157" y="81" width="180" height="80" />
    </extensionElements>
    <decisionTable id="decisionTable_1">
      <input id="input_1">
        <inputExpression id="inputExpression_1" typeRef="string">
          <text></text>
        </inputExpression>
      </input>
      <output id="output_1" typeRef="string" />
    </decisionTable>
  </decision>
</definitions>`;

const fetchId = () => {
  const regexDMN = /[?&]id=([^&#]*)/g; // ?id=1
  const url = window.location.href;
  let matchDMNId, id;
  while ((matchDMNId = regexDMN.exec(url))) {
    id = matchDMNId[1];
    return id;
  }
};

const fetchDiagram = async (id, setWkf) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfDmnModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    let { diagramXml } = wkf;
    setWkf(wkf);
    newBpmnDiagram(diagramXml);
  } else {
    newBpmnDiagram();
  }
};

const newBpmnDiagram = (rec) => {
  const diagram = rec || defaultDMNDiagram;
  openDiagram(diagram);
};

const openDiagram = async (dmnXML) => {
  const dmn13XML = await migrateDiagram(dmnXML);
  dmnModeler.importXML(dmn13XML, function (err) {
    if (err) {
      return console.error("could not import DMN 1.1 diagram", err);
    }
    let activeEditor = dmnModeler.getActiveViewer();
    let canvas = activeEditor.get("canvas");
    canvas.zoom("fit-viewport");
  });
};

const uploadXml = () => {
  document.getElementById("inputFile").click();
};

const exportDiagram = () => {
  dmnModeler.saveXML({ format: true }, function (err, xml) {
    if (err) {
      return console.error("could not save DMN 1.1 diagram", err);
    }
    download(xml, "diagram.dmn");
  });
};

function DMNModeler() {
  const [wkfModel, setWkfModel] = useState(null);
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
    if (files && files[0] && files[0].name && !files[0].name.includes(".dmn")) {
      setMessageType("error");
      showAlert("snackbar", "Upload dmn files only");
      return;
    }
    reader.readAsText(files[0]);
    reader.onload = (e) => {
      openDiagram(e.target.result);
    };
  };

  const onSave = () => {
    dmnModeler.saveXML({ format: true }, async function (err, xml) {
      Service.add("com.axelor.apps.bpm.db.WkfDmnModel", {
        ...wkfModel,
        diagramXml: xml,
      }).then((res) => {
        if (res && res.data && res.data[0]) {
          setWkfModel({ ...res.data[0] });
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
    dmnModeler.saveXML({ format: true }, async function (err, xml) {
      let res = await Service.add("com.axelor.apps.bpm.db.WkfDmnModel", {
        ...wkfModel,
        diagramXml: xml,
      });
      if (res && res.data && res.data[0]) {
        setWkfModel({ ...res.data[0] });
        let actionRes = await Service.action({
          model: "com.axelor.apps.bpm.db.WkfDmnModel",
          action: "action-wkf-dmn-model-method-deploy",
          data: {
            context: {
              _model: "com.axelor.apps.bpm.db.WkfDmnModel",
              ...res.data[0],
            },
          },
        });
        if (
          actionRes &&
          actionRes.data &&
          actionRes.data[0] &&
          actionRes.data[0].reload
        ) {
          setMessageType("success");
          showAlert("snackbar", "Deployed Successfully");
          fetchDiagram(wkfModel.id, setWkfModel);
        } else {
          setMessageType("error");
          showAlert(
            "snackbar",
            (actionRes &&
              actionRes.data &&
              (actionRes.data.message || actionRes.data.title)) ||
              "Error!"
          );
        }
      } else {
        setMessageType("error");
        showAlert(
          "snackbar",
          (res && res.data && (res.data.message || res.data.title)) || "Error!"
        );
      }
    });
  };

  const toolBarButtons = [
    {
      name: "Save",
      icon: <i className="fa fa-floppy-o" style={{ fontSize: 18 }}></i>,
      tooltipText: "Save",
      onClick: onSave,
    },
    {
      name: "UploadXml",
      icon: <i className="fa fa-upload" style={{ fontSize: 18 }}></i>,
      tooltipText: "Upload",
      onClick: uploadXml,
    },
    {
      name: "DownloadXml",
      icon: <i className="fa fa-download" style={{ fontSize: 18 }}></i>,
      tooltipText: "Download",
      onClick: exportDiagram,
    },
    {
      name: "Deploy",
      icon: <i className="fa fa-rocket" style={{ fontSize: 18 }}></i>,
      tooltipText: "Deploy",
      onClick: deployDiagram,
    },
  ];

  const setCSSWidth = (width) => {
    document.documentElement.style.setProperty("--container-width", width);
  };

  useEffect(() => {
    dmnModeler = new DmnModeler({
      drd: {
        propertiesPanel: {
          parent: "#properties",
        },
        additionalModules: [
          propertiesPanelModule,
          propertiesProviderModule,
          drdAdapterModule,
        ],
      },
      container: "#canvas",
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    });

    let id = fetchId();
    fetchDiagram(id, setWkfModel);
  }, []);

  useEffect(() => {
    const BORDER_SIZE = 4;
    const panel = document.getElementById("resize-handler");
    if (!panel) return;
    let m_pos;
    function resize(e) {
      const dx = m_pos - e.x;
      m_pos = e.x;
      panel.style.width =
        parseInt(getComputedStyle(panel, "").width) + dx + "px";
      setCSSWidth(panel.style.width);
    }

    panel.addEventListener(
      "mousedown",
      function (e) {
        if (e.offsetX < BORDER_SIZE) {
          m_pos = e.x;
          document.addEventListener("mousemove", resize, false);
        }
      },
      false
    );

    document.addEventListener(
      "mouseup",
      function () {
        document.removeEventListener("mousemove", resize, false);
      },
      false
    );
  });

  return (
    <div className="App">
      <div className="modeler">
        <div id="canvas">
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
                  {btn.icon}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div
            className="property-toggle"
            onClick={() => {
              let element = document.getElementById("resize-handler");
              element.style.width =
                parseInt(element.style.width, 10) > 4 ? 0 : "260px";
              setCSSWidth(element.style.width);
            }}
          >
            Properties Panel
          </div>
          <div id="resize-handler" style={{ width: 260 }}>
            <div id="properties"></div>
          </div>
        </div>
      </div>
      {message && <div
        id="snackbar"
        style={{
          backgroundColor: messageType === "error" ? "#f44336" : "#4caf50",
        }}
      >
        {message}
      </div>}
    </div>
  );
}

export default DMNModeler;
