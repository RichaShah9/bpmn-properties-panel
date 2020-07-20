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
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Typography from "@material-ui/core/Typography";

import propertiesCustomProviderModule from "./custom-provider";
import templates from "./custom-templates/template.json";
import Service from "../../services/Service";
import AlertDialog from "../../components/AlertDialog";
import Tooltip from "../../components/Tooltip";
import { Tab, Tabs } from "../../components/Tabs";
import { download, translate } from "../../utils";
import {
  DeployDialog,
  DialogView as Dialog,
  SelectRecordsDialog,
  MigrateRecordsDialog,
} from "./views";
import propertiesTabs from "./properties/properties";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-font/dist/css/bpmn-embedded.css";
import "bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css";
import "../css/bpmn.css";

const drawerWidth = 380;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginRight: drawerWidth,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    background: "#F8F8F8",
    width: "calc(100% - 1px)",
    position: "absolute",
    borderLeft: "1px solid #ccc",
    overflow: "auto",
    height: "100%",
  },
  drawerContainer: {
    padding: 10,
    height: "100%",
  },
  toolbar: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(3),
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
  nodeTitle: {
    fontSize: "120%",
    fontWeight: "bolder",
  },
}));
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

const getType = (element) => {
  if (!element) return;
  const type = element.type.toLowerCase();
  return type.includes("event")
    ? "event"
    : type.includes("task")
    ? "task"
    : type;
};

const getElements = () => {
  let elementRegistry = bpmnModeler.get("elementRegistry");
  let elements = [],
    elementIds = [];
  elementRegistry.filter(function (element) {
    if (["event", "task"].includes(getType(element))) {
      elements.push({
        id: element.id,
        name: element.businessObject.name || element.id,
        type: getType(element),
      });
      elementIds.push(element.id);
    }
    return element;
  });
  return { elementIds, elements };
};

