import React, { useEffect, useState } from "react";
import find from "lodash/find";
import classnames from "classnames";
import BpmnModeler from "bpmn-js/lib/Modeler";
import propertiesPanelModule from "bpmn-js-properties-panel";
import propertiesProviderModule from "bpmn-js-properties-panel/lib/provider/camunda";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import Alert from "@material-ui/lab/Alert";
import tokenSimulation from "bpmn-js-token-simulation/lib/modeler";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { makeStyles } from "@material-ui/core/styles";
import { Snackbar, Drawer, Typography } from "@material-ui/core";
import { Resizable } from "re-resizable";

import propertiesCustomProviderModule from "./custom-provider";
import camundaModdleDescriptor from "./resources/camunda.json";
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
  ColorPicker,
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
import { getTranslations, getInfo } from "../../services/api";
import { getBool } from "../../utils";
import {
  FILL_COLORS,
  USER_TASKS_TYPES,
  STROKE_COLORS,
  RELATIVE_FILL,
} from "./constants";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "bpmn-js-properties-panel/dist/assets/bpmn-js-properties-panel.css";
import "../css/bpmn.css";
import "../css/comments/comments.css";
import "../css/comments/simulation.css";
import "../css/colors.css";

const resizeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "solid 1px #ddd",
  background: "#f0f0f0",
};

const TimerEvents = React.lazy(() => import("./TimerEvent"));

const drawerWidth = 380;
const CAMUNDA_EXECUTION_LISTENER_ELEMENT = "camunda:ExecutionListener";

const CONDITIONAL_SOURCES = [
  "bpmn:EventBasedGateway",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
  "bpmn:ParallelGateway",
  "bpmn:SequenceFlow",
  "label",
  "bpmn:IntermediateThrowEvent",
  "bpmn:Collaboration",
  "bpmn:Lane",
  "bpmn:TextAnnotation",
  "bpmn:MessageFlow",
  "bpmn:Participant",
];

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
    width: "100%",
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
  colorMenu: {
    margin: 4,
    width: 64,
    height: 16,
  },
  colorButton: {
    textTransform: "none",
    boxShadow: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)",
    width: "95%",
    margin: 5,
    fontWeight: "bold",
  },
  businessRuleTask: {
    marginTop: 0,
  },
}));

let bpmnModeler = null;

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}

function setColors(element, forceUpdate = false) {
  if (
    element.businessObject &&
    element.businessObject.di &&
    (element.businessObject.di.stroke || element.businessObject.di.fill) &&
    !forceUpdate
  ) {
    return;
  }
  if (is(element, ["bpmn:Gateway"])) {
    element.businessObject.di.set("stroke", STROKE_COLORS["bpmn:Gateway"]);
    element.businessObject.di.set("fill", FILL_COLORS["bpmn:Gateway"]);
  } else {
    element.businessObject.di.set("stroke", STROKE_COLORS[element.type]);
    element.businessObject.di.set("fill", FILL_COLORS[element.type]);
  }
}

