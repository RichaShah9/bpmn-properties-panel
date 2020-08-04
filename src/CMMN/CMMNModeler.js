import React, { useState, useEffect } from "react";
import CmmnModeler from "cmmn-js/lib/Modeler";
import propertiesPanelModule from "cmmn-js-properties-panel";
import propertiesProviderModule from "cmmn-js-properties-panel/lib/provider/cmmn";
import camundaModdleDescriptor from "camunda-cmmn-moddle/resources/camunda";
import Alert from "@material-ui/lab/Alert";
import { Snackbar } from "@material-ui/core";

import Service from "../services/Service";
import Tooltip from "../BPMN/components/Tooltip";
import { download } from "../utils";

import "cmmn-js-properties-panel/dist/assets/cmmn-js-properties-panel.css";
import "./css/cmmnModeler.css";

let cmmnModeler = null;

const defaultCMMNDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<cmmn:definitions xmlns:cmmndi="http://www.omg.org/spec/CMMN/20151109/CMMNDI" xmlns:cmmn="http://www.omg.org/spec/CMMN/20151109/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="Definitions_05j26ro" targetNamespace="http://bpmn.io/schema/cmmn" exporter="Camunda Modeler" exporterVersion="3.7.2">
  <cmmndi:CMMNDI>
    <cmmndi:CMMNDiagram id="CMMNDiagram_0gadf12">
      <cmmndi:Size width="500" height="500" />
    </cmmndi:CMMNDiagram>
  </cmmndi:CMMNDI>
</cmmn:definitions>`;

const fetchId = () => {
  const regexCMMN = /[?&]id=([^&#]*)/g; // ?id=1
  const url = window.location.href;
  let matchCMMNId, id;
  while ((matchCMMNId = regexCMMN.exec(url))) {
    id = matchCMMNId[1];
    return id;
  }
};

const fetchDiagram = async (id, setWkf) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfCmmnModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    let { diagramXml } = wkf;
    setWkf(wkf);
    newBpmnDiagram(diagramXml);
  } else {
    newBpmnDiagram();
  }
};

const newBpmnDiagram = (rec) => {
  const diagram = rec || defaultCMMNDiagram;
  openDiagram(diagram);
};

const openDiagram = async (xml) => {
  cmmnModeler.importXML(xml, function (err) {
    if (err) {
      return console.error("could not import CMMN diagram", err);
    }
    let canvas = cmmnModeler.get("canvas");
    canvas.zoom("fit-viewport");
  });
};

const uploadXml = () => {
  document.getElementById("inputFile").click();
};

const exportDiagram = () => {
  cmmnModeler.saveXML({ format: true }, function (err, xml) {
    if (err) {
      return console.error("could not save CMMN 1.1 diagram", err);
    }
    download(xml, "diagram.cmmn");
  });
};

function CMMNModeler() {
  const [wkfModel, setWkfModel] = useState(null);
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });

  const handleSnackbarClick = (messageType, message) => {
    setSnackbar({
      open: true,
      messageType,
      message,
    });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({
      open: false,
      messageType: null,
      message: null,
    });
  };

  const uploadFile = (e) => {
    let files = e.target.files;
    let reader = new FileReader();
    if (
      files &&
      files[0] &&
      files[0].name &&
      !files[0].name.includes(".cmmn")
    ) {
      handleSnackbarClick("error", "Upload cmmn files only");
      return;
    }
    reader.readAsText(files[0]);
    reader.onload = (e) => {
      openDiagram(e.target.result);
    };
  };

  const onSave = () => {
    cmmnModeler.saveXML({ format: true }, async function (err, xml) {
      Service.add("com.axelor.apps.bpm.db.WkfCmmnModel", {
        ...wkfModel,
        diagramXml: xml,
      }).then((res) => {
        if (res && res.data && res.data[0]) {
          setWkfModel({ ...res.data[0] });
          handleSnackbarClick("success", "Saved Successfully");
        } else {
          handleSnackbarClick(
            "error",
            (res && res.data && (res.data.message || res.data.title)) ||
              "Error!"
          );
        }
      });
    });
  };

  const deployDiagram = async () => {
    cmmnModeler.saveXML({ format: true }, async function (err, xml) {
      let res = await Service.add("com.axelor.apps.bpm.db.WkfCmmnModel", {
        ...wkfModel,
        diagramXml: xml,
      });
      if (res && res.data && res.data[0]) {
        setWkfModel({ ...res.data[0] });
        let actionRes = await Service.action({
          model: "com.axelor.apps.bpm.db.WkfCmmnModel",
          action: "action-wkf-cmmn-model-method-deploy",
          data: {
            context: {
              _model: "com.axelor.apps.bpm.db.WkfCmmnModel",
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
          handleSnackbarClick("success", "Deployed Successfully");
          fetchDiagram(wkfModel.id, setWkfModel);
        } else {
          handleSnackbarClick(
            "error",
            (actionRes &&
              actionRes.data &&
              (actionRes.data.message || actionRes.data.title)) ||
              "Error!"
          );
        }
      } else {
        handleSnackbarClick(
          "error",
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
    document.documentElement.style.setProperty("--cmmn-container-width", width);
  };

  useEffect(() => {
    cmmnModeler = new CmmnModeler({
      additionalModules: [propertiesPanelModule, propertiesProviderModule],
      container: "#canvas",
      propertiesPanel: {
        parent: "#properties",
      },
      // make camunda prefix known for import, editing and export
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
              <div key={btn.name}>
                {btn.name === "UploadXml" && (
                  <input
                    id="inputFile"
                    type="file"
                    name="file"
                    onChange={uploadFile}
                    style={{ display: "none" }}
                  />
                )}
                <Tooltip
                  title={btn.tooltipText}
                  children={
                    <button onClick={btn.onClick} className="property-button">
                      {btn.icon}
                    </button>
                  }
                />
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
                parseInt(element.style.width, 10) > 4 ? 0 : "350px";
              setCSSWidth(element.style.width);
            }}
          >
            Properties Panel
          </div>
          <div id="resize-handler" style={{ width: 350 }}>
            <div id="properties"></div>
          </div>
        </div>
      </div>
      {openSnackbar.open && (
        <Snackbar
          open={openSnackbar.open}
          autoHideDuration={2000}
          onClose={handleSnackbarClose}
        >
          <Alert
            elevation={6}
            variant="filled"
            onClose={handleSnackbarClose}
            className="snackbarAlert"
          >
            {openSnackbar.message}
          </Alert>
        </Snackbar>
      )}
    </div>
  );
}

export default CMMNModeler;
