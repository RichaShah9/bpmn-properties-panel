import React, { useEffect, useState } from "react";
import find from "lodash/find";
import BpmnModeler from "bpmn-js/lib/Modeler";
import camundaModdleDescriptor from "camunda-bpmn-moddle/resources/camunda.json";
import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import Alert from "@material-ui/lab/Alert";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { Snackbar } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Drawer, Typography } from "@material-ui/core";

import propertiesCustomProviderModule from "./custom-provider";
import Service from "../../services/Service";
import AlertDialog from "../../components/AlertDialog";
import Tooltip from "../../components/Tooltip";
import { Tab, Tabs } from "../../components/Tabs";
import DeployDialog from "./views/DeployDialog";
import {
  Textbox,
  TextField,
  SelectBox,
  Checkbox,
} from "./properties/components";
import {
  fetchId,
  uploadXml,
  getElements,
  saveSVG,
  downloadXml,
  getTabs,
  isGroupVisible,
  isHiddenProperty,
  hidePanelElements,
  addOldNodes,
} from "./extra.js";

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
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  groupContainer: {
    marginTop: 10,
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
}));

let bpmnModeler = null;

function BpmnModelerComponent() {
  const [wkf, setWkf] = useState(null);
  const [id, setId] = useState(null);
  const [openAlert, setAlert] = useState(false);
  const [openDelopyDialog, setDelopyDialog] = useState(false);
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
  const [selectedElement, setSelectedElement] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [tabs, setTabs] = useState([]);

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

  const openBpmnDiagram = React.useCallback(function openBpmnDiagram(
    xml,
    isDeploy,
    id,
    oldWkf
  ) {
    bpmnModeler.importXML(xml, (error) => {
      if (error) {
        handleSnackbarClick("error", "Error! Can't import XML");
        return;
      }
      if (isDeploy) {
        addOldNodes(oldWkf, setWkf, bpmnModeler);
      }
      let canvas = bpmnModeler.get("canvas");
      canvas.zoom("fit-viewport");
      let element = canvas.getRootElement();
      setSelectedElement(element);
      let tabs = getTabs(bpmnModeler, element);
      setTabs(tabs);
    });
  },
  []);

  const newBpmnDiagram = React.useCallback(
    function newBpmnDiagram(rec, isDeploy, id, oldWkf) {
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
      openBpmnDiagram(diagram, isDeploy, id, oldWkf);
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
            "oldNodes",
          ],
          related: {
            wkfProcessList: ["name", "processId", "wkfProcessConfigList"],
          },
        });
        const wkf = (res && res.data && res.data[0]) || {};
        let { diagramXml } = wkf;
        setWkf(wkf);
        newBpmnDiagram(
          diagramXml,
          isDeploy,
          id,
          res && res.data && res.data[0]
        );
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
      openBpmnDiagram(e.target.result, false, id, wkf);
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
    });
  };

  const deploy = async (wkfMigrationMap, isMigrateOld) => {
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      let res = await Service.add("com.axelor.apps.bpm.db.WkfModel", {
        ...wkf,
        diagramXml: xml,
      });
      if (res && res.data && res.data[0]) {
        setWkf({ ...res.data[0] });
        let context = {
          _model: "com.axelor.apps.bpm.db.WkfModel",
          ...res.data[0],
          wkfMigrationMap,
        };
        if (wkf && wkf.statusSelect === 1 && wkf.oldNodes) {
          context.isMigrateOld = isMigrateOld;
        }
        let actionRes = await Service.action({
          model: "com.axelor.apps.bpm.db.WkfModel",
          action: "action-wkf-model-method-deploy",
          data: {
            context: {
              ...context,
            },
          },
        });
        if (
          actionRes &&
          actionRes.data &&
          actionRes.data[0] &&
          actionRes.data[0].reload
        ) {
          if (wkf && wkf.statusSelect !== 1) {
            handleSnackbarClick("success", "Deployed Successfully");
          }
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
      if (wkf && wkf.statusSelect === 1) {
        let actionStart = await Service.action({
          model: "com.axelor.apps.bpm.db.WkfModel",
          action: "action-wkf-model-method-start",
          data: {
            context: {
              _model: "com.axelor.apps.bpm.db.WkfModel",
              ...res.data[0],
            },
          },
        });
        if (
          actionStart &&
          actionStart.data &&
          actionStart.data[0] &&
          actionStart.data[0].reload
        ) {
          handleSnackbarClick("success", "Started Successfully");
          fetchDiagram(wkf.id, true);
        } else {
          handleSnackbarClick(
            "error",
            (actionStart &&
              actionStart.data &&
              (actionStart.data.message || actionStart.data.title)) ||
              "Error!"
          );
        }
      }
    });
  };

  const handleOk = (wkfMigrationMap, isMigrateOld) => {
    setDelopyDialog(false);
    deploy(wkfMigrationMap, isMigrateOld);
  };

  const deployDiagram = async () => {
    const elements = getElements(bpmnModeler);
    let oldElements = JSON.parse(wkf.oldNodes);
    setIds({
      currentElements: elements,
      oldElements: oldElements,
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
      onClick: () => saveSVG(bpmnModeler),
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
      onClick: () => downloadXml(bpmnModeler),
    },
    {
      name: "Deploy",
      icon: <i className="fa fa-rocket" style={{ fontSize: 18 }}></i>,
      tooltipText: wkf && wkf.statusSelect === 1 ? "Start" : "Deploy",
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

  const createCamundaProperty = () => {
    const bpmnFactory = bpmnModeler.get("bpmnFactory");
    const bo = getBusinessObject(selectedElement);
    let result = createParent(selectedElement, bo);
    let camundaProperties = elementHelper.createElement(
      "camunda:Properties",
      {},
      result && result.parent,
      bpmnFactory
    );
    selectedElement.businessObject.extensionElements &&
      selectedElement.businessObject.extensionElements.values &&
      selectedElement.businessObject.extensionElements.values.push(
        camundaProperties
      );
  };

  const addProperty = (name, value) => {
    const bo = getBusinessObject(selectedElement);
    const bpmnFactory = bpmnModeler.get("bpmnFactory");
    const businessObject = getBusinessObject(selectedElement);

    let parent;
    let result = createParent(selectedElement, bo);
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
      let camundaProperties = extensionElementsHelper.getExtensionElements(
        bo,
        "camunda:Properties"
      );
      if (
        camundaProperties &&
        camundaProperties[0] &&
        camundaProperties[0].values
      ) {
        camundaProperties[0].values.push(property);
      } else {
        createCamundaProperty();
        let camundaProperties = extensionElementsHelper.getExtensionElements(
          bo,
          "camunda:Properties"
        );
        camundaProperties[0].values = [property];
      }
    }
  };

  const handleAdd = (row) => {
    if (!row) return;
    const { values = [] } = row;
    let isValid = true;
    if (values && values.length > 0) {
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
            addProperty(
              "model",
              model.type === "metaJsonModel"
                ? "com.axelor.meta.db.MetaJsonRecord"
                : model.fullName || model.model
            );
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

  const setCSSWidth = (width) => {
    document.documentElement.style.setProperty("--bpmn-container-width", width);
    setDrawerOpen(width === "0px" ? false : true);
  };

  const renderComponent = (entry) => {
    if (!entry && entry.widget) return;
    switch (entry.widget) {
      case "textField":
        return (
          <TextField entry={entry} element={selectedElement} canRemove={true} />
        );
      case "textBox":
        return (
          <Textbox isResizable={true} entry={entry} element={selectedElement} />
        );
      case "selectBox":
        return <SelectBox entry={entry} element={selectedElement} />;
      case "checkbox":
        return <Checkbox entry={entry} element={selectedElement} />;
      default:
        return <Textbox entry={entry} element={selectedElement} />;
    }
  };

  function Entry({ entry }) {
    return (
      !isHiddenProperty(selectedElement, entry) && (
        <div key={entry.id}>{renderComponent(entry)}</div>
      )
    );
  }

  const TabPanel = ({ group, index }) => {
    return (
      <div
        key={group.id}
        data-group={group.id}
        className={classes.groupContainer}
      >
        {group.component ? (
          <group.component
            element={selectedElement}
            index={index}
            label={group.label}
            bpmnModeler={bpmnModeler}
            bpmnFactory={bpmnModeler && bpmnModeler.get("bpmnFactory")}
            bpmnModdle={bpmnModeler && bpmnModeler.get("moddle")}
            id={id}
            handleAdd={handleAdd}
          />
        ) : (
          group.entries.length > 0 && (
            <React.Fragment>
              <React.Fragment>
                {index > 0 && <div className={classes.divider} />}
              </React.Fragment>
              <div className={classes.groupLabel}>{group.label}</div>
              <div>
                {group.entries.map((entry, i) => (
                  <Entry entry={entry} key={i} />
                ))}
              </div>
            </React.Fragment>
          )
        )}
      </div>
    );
  };

  const updateTabs = (event) => {
    let { element } = event;
    if (element && element.type === "label") {
      element = element.businessObject;
    }
    let tabs = getTabs(bpmnModeler, element);
    setTabValue(0);
    setTabs(tabs);
    setSelectedElement(element);
    setDrawerOpen(true);
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
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    };
    bpmnModeler = new BpmnModeler({ ...modeler });
    let id = fetchId();
    setId(id);
    fetchDiagram(id);
    hidePanelElements();
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
    if (!bpmnModeler) return;
    bpmnModeler.on("element.click", (event) => {
      updateTabs(event);
    });
    bpmnModeler.on("shape.changed", (event) => {
      updateTabs(event);
    });
    bpmnModeler.on("shape.removed", () => {
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const definitions = bpmnModeler.getDefinitions();
      const element =
        definitions && definitions.rootElements && definitions.rootElements[0];
      if (!element) return;
      const rootElement = elementRegistry.get(element.id);
      if (!rootElement) return;
      updateTabs({
        element: rootElement,
      });
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
                {tabs.map((tab, tabIndex) => (
                  <Tab label={tab.label} key={tabIndex} data-tab={tab.id} />
                ))}
              </Tabs>
              <React.Fragment>
                {tabs &&
                  tabs[tabValue] &&
                  tabs[tabValue].groups &&
                  tabs[tabValue].groups.map((group, index) => (
                    <React.Fragment key={group.id}>
                      {isGroupVisible(group, selectedElement) && (
                        <TabPanel group={group} index={index} />
                      )}
                    </React.Fragment>
                  ))}
              </React.Fragment>
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
          onOk={(wkfMigrationMap, isMigrateOld) =>
            handleOk(wkfMigrationMap, isMigrateOld)
          }
          wkf={wkf}
        />
      )}
    </div>
  );
}

export default BpmnModelerComponent;
