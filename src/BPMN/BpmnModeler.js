import React, { useEffect, useState } from "react";
import find from "lodash/find";
import BpmnModeler from "bpmn-js/lib/Modeler";
import camundaModdleDescriptor from "camunda-bpmn-moddle/resources/camunda.json";
import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import Alert from "@material-ui/lab/Alert";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { Snackbar } from "@material-ui/core";

import propertiesCustomProviderModule from "./custom-provider";
import templates from "./custom-templates/template.json";
import Service from "../services/Service";
import AlertDialog from "./components/AlertDialog";
import { download } from "../utils";
import {
  DeployDialog,
  DialogView as Dialog,
  ProcessConfigDialog,
  ConfigRecordsDialog,
} from "./views";

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
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(null);
  const [element, setElement] = useState(null);
  const [openAlert, setAlert] = useState(false);
  const [openDelopyDialog, setDelopyDialog] = useState(false);
  const [openProcessConfigDialog, setProcessConfig] = useState(false);
  const [openConfigRecordsDialog, setConfigRecords] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState(null);
  const [model, setModel] = useState(null);
  const [migrationPlan, setMigrationPlan] = useState(null);
  const [wkfMigrationMap, setWkfMigrationMap] = useState(null);
  const [ids, setIds] = useState({
    oldIds: null,
    currentIds: null,
  });
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });

  const alertOpen = () => {
    setAlert(true);
  };

  const alertClose = () => {
    setAlert(false);
  };

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

  const handleClickOpen = async () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const openBpmnDiagram = React.useCallback(function openBpmnDiagram(
    xml,
    isDeploy,
    id
  ) {
    bpmnModeler.importXML(xml, (error) => {
      if (error) {
        handleSnackbarClick("error", "Error! Can't import XML");
        return;
      }
      if (isDeploy) {
        let elementRegistry = bpmnModeler.get("elementRegistry");
        let elementIds = [];
        elementRegistry.filter(function (element) {
          if (
            !["label", "bpmn:SequenceFlow", "bpmn:Process"].includes(
              element.type
            )
          ) {
            elementIds.push({
              id: element.id,
              name: element.businessObject.name || element.id,
            });
          }
          return element;
        });
        window.localStorage.setItem(
          "elementIds",
          JSON.stringify({
            ...(JSON.parse(window.localStorage.getItem("elementIds")) || {}),
            [`diagram_${id}`]: elementIds,
          })
        );
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
  },
  []);

  const newBpmnDiagram = React.useCallback(
    function newBpmnDiagram(rec, isDeploy, id) {
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
      openBpmnDiagram(diagram, isDeploy, id);
    },
    [openBpmnDiagram]
  );

  const fetchDiagram = React.useCallback(
    async function fetchDiagram(id, isDeploy = false) {
      if (id) {
        let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfModel", id, {
          fields: [
            "statusSelect",
            "wkfTaskConfigList",
            "previousVersion",
            "wkfProcessList",
            "dmnFileSet",
            "name",
            "description",
            "versionTag",
            "previousVersion.statusSelect",
            "isActive",
            "diagramXml",
          ],
          related: {
            wkfProcessList: ["name", "processId", "wkfProcessConfigList"],
          },
        });
        const wkf = (res && res.data && res.data[0]) || {};
        let { diagramXml } = wkf;
        setWkf(wkf);
        newBpmnDiagram(diagramXml, isDeploy, id);
      } else {
        newBpmnDiagram(undefined, isDeploy, id);
      }
    },
    [newBpmnDiagram]
  );

  const uploadFile = (e) => {
    let files = e.target.files;
    let reader = new FileReader();
    if (
      files &&
      files[0] &&
      files[0].name &&
      !files[0].name.includes(".bpmn")
    ) {
      handleSnackbarClick("error", "Upload Bpmn files only");
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
        handleSnackbarClick("success", "Saved Successfully");
      } else {
        handleSnackbarClick(
          "error",
          (res && res.data && (res.data.message || res.data.title)) || "Error!"
        );
      }
      if (open) {
        handleClose();
      }
    });
  };

  const deploy = async (migrationPlan) => {
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
              wkfMigrationMap: wkfMigrationMap,
              _migrationPlan: migrationPlan ? migrationPlan.value : null,
              _selectedModel: model,
              _selectedIds:
                (selectedRecords &&
                  selectedRecords.map((record) => record.id)) ||
                [],
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
          fetchDiagram(wkf.id, true);
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
      setSelectedRecords(null)
      setMigrationPlan(null)
      setWkfMigrationMap(null)
      setModel(null)
    });
  };

  const handleOk = (wkfMigrationMap, migrationPlan) => {
    setDelopyDialog(false);
    setMigrationPlan(migrationPlan);
    if (migrationPlan.value === "selected" && wkf.statusSelect === 2) {
      setProcessConfig(true);
      setWkfMigrationMap(wkfMigrationMap);
    }else{
      deploy(migrationPlan)
    }
  };

  const openConfigRecords = () => {
    setConfigRecords(true);
  };

  const deployDiagram = async () => {
    let elementRegistry = bpmnModeler.get("elementRegistry");
    let elements = [];
    let elementIds = [];
    elementRegistry.filter((element) => {
      if (
        !["label", "bpmn:SequenceFlow", "bpmn:Process"].includes(element.type)
      ) {
        elements.push({
          id: element.id,
          name: element.businessObject.name || element.id,
        });
        elementIds.push(element.id);
      }
      return element;
    });
    let localElements = JSON.parse(window.localStorage.getItem("elementIds"));
    let oldElements = localElements && localElements[`diagram_${id}`];
    setIds({
      currentIds: elements,
      oldIds: oldElements,
    });
    setDelopyDialog(true);
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
    return find(
      extensionElements.$parent.extensionElements &&
        extensionElements.$parent.extensionElements.values,
      function (elem) {
        return is(elem, "camunda:Properties");
      }
    );
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
    if (!businessObject.extensionElements) {
      businessObject.extensionElements = bpmnFactory.create(
        "bpmn:ExtensionElements"
      );
      businessObject.extensionElements.get("values").push(camundaProps);
    } else {
      businessObject.extensionElements.get("values")[0].values.push(property);
    }
  };

  const handleAdd = (row) => {
    if (!row) return;
    const { values = [] } = row;
    let isValid = true;
    if (values.length > 0) {
      values &&
        values.forEach((value) => {
          const { model, view, roles = [], items = [] } = value;
          const checkItems = items.filter(
            (item) => item && (!item.itemName || !item.attributeName)
          );
          if (items.length < 1 || checkItems.length === items.length) {
            alertOpen();
            isValid = false;
            return;
          }
          if (model) {
            addProperty("model", model.model);
            addProperty("modelName", model.name);
            addProperty("modelType", model.type);
          }
          if (view) {
            addProperty("view", view);
          }
          if (roles.length > 0) {
            const roleNames = roles.map((role) => role.name);
            addProperty("roles", roleNames.toString());
          }
          if (items.length > 0) {
            items.forEach((item) => {
              let { itemName, attributeName, attributeValue } = item;
              if (!itemName || !attributeName) {
                isValid = false;
                alertOpen();
                return;
              }
              if (!attributeValue) {
                if (
                  ["readonly", "hidden", "required"].includes(attributeName)
                ) {
                  attributeValue = false;
                } else {
                  isValid = false;
                  alertOpen();
                  return;
                }
              }
              let itemLabel = itemName["label"]
                ? itemName["label"]
                : itemName["title"]
                ? itemName["title"]
                : itemName["name"]
                ? itemName["name"]
                : typeof itemName === "object"
                ? ""
                : itemName;
              addProperty("item", itemName.name);
              addProperty(attributeName, attributeValue);
              addProperty("itemLabel", itemLabel);
            });
          }
        });
      if (isValid) {
        onSave();
      }
    } else {
      onSave();
    }
  };

  const removeLabels = (isUserTask = false) => {
    let element = document.querySelectorAll("[data-group=customField]");
    let elementTemplate = document.querySelectorAll(
      "[data-entry=elementTemplate-chooser]"
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
  };

  const setCSSWidth = (width) => {
    document.documentElement.style.setProperty("--bpmn-container-width", width);
  };

  useEffect(() => {
    let modeler = {
      container: "#bpmnview",
      keyboard: { bindTo: document },
      propertiesPanel: {
        parent: "#js-properties-panel",
      },
      additionalModules: [
        propertiesPanelModule,
        propertiesProviderModule,
        propertiesCustomProviderModule,
      ],
      elementTemplates: templates,
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    };
    bpmnModeler = new BpmnModeler({ ...modeler });
    let id = fetchId();
    setId(id);
    fetchDiagram(id);
  }, [fetchDiagram]);

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
          className="bpmn-property-toggle"
          onClick={() => {
            let element = document.getElementById("resize-handler");
            element.style.width =
              parseInt(element.style.width, 10) > 4 ? 0 : "380px";
            setCSSWidth(element.style.width);
          }}
        >
          Properties Panel
        </div>
        <div id="resize-handler" style={{ width: 380 }}>
          <div
            className="properties-panel-parent"
            id="js-properties-panel"
          ></div>
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
            severity={openSnackbar.messageType}
          >
            {openSnackbar.message}
          </Alert>
        </Snackbar>
      )}
      {open && element && (
        <Dialog
          id={id}
          handleClose={handleClose}
          handleAdd={handleAdd}
          open={open}
          element={element}
        />
      )}
      {openAlert && (
        <AlertDialog
          openAlert={openAlert}
          alertClose={alertClose}
          message="Item is required."
          title="Error"
        />
      )}
      {openDelopyDialog && (
        <DeployDialog
          open={openDelopyDialog}
          onClose={() => setDelopyDialog(false)}
          ids={ids}
          onOk={(wkfMigrationMap, migrationPlan) =>
            handleOk(wkfMigrationMap, migrationPlan)
          }
        />
      )}
      {openProcessConfigDialog && (
        <ProcessConfigDialog
          open={openProcessConfigDialog}
          onClose={() => setProcessConfig(false)}
          openConfigRecords={openConfigRecords}
          selectedRecords={selectedRecords}
          onOk={() => {
            setProcessConfig(false);
            deploy(migrationPlan);
          }}
        />
      )}
      {openConfigRecordsDialog && (
        <ConfigRecordsDialog
          open={openProcessConfigDialog}
          onClose={() => setConfigRecords(false)}
          wkf={wkf}
          onOk={(selectedRecords, model) => {
            setSelectedRecords(selectedRecords);
            setModel(model);
            setConfigRecords(false);
          }}
        />
      )}
    </div>
  );
}

export default BpmnModelerComponent;
