import React, { useEffect, useState } from "react";
import find from "lodash/find";
import BpmnModeler from "bpmn-js/lib/Modeler";
import camundaModdleDescriptor from "camunda-bpmn-moddle/resources/camunda.json";
import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Checkbox,
  TextField,
  FormControlLabel,
} from "@material-ui/core";

import templates from "./custom-templates/template.json";
import Service from "../services/Service";
import Select from "./components/Select";
import { getModels, getViews, getItems } from "../services/api";
import { download } from "../utils";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css";
import "./css/bpmn.css";

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

const fetchDiagram = async (id, setWkf, handleClickOpen, setElement) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    let { diagramXml } = wkf;
    setWkf(wkf);
    newBpmnDiagram(diagramXml, handleClickOpen, setElement);
  } else {
    newBpmnDiagram(undefined, handleClickOpen, setElement);
  }
};

const newBpmnDiagram = (rec, handleClickOpen, setElement) => {
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
  openBpmnDiagram(diagram, handleClickOpen, setElement);
};

const openBpmnDiagram = (xml, handleClickOpen, setElement) => {
  bpmnModeler.importXML(xml, (error) => {
    if (error) {
      return console.log("Error! Can't import XML");
    }
    let canvas = bpmnModeler.get("canvas");
    canvas.zoom("fit-viewport");
    bpmnModeler.on("element.contextmenu", 1500, (event) => {
      if (event.element.type === "bpmn:UserTask") {
        event.originalEvent.preventDefault();
        event.originalEvent.stopPropagation();
        setElement(event.element);
        handleClickOpen();
      }
    });
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

const intialState = {
  model: null,
  view: null,
  item: null,
};

function BpmnModelerComponent() {
  const [wkf, setWkf] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(null);
  const [properties, setProperties] = useState(intialState);
  const [element, setElement] = useState(null);
  const [attribute, setAttribute] = useState(null);
  const [attributeValue, setAttributeValue] = useState(null);

  const handleProperties = (name, value) => {
    setProperties({
      ...properties,
      [name]: value,
    });
  };
  const handleClickOpen = async () => {
    setOpen(true);
  };

  const handleClose = () => {
    setProperties(intialState);
    setOpen(false);
  };

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
      openBpmnDiagram(e.target.result, handleClickOpen);
    };
  };

  const onSave = () => {
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      let res = await Service.add("com.axelor.apps.bpm.db.WkfModel", {
        ...wkf,
        diagramXml: xml,
      });
      if (res && res.data && res.data[0]) {
        setWkf({ ...res.data[0] });
        setMessageType("success");
        showAlert("snackbar", "Saved Successfully");
      } else {
        setMessageType("error");
        showAlert(
          "snackbar",
          (res && res.data && (res.data.message || res.data.title)) || "Error!"
        );
      }
    });
  };

  const deployDiagram = async () => {
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      let res = await Service.add("com.axelor.apps.bpm.db.WkfModel", {
        ...wkf,
        diagramXml: xml,
      });
      if (res && res.data && res.data[0]) {
        setWkf({ ...res.data[0] });
        let actionRes = await Service.action({
          model: "com.axelor.apps.bpm.db.WkfModel",
          action: "action-wkf-model-method-deploy",
          data: {
            context: {
              _model: "com.axelor.apps.bpm.db.WkfModel",
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
          fetchDiagram(wkf.id, setWkf, handleClickOpen, setElement);
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
      name: "Image",
      icon: <i className="fa fa-picture-o" style={{ fontSize: 18 }}></i>,
      tooltipText: "Download SVG",
      onClick: saveSVG,
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
      onClick: downloadXml,
    },
    {
      name: "Deploy",
      icon: <i className="fa fa-rocket" style={{ fontSize: 18 }}></i>,
      tooltipText: "Deploy",
      onClick: deployDiagram,
    },
  ];

  function isExtensionElements(element) {
    return is(element, "bpmn:ExtensionElements");
  }

  function createParent(element, bo) {
    const bpmnFactory = bpmnModeler.get("bpmnFactory");

    let parent = elementHelper.createElement(
      "bpmn:ExtensionElements",
      { values: [] },
      bo,
      bpmnFactory
    );
    let cmd = cmdHelper.updateBusinessObject(element, bo, {
      extensionElements: parent,
    });
    return {
      cmd: cmd,
      parent: parent,
    };
  }

  function getPropertiesElementInsideExtensionElements(extensionElements) {
    return find(extensionElements.$parent.extensionElements.values, function (
      elem
    ) {
      return is(elem, "camunda:Properties");
    });
  }

  function getPropertiesElement(element) {
    if (!isExtensionElements(element)) {
      return element.properties;
    } else {
      return getPropertiesElementInsideExtensionElements(element);
    }
  }

  const addProperty = (name, value) => {
    const bo = getBusinessObject(element);
    const bpmnFactory = bpmnModeler.get("bpmnFactory");
    const businessObject = getBusinessObject(element);

    let parent;
    let result = createParent(element, bo);
    parent = result.parent;
    let properties = getPropertiesElement(parent);
    if (!properties) {
      properties = elementHelper.createElement(
        "camunda:Properties",
        {},
        parent,
        bpmnFactory
      );
    }

    let propertyProps = {
      name: name,
      value: value,
    };

    let property = elementHelper.createElement(
      "camunda:Property",
      propertyProps,
      properties,
      bpmnFactory
    );

    let camundaProps = bpmnFactory.create("camunda:Properties");
    camundaProps.get("values").push(property);
    businessObject.extensionElements.get("values")[0].values.push(property);
  };
  const handleAdd = () => {
    Object.entries(properties).forEach((obj) => {
      addProperty(obj[0], obj[1]);
    });
    addProperty(attribute, attributeValue);
    handleClose();
  };

  const removeLabels = (isUserTask = false) => {
    let element = document.querySelectorAll("[data-group=customField]");
    let elementTemplate = document.querySelectorAll(
      "[data-entry=elementTemplate-chooser]"
    );

    let extensionTab = document.querySelectorAll(
      "[data-tab=extensionElements]"
    );
    if (element && element[0] && element[0].childNodes) {
      if (isUserTask) {
        element[0].childNodes[1].style.display = "none";
      } else {
        element[0].style.display = "none";
      }
    }
    if (elementTemplate && elementTemplate[0]) {
      elementTemplate[0].style.display = "none";
    }
    if (extensionTab && extensionTab[0] && isUserTask) {
      let childNodes = extensionTab[0].querySelector(
        "[data-list-entry-container]"
      ).childNodes;
      childNodes &&
        childNodes.forEach((node) => {
          let childrens = node.childNodes || [];
          childrens &&
            childrens.forEach((child) => {
              if (
                child &&
                child.value &&
                (child.value.toLowerCase() === "completedif" ||
                  child.value.toLowerCase() === "buttons")
              ) {
                node.style.display = "none";
              }
            });
        });
    }
  };

  const setCSSWidth = (width) => {
    document.documentElement.style.setProperty("--container-width", width);
  };

  useEffect(() => {
    let modeler = {
      container: "#bpmnview",
      keyboard: { bindTo: document },
      propertiesPanel: {
        parent: "#js-properties-panel",
      },
      additionalModules: [propertiesPanelModule, propertiesProviderModule],
      elementTemplates: templates,
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    };
    bpmnModeler = new BpmnModeler({ ...modeler });
    let id = fetchId();
    setId(id);
    fetchDiagram(id, setWkf, handleClickOpen, setElement);
  }, [setWkf]);

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

  useEffect(() => {
    bpmnModeler.get("eventBus").on("propertiesPanel.changed", function (event) {
      if (
        event &&
        event.current &&
        event.current.element &&
        event.current.element.type
      ) {
        let isUserTask = event.current.element.type === "bpmn:UserTask";
        removeLabels(isUserTask);
      }
    });
  });

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
                  {btn.icon}
                </button>
              </div>
            ))}
          </div>
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
          <div
            className="properties-panel-parent"
            id="js-properties-panel"
          ></div>
        </div>
      </div>
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
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">View attributes</DialogTitle>
        <DialogContent>
          <DialogContentText>Add attributes</DialogContentText>
          <Select
            fetchMethod={(data) => getModels(id, data)}
            update={(value) => handleProperties("model", value.name)}
            name="model"
            value={properties.model}
          />
          {properties.model && (
            <Select
              fetchMethod={(data) => getViews(properties.model, data)}
              update={(value) => handleProperties("view", value.name)}
              name="view"
              value={properties.view}
            />
          )}
          {properties.view && (
            <Select
              fetchMethod={(data) =>
                getItems(properties.view, properties.model, data)
              }
              update={(value) => handleProperties("item", value.name)}
              name="item"
              value={properties.item}
            />
          )}
          {properties.item && (
            <Select
              options={[
                "readonly",
                "readonlyIf",
                "hidden",
                "required",
                "requiredIf",
                "title",
                "domain",
              ]}
              update={(value) => {
                setAttributeValue(null);
                setAttribute(value);
              }}
              name="attribute"
              value={attribute}
            />
          )}
          {attribute &&
            ["readonly", "hidden", "required"].includes(attribute) && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={attributeValue || false}
                    onChange={(e) => setAttributeValue(e.target.checked)}
                    name="attributeValue"
                  />
                }
                label={attribute}
              />
            )}
          {attribute &&
            ["readonlyIf", "hideIf", "requiredIf", "title", "domain"].includes(
              attribute
            ) && (
              <TextField
                value={attributeValue || ""}
                onChange={(e) => setAttributeValue(e.target.value)}
                name="attributeValue"
                fullWidth
                variant="outlined"
                size="small"
                placeholder={`${attribute} value`}
              />
            )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAdd} color="primary">
            Add
          </Button>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BpmnModelerComponent;