function BpmnModelerComponent() {
  const [wkf, setWkf] = useState(null);
  const [id, setId] = useState(null);
  const [openAlert, setAlert] = useState(false);
  const [openDelopyDialog, setDelopyDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isTimerTask, setIsTimerTask] = useState(true);
  const [alertMessage, setAlertMessage] = useState("Item is required.");
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
  const [isMenuActionDisable, setMenuAction] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [tabs, setTabs] = useState([]);
  const [width, setWidth] = useState(drawerWidth);
  const [height, setHeight] = useState("100%");
  const classes = useStyles();

  const handleMenuActionTab = (val) => {
    setMenuAction(val);
  };

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

  const updateTranslations = async (element, bpmnModeler, key) => {
    if (!key) return;
    const bo = getBusinessObject(element);
    const isTranslation =
      (bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
    if (!getBool(isTranslation)) return;
    const translations = await getTranslations(key);
    if (translations && translations.length > 0) {
      const info = await getInfo();
      const language = info && info["user.lang"];
      if (!language) return;
      const selectedTranslation = translations.find(
        (t) => t.language === language
      );
      if (!element) return;
      const value = selectedTranslation && selectedTranslation.message;
      const bo = element && element.businessObject;
      const elementType = element && element.type;
      let modelProperty =
        elementType === "bpmn:TextAnnotation"
          ? "text"
          : elementType === "bpmn:Group"
          ? "categoryValue"
          : "name";
      const name = bo[modelProperty];
      const newKey = bo.$attrs["camunda:key"];
      const diagramValue = value || newKey || name;
      element.businessObject[modelProperty] = diagramValue;
      let elementRegistry = bpmnModeler.get("elementRegistry");
      let modeling = bpmnModeler.get("modeling");
      let shape = elementRegistry.get(element.id);
      if (!shape) return;
      modeling &&
        modeling.updateProperties(shape, {
          [modelProperty]: diagramValue,
        });
    }
  };

  const getProperty = (element, name) => {
    let propertyName = `camunda:${name}`;
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant") {
      bo = getBusinessObject(bo.processRef);
    }
    return (bo.$attrs && bo.$attrs[propertyName]) || "";
  };

  const checkMenuActionTab = React.useCallback((element) => {
    if (!element) return;
    if (USER_TASKS_TYPES.includes(element.type)) {
      const metaModel = getProperty(element, "metaModel");
      const metaJsonModel = getProperty(element, "metaJsonModel");
      if (!metaJsonModel && !metaModel) {
        setMenuAction(true);
      } else {
        setMenuAction(false);
      }
    } else {
      setMenuAction(false);
    }
  }, []);

  const openBpmnDiagram = React.useCallback(
    function openBpmnDiagram(xml, isDeploy, id, oldWkf) {
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
        checkMenuActionTab(element);
        let tabs = getTabs(bpmnModeler, element);
        setTabs(tabs);
        let elementRegistry = bpmnModeler.get("elementRegistry");
        let modeling = bpmnModeler.get("modeling");
        let nodes = elementRegistry && elementRegistry._elements;
        if (!nodes) return;
        Object.entries(nodes).forEach(([key, value]) => {
          if (!value) return;
          const { element } = value;
          if (!element) return;
          if (modeling && element.businessObject && element.businessObject.di) {
            modeling.setColor(element, {
              stroke: element.businessObject.di.stroke,
              fill: element.businessObject.di.fill,
            });
          }
          if (["Shape", "Root"].includes(element.constructor.name)) {
            let bo = element.businessObject;
            if (!bo) return;
            if (isConditionalSource(element)) return;
            if (bo.$attrs["camunda:displayStatus"] === "false") return;
            if (
              bo.$attrs &&
              (bo.$attrs["camunda:displayStatus"] === undefined ||
                bo.$attrs["camunda:displayStatus"] === null)
            ) {
              bo.$attrs["camunda:displayStatus"] = true;
            }
          }
          let bo = getBusinessObject(element);
          const elementType = element && element.type;
          let modelProperty =
            elementType === "bpmn:TextAnnotation"
              ? "text"
              : elementType === "bpmn:Group"
              ? "categoryValue"
              : "name";
          let nameKey =
            element.businessObject.$attrs["camunda:key"] ||
            bo.get([modelProperty]);
          updateTranslations(element, bpmnModeler, nameKey);
        });
      });
    },
    [checkMenuActionTab]
  );

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
        <bpmn2:process id="Process_1" isExecutable="true">
          <bpmn2:startEvent id="StartEvent_1" />
        </bpmn2:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
            <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1" bioc:stroke="#55c041" bioc:fill="#ccecc6">
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

  function getKeyData(data, key) {
    return (
      data &&
      data.reduce((arrs, item) => {
        if (item.name === key) {
          arrs.push([]);
        }
        arrs[arrs.length - 1] && arrs[arrs.length - 1].push(item);
        return arrs;
      }, [])
    );
  }

  const onSave = () => {
    if (!isTimerTask) {
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const timerEvent = elementRegistry.filter((element) => {
        const bo = getBusinessObject(element);
        if (bo && bo.eventDefinitions) {
          let timerDef = bo.eventDefinitions.find(
            (e) => e.$type === "bpmn:TimerEventDefinition"
          );
          if (timerDef) {
            return element;
          }
        }
        return null;
      });
      if (timerEvent && timerEvent.length > 0) {
        handleSnackbarClick("error", "Timer events are not supported.");
        return;
      }
    }
    let elementRegistry = bpmnModeler.get("elementRegistry");
    let nodes = elementRegistry && elementRegistry._elements;
    let isValid = true;
    nodes &&
      Object.values(nodes).forEach((node) => {
        if (
          [
            "bpmn:EndEvent",
            "bpmn:IntermediateCatchEvent",
            ...USER_TASKS_TYPES,
          ].includes(node.element.type)
        ) {
          const viewElement = node.element;
          const businessObject = getBusinessObject(viewElement);
          const extensionElements = businessObject.extensionElements;
          const nodeName =
            (businessObject && businessObject.name) ||
            (viewElement && viewElement.id);
          let extensionElementValues, camundaProperty;
          if (extensionElements && extensionElements.values) {
            camundaProperty = extensionElements.values.find(
              (e) => e.$type === "camunda:Properties"
            );
            extensionElementValues = camundaProperty && camundaProperty.values;
          }
          if (extensionElementValues && extensionElementValues.length < 1)
            return;
          let models = getKeyData(extensionElementValues, "model");
          let values = [];
          models &&
            models.forEach((modelArr) => {
              let value = { items: [] };
              let items = getKeyData(modelArr, "item");
              modelArr.forEach((ele) => {
                if (ele.name === "model") {
                  value.model = { model: ele.value, fullName: ele.value };
                }
                if (ele.name === "modelName") {
                  value.model = { ...value.model, name: ele.value };
                }
                if (ele.name === "modelType") {
                  value.model = { ...value.model, type: ele.value };
                }
                if (ele.name === "modelLabel") {
                  value.modelLabel = ele.value;
                  value.model = { ...value.model, title: ele.value };
                }
                if (ele.name === "view") {
                  value.view = { name: ele.value };
                }
                if (ele.name === "viewLabel") {
                  value.viewLabel = ele.value;
                  value.view = { ...value.view, title: ele.value };
                }
                if (ele.name === "roles") {
                  if (!ele.value) return;
                  const roles = ele.value.split(",");
                  let valueRoles = [];
                  roles.forEach((role) => {
                    valueRoles.push({ name: role });
                  });
                  value.roles = valueRoles;
                }
              });

              items &&
                items.forEach((item) => {
                  value.items.push({
                    itemName: {
                      name: item[0] && item[0].value,
                      label: item[2] && item[2].value,
                    },
                    itemNameLabel: item[2] && item[2].value,
                    attributeName: item[1] && item[1].name,
                    attributeValue: item[1] && item[1].value,
                  });
                });
              values.push(value);
            });
          if (values && values.length > 0) {
            values &&
              values.forEach((value) => {
                const { items = [] } = value;
                const checkItems = items.filter(
                  (item) => item && (!item.itemName || !item.attributeName)
                );
                if (items.length < 1 || checkItems.length === items.length) {
                  setAlertMessage(`Item is required in ${nodeName}`);
                  alertOpen();
                  isValid = false;
                  return;
                }
                if (items.length > 0) {
                  items.forEach((item) => {
                    let { itemName, attributeName, attributeValue } = item;
                    if (!itemName || !attributeName) {
                      setAlertMessage(`Item name is required in ${nodeName}`);
                      alertOpen();
                      isValid = false;
                      return;
                    }
                    if (!attributeValue) {
                      if (
                        ["readonly", "hidden", "required"].includes(
                          attributeName
                        )
                      ) {
                        attributeValue = false;
                      } else {
                        isValid = false;
                        setAlertMessage(
                          `Item value is required in ${nodeName}`
                        );
                        alertOpen();
                        return;
                      }
                    }
                  });
                }
              });
          }
        }
      });
    if (!isValid) return;
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

  function getListeners(bo, type) {
    return (bo && extensionElementsHelper.getExtensionElements(bo, type)) || [];
  }

  const getBO = (element) => {
    let bo = getBusinessObject(element);
    if (is(element, "bpmn:Participant")) {
      bo = bo.get("processRef");
    }
    return bo;
  };

  const addNewExecutionElement = (element, type, initialEvent, script) => {
    const bpmnFactory = bpmnModeler.get("bpmnFactory");
    let props = {
      event: initialEvent,
      script: elementHelper.createElement(
        "camunda:Script",
        {
          scriptFormat: "axelor",
          value: script,
        },
        getBO(),
        bpmnFactory
      ),
    };

    let newElem = elementHelper.createElement(
      type,
      props,
      undefined,
      bpmnFactory
    );

    newElem.$attrs["outId"] = "dmn_output_mapping";
    let bo = getBO(element);
    let extensionElements = bo && bo.extensionElements;
    if (!extensionElements) {
      extensionElements = elementHelper.createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory
      );
      element.businessObject.extensionElements = extensionElements;
    }
    element.businessObject.extensionElements.values.push(newElem);
    return newElem;
  };

  const callOutoutMapping = async () => {
    const elementRegistry = bpmnModeler.get("elementRegistry");
    let businessRuleElements = elementRegistry.filter(function (element) {
      return is(element, "bpmn:BusinessRuleTask");
    });
    if (!businessRuleElements || businessRuleElements.length < 0) {
      return { status: -1 };
    }
    let elements =
      businessRuleElements &&
      businessRuleElements.filter(
        (e) =>
          e &&
          e.businessObject &&
          e.businessObject.$attrs &&
          getBool(e.businessObject.$attrs["camunda:assignOutputToFields"])
      );
    if (!elements || elements.length < 0) {
      return { status: -1 };
    }
    for (let i = 0; i < elements.length; i++) {
      let element = elements[i];
      if (element && element.businessObject) {
        let ifMultiple =
          element.businessObject.$attrs &&
          element.businessObject.$attrs["camunda:ifMultiple"];

        let searchWith =
          element.businessObject.$attrs &&
          element.businessObject.$attrs["camunda:searchWith"];

        let resultVariable = element.businessObject.resultVariable;
        let decisionId = element.businessObject.decisionRef;

        let ctxModel =
          element.businessObject.$attrs &&
          (element.businessObject.$attrs["camunda:metaModelModelName"] ||
            element.businessObject.$attrs["camunda:metaJsonModelModelName"]);

        let context = {
          decisionId,
          ctxModel,
          searchWith,
          ifMultiple,
          resultVariable,
        };

        let actionResponse = await Service.action({
          model: "com.axelor.apps.bpm.db.WkfModel",
          action: "action-wkf-dmn-model-method-create-output-to-field-script",
          data: {
            context,
          },
        });

        if (actionResponse && actionResponse.data && actionResponse.data[0]) {
          const { values } = actionResponse.data[0];
          const { script } = values;
          if (script) {
            let bo = getBO(element);
            const listeners = getListeners(
              bo,
              CAMUNDA_EXECUTION_LISTENER_ELEMENT
            );

            const listener = listeners.find(
              (l) => l && l.$attrs && l.$attrs["outId"] === "dmn_output_mapping"
            );
            if (listener && listener.script) {
              listener.script.value = script;
            } else {
              addNewExecutionElement(
                element,
                CAMUNDA_EXECUTION_LISTENER_ELEMENT,
                "end",
                script
              );
            }
          }
        }
      }
    }
    return { status: 0 };
  };

  const deploy = async (wkfMigrationMap, isMigrateOld, newWkf = wkf) => {
    bpmnModeler.saveXML({ format: true }, async function (err, xml) {
      let res = await Service.add("com.axelor.apps.bpm.db.WkfModel", {
        ...newWkf,
        diagramXml: xml,
      });
      if (res && res.data && res.data[0]) {
        setWkf({ ...res.data[0] });
        let context = {
          _model: "com.axelor.apps.bpm.db.WkfModel",
          ...res.data[0],
          wkfMigrationMap,
        };
        if (newWkf && newWkf.statusSelect === 1 && newWkf.oldNodes) {
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
          if (newWkf && newWkf.statusSelect !== 1) {
            handleSnackbarClick("success", "Deployed Successfully");
          }
          fetchDiagram(newWkf.id, true);
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
      if (newWkf && newWkf.statusSelect === 1) {
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
          fetchDiagram(newWkf.id, true);
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

  const handleOk = async (wkfMigrationMap, isMigrateOld) => {
    setDelopyDialog(false);
    let res = await callOutoutMapping();
    if (res.status === 0) {
      bpmnModeler.saveXML({ format: true }, async function (err, xml) {
        let res = await Service.add("com.axelor.apps.bpm.db.WkfModel", {
          ...wkf,
          diagramXml: xml,
        });
        deploy(wkfMigrationMap, isMigrateOld, res && res.data && res.data[0]);
      });
    } else {
      deploy(wkfMigrationMap, isMigrateOld);
    }
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

  const changeColor = (color) => {
    if (!selectedElement || !color) return;
    let modeling = bpmnModeler.get("modeling");
    let colors = {};
    colors.stroke = color;
    colors.fill = RELATIVE_FILL[color.toLowerCase()];
    modeling.setColor(selectedElement, colors);
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
    if (values && values.length > 0) {
      values &&
        values.forEach((value) => {
          const {
            model,
            modelLabel,
            view,
            viewLabel,
            roles = [],
            items = [],
          } = value;
          if (model) {
            addProperty(
              "model",
              model.type === "metaJsonModel"
                ? "com.axelor.meta.db.MetaJsonRecord"
                : model.fullName || model.model
            );
            addProperty("modelName", model.name);
            addProperty("modelLabel", modelLabel);
            addProperty("modelType", model.type);
          }
          if (view) {
            addProperty("view", view.name);
            addProperty("viewLabel", viewLabel);
          }
          if (roles.length > 0) {
            const roleNames = roles.map((role) => role.name);
            addProperty("roles", roleNames.toString());
          }
          if (items.length > 0) {
            items.forEach((item) => {
              let {
                itemName,
                itemNameLabel,
                attributeName,
                attributeValue,
              } = item;
              addProperty("item", itemName.name);
              addProperty(attributeName, attributeValue);
              addProperty("itemLabel", itemNameLabel);
            });
          }
        });
    }
  };

  const setCSSWidth = (width) => {
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
          <Textbox
            entry={entry}
            bpmnModeler={bpmnModeler}
            element={selectedElement}
          />
        );
      case "selectBox":
        return <SelectBox entry={entry} element={selectedElement} />;
      case "checkbox":
        return <Checkbox entry={entry} element={selectedElement} />;
      case "colorPicker":
        return (
          <ColorPicker
            changeColor={changeColor}
            entry={entry}
            element={selectedElement}
          />
        );
      default:
        return (
          <Textbox
            entry={entry}
            element={selectedElement}
            bpmnModeler={bpmnModeler}
          />
        );
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
        className={classnames(classes.groupContainer, classes[group.className])}
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
            onSave={onSave}
            openSnackbar={openSnackbar.open}
            handleMenuActionTab={handleMenuActionTab}
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

  const updateTabs = React.useCallback(
    (event) => {
      let { element } = event;
      if (element && element.type === "label") {
        const elementRegistry = bpmnModeler.get("elementRegistry");
        const newElement = elementRegistry.get(
          element.businessObject && element.businessObject.id
        );
        element = newElement;
      }
      let tabs = getTabs(bpmnModeler, element);
      setTabValue(0);
      setTabs(tabs);
      setSelectedElement(element);
      checkMenuActionTab(element);
      setDrawerOpen(true);
    },
    [checkMenuActionTab]
  );

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
        tokenSimulation,
        {
          preserveElementColors: ["value", {}],
        },
      ],
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    };
    bpmnModeler = new BpmnModeler({ ...modeler });
    let { id, timerTask } = fetchId();
    setId(id);
    setIsTimerTask(timerTask);
    fetchDiagram(id);
    hidePanelElements();
  }, [fetchDiagram]);

  useEffect(() => {
    if (!bpmnModeler) return;
    bpmnModeler.on("connection.added", (event) => {
      setColors(event && event.element);
    });
    bpmnModeler.on("shape.added", (event) => {
      setColors(event && event.element);
    });
    bpmnModeler
      .get("eventBus")
      .on("commandStack.shape.replace.postExecuted", (event) => {
        setColors(event && event.context && event.context.newShape, true);
        updateTabs({
          element: event && event.context && event.context.newShape,
        });
      });
    bpmnModeler.on("element.click", (event) => {
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
  }, [updateTabs]);

  return (
    <div id="container">
      <React.Suspense fallback={<></>}>
        {!isTimerTask && <TimerEvents />}
      </React.Suspense>
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
        <Resizable
          style={resizeStyle}
          size={{ width, height }}
          onResizeStop={(e, direction, ref, d) => {
            setWidth((width) => width + d.width);
            setHeight(height + d.height);
            setCSSWidth(width + d.width);
          }}
          maxWidth={window.innerWidth - 150}
        >
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
                  <Tab
                    disabled={
                      tab.id === "menu-action-tab" && isMenuActionDisable
                    }
                    label={tab.label}
                    key={tabIndex}
                    data-tab={tab.id}
                  />
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
            className="bpmn-property-toggle"
            onClick={() => {
              setWidth((width) => (width === 0 ? 380 : 0));
              setCSSWidth(width === 0 ? 380 : 0);
            }}
          >
            Properties Panel
          </div>
        </Resizable>
        <div className="properties-panel-parent" id="js-properties-panel"></div>
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
          message={alertMessage}
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
