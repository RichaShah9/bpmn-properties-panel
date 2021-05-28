import React, { useState, useEffect } from "react";
import DmnModeler from "dmn-js/lib/Modeler";
import { migrateDiagram } from "@bpmn-io/dmn-migrate";
import propertiesPanelModule from "dmn-js-properties-panel";
import drdAdapterModule from "dmn-js-properties-panel/lib/adapter/drd";
import propertiesProviderModule from "dmn-js-properties-panel/lib/provider/camunda";
import camundaModdleDescriptor from "camunda-dmn-moddle/resources/camunda";
import classnames from "classnames";
import Alert from "@material-ui/lab/Alert";
import { Snackbar, Drawer, Typography } from "@material-ui/core";
import { Resizable } from "re-resizable";
import { makeStyles } from "@material-ui/core/styles";

import { translate } from "../utils";
import propertiesTabs from "./properties/properties";
import propertiesCustomProviderModule from "./custom-provider";
import Service from "../services/Service";
import Tooltip from "../components/Tooltip";
import { Tab, Tabs } from "../components/Tabs";
import {
  Textbox,
  TextField,
  SelectBox,
  Checkbox,
} from "../BPMN/Modeler/properties/components";

import { download } from "../utils";
import "dmn-js-properties-panel/dist/assets/dmn-js-properties-panel.css";
import "dmn-js/dist/assets/dmn-js-decision-table-controls.css";
import "dmn-js/dist/assets/dmn-js-decision-table.css";
import "dmn-js/dist/assets/dmn-js-drd.css";
import "dmn-js/dist/assets/dmn-js-literal-expression.css";
import "dmn-js/dist/assets/dmn-js-shared.css";
import "dmn-js/dist/assets/diagram-js.css";

import "./css/dmnModeler.css";

let dmnModeler = null;
const drawerWidth = 380;

const resizeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "solid 1px #ddd",
  background: "#f0f0f0",
};

const useStyles = makeStyles(() => ({
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
    textAlign: "left",
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
  nodeTitle: {
    fontSize: "120%",
    fontWeight: "bolder",
  },
}));

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

function renderTabs(tabs = [], element) {
  const objectTabs = ["general"];
  let filteredTabs = [];
  tabs &&
    tabs.forEach((tab) => {
      if (!tab) return;
      if (objectTabs && objectTabs.includes(tab.id)) {
        filteredTabs.push(tab);
      }
    });
  return filteredTabs;
}

function getTabs(dmnModeler, element) {
  let activeEditor = dmnModeler && dmnModeler.getActiveViewer();
  if (!activeEditor) return;
  let tabs = propertiesTabs(element, translate, dmnModeler);
  let filteredTabs = renderTabs(tabs, element);
  return filteredTabs;
}
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
  const [openSnackbar, setSnackbar] = useState({
    open: false,
    messageType: null,
    message: null,
  });
  const [width, setWidth] = useState(drawerWidth);
  const [height, setHeight] = useState("100%");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [tabs, setTabs] = useState(null);

  const classes = useStyles();

  const renderComponent = (entry) => {
    if (!entry && entry.widget) return;
    switch (entry.widget) {
      case "textField":
        return (
          <TextField entry={entry} element={selectedElement} canRemove={true} />
        );
      case "textBox":
        return <Textbox entry={entry} element={selectedElement} />;
      case "selectBox":
        return <SelectBox entry={entry} element={selectedElement} />;
      case "checkbox":
        return <Checkbox entry={entry} element={selectedElement} />;
      default:
        return <Textbox entry={entry} element={selectedElement} />;
    }
  };

  function Entry({ entry }) {
    return <div key={entry.id}>{renderComponent(entry)}</div>;
  }

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

  const updateTabs = React.useCallback((event) => {
    let { element } = event;
    if (element && element.type === "label") {
      let activeEditor = dmnModeler && dmnModeler.getActiveViewer();
      const elementRegistry = activeEditor.get("elementRegistry");
      const newElement = elementRegistry.get(
        element.businessObject && element.businessObject.id
      );
      element = newElement;
    }
    let tabs = getTabs(dmnModeler, element);
    setTabValue(0);
    setTabs(tabs);
    setSelectedElement(element);
    setDrawerOpen(true);
  }, []);

  const openDiagram = React.useCallback(
    async (dmnXML) => {
      const dmn13XML = await migrateDiagram(dmnXML);
      dmnModeler.importXML(dmn13XML, function (err) {
        if (err) {
          return console.error("could not import DMN 1.1 diagram", err);
        }
        let activeEditor = dmnModeler.getActiveViewer();
        let canvas = activeEditor.get("canvas");
        canvas.zoom("fit-viewport");
        let element = canvas.getRootElement();
        let eventBus = activeEditor.get("eventBus");
        eventBus.on("drillDown.click", (event) => {
          setWidth(0);
        });
        updateTabs({
          element,
        });
        eventBus.on("element.click", (event) => {
          const { element } = event;
          setSelectedElement(element);
          updateTabs(event);
        });
        eventBus.on("commandStack.shape.replace.postExecuted", (event) => {
          updateTabs({
            element: event && event.context && event.context.newShape,
          });
        });
        eventBus.on("shape.removed", () => {
          let element = canvas.getRootElement();
          updateTabs({
            element,
          });
        });
      });
    },
    [updateTabs]
  );

  const newBpmnDiagram = React.useCallback(
    (rec) => {
      const diagram = rec || defaultDMNDiagram;
      openDiagram(diagram);
    },
    [openDiagram]
  );

  const fetchDiagram = React.useCallback(
    async (id, setWkf) => {
      if (id) {
        let res = await Service.fetchId(
          "com.axelor.apps.bpm.db.WkfDmnModel",
          id
        );
        const wkf = (res && res.data && res.data[0]) || {};
        let { diagramXml } = wkf;
        setWkf(wkf);
        newBpmnDiagram(diagramXml);
      } else {
        newBpmnDiagram();
      }
    },
    [newBpmnDiagram]
  );

  const uploadFile = (e) => {
    let files = e.target.files;
    let reader = new FileReader();
    if (files && files[0] && files[0].name && !files[0].name.includes(".dmn")) {
      handleSnackbarClick("error", "Upload dmn files only");
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
    setDrawerOpen(width === "0px" ? false : true);
  };

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
            onSave={onSave}
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
          propertiesCustomProviderModule,
        ],
        keyboard: { bindTo: document },
      },
      container: "#canvas",
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    });

    let id = fetchId();
    fetchDiagram(id, setWkfModel);
  }, [fetchDiagram]);

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
                  <Tab label="General" data-tab="General" />
                </Tabs>
                <React.Fragment>
                  {tabs &&
                    tabs[tabValue] &&
                    tabs[tabValue].groups &&
                    tabs[tabValue].groups.map((group, index) => (
                      <TabPanel key={index} group={group} index={index} />
                    ))}
                </React.Fragment>
                <div id="properties" style={{ display: "none" }}></div>
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

export default DMNModeler;