function BpmnModelerComponent() {
  const [wkf, setWkf] = useState(null);
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(null);
  const [element, setElement] = useState(null);
  const [openAlert, setAlert] = useState(false);
  const [openDelopyDialog, setDelopyDialog] = useState(false);
  const [openSelectRecordsDialog, setSelectRecords] = useState(false);
  const [openMigrateRecordsDialog, setMigrateRecords] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState(null);
  const [model, setModel] = useState(null);
  const [migrationPlan, setMigrationPlan] = useState(null);
  const [wkfMigrationMap, setWkfMigrationMap] = useState(null);
  const [fields, setFields] = useState(null);
  const [isCustomModel, setCustomModel] = useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const [ids, setIds] = useState({
    oldIds: null,
    currentIds: null,
  });
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });
  const [metaJsonModel, setMetaJsonModel] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const classes = useStyles();

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };
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
      setSelectedElement(
        bpmnModeler._definitions &&
          bpmnModeler._definitions.rootElements &&
          bpmnModeler._definitions.rootElements[0]
      );
      if (isDeploy) {
        const { elements } = getElements();
        window.localStorage.setItem(
          "elementIds",
          JSON.stringify({
            ...(JSON.parse(window.localStorage.getItem("elementIds")) || {}),
            [`diagram_${id}`]: elements,
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

  const deploy = async (migrationPlan, wkfMigrationMap) => {
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
              wkfMigrationMap,
              _migrationType: migrationPlan ? migrationPlan.value : null,
              _processInstanceIds:
                (selectedRecords &&
                  selectedRecords.map((record) => record.processInstanceId)) ||
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
      setSelectedRecords(null);
      setMigrationPlan(null);
      setWkfMigrationMap(null);
      setModel(null);
    });
  };

  const handleOk = (wkfMigrationMap, migrationPlan) => {
    setDelopyDialog(false);
    setMigrationPlan(migrationPlan);
    setWkfMigrationMap(wkfMigrationMap);
    if (migrationPlan.value === "selected" && wkf.statusSelect === 2) {
      setSelectRecords(true);
    } else {
      deploy(migrationPlan, wkfMigrationMap);
    }
  };

  const openConfigRecords = (fields, model, isCustomModel, metaJsonModel) => {
    setFields(fields);
    setModel(model);
    setMigrateRecords(true);
    setCustomModel(isCustomModel);
    setMetaJsonModel(metaJsonModel);
  };

  const deployDiagram = async () => {
    const { elements } = getElements();
    let localElements = JSON.parse(window.localStorage.getItem("elementIds"));
    let oldElements = localElements && localElements[`diagram_${id}`];
    setIds({
      currentElements: elements,
      oldElements: oldElements,
    });
    setDelopyDialog(true);
  };

  const addRecords = (records) => {
    const recordsIds =
      (selectedRecords && selectedRecords.map((r) => r.id)) || [];
    const newRecords = [...(selectedRecords || [])];
    records &&
      records.forEach((record) => {
        if (!recordsIds.includes(record.id)) {
          newRecords.push(record);
        }
      });
    setSelectedRecords(newRecords);
    setMigrateRecords(false);
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
    setDrawerOpen(width === "0px" ? false : true);
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

  useEffect(() => {
    if (!bpmnModeler) return;
    bpmnModeler.on("element.click", (event) => {
      let canvas = bpmnModeler.get("canvas");
      let elementRegistry = bpmnModeler.get("elementRegistry");
      let bpmnFactory = bpmnModeler.get("bpmnFactory");
      let elementTemplates = bpmnModeler.get("elementTemplates");
      let tabs = propertiesTabs(
        event.element,
        canvas,
        bpmnFactory,
        elementRegistry,
        elementTemplates,
        translate
      );
      console.log("tabs", tabs)
      setSelectedElement(event.element);
      setDrawerOpen(true);
    });
  }, []);

  return (
    <div id="container">
      <div id="bpmncontainer">
        <div id="propview"></div>
        <div id="bpmnview">
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
          <Drawer
            variant="persistent"
            anchor="right"
            open={drawerOpen}
            style={{
              width: drawerWidth,
            }}
            classes={{
              paper: classes.drawerPaper,
            }}
            id="drawer"
          >
            <div className={classes.drawerContainer}>
              <Typography className={classes.nodeTitle}>
                {selectedElement && selectedElement.id}
              </Typography>
              <Tabs value={tabValue} onChange={handleChange}>
                <Tab label="General Tab" />
                <Tab label="Tab 2" />
                <Tab label="Tab 3" />
              </Tabs>
              {selectedElement && selectedElement.id && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginTop: 20,
                  }}
                >
                  <label className={classes.label}>Id</label>
                  <input
                    value={selectedElement && selectedElement.id}
                    onChange={() => {}}
                  ></input>
                </div>
              )}
            </div>
          </Drawer>
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
      {openSelectRecordsDialog && (
        <SelectRecordsDialog
          open={openSelectRecordsDialog}
          onClose={() => {
            setSelectRecords(false);
            setSelectedRecords(null);
          }}
          openConfigRecords={(fields, model, isCustomModel, metaJsonModel) =>
            openConfigRecords(fields, model, isCustomModel, metaJsonModel)
          }
          wkf={wkf}
          selectedRecords={selectedRecords}
          onOk={() => {
            setSelectRecords(false);
            setSelectedRecords(null);
            deploy(migrationPlan, wkfMigrationMap);
          }}
        />
      )}
      {openMigrateRecordsDialog && (
        <MigrateRecordsDialog
          open={openSelectRecordsDialog}
          onClose={() => setMigrateRecords(false)}
          fields={fields}
          isCustomModel={isCustomModel}
          model={model}
          onOk={(selectedRecords) => {
            addRecords(selectedRecords);
          }}
          metaJsonModel={metaJsonModel}
        />
      )}
    </div>
  );
}

export default BpmnModelerComponent;
