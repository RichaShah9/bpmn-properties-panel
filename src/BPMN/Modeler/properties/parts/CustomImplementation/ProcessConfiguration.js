import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { makeStyles } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Button,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
} from "@material-ui/core";
import { Add, Edit, Close, ReportProblem } from "@material-ui/icons";

import Select from "../../../../../components/Select";
import { TextField, Checkbox, FieldEditor } from "../../components";
import {
  getMetaModels,
  getCustomModels,
  getProcessConfigModel,
  getMetaFields,
} from "../../../../../services/api";
import { translate, getBool } from "../../../../../utils";

const useStyles = makeStyles((theme) => ({
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
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
  button: {
    textTransform: "none",
  },
  tableCell: {
    padding: "3px !important",
  },
  tableHead: {
    padding: "3px !important",
    fontWeight: "bolder",
    color: "#666",
    margin: "3px 0px",
  },
  attributes: {
    fontWeight: "bolder",
    color: "#666",
    margin: "3px 0px",
  },
  iconButton: {
    margin: "5px 0px 5px 5px",
    borderRadius: 0,
    border: "1px solid #ccc",
    padding: 2,
    width: "fit-content",
  },
  typography: {
    display: "flex",
    alignItems: "center",
    color: "inherit",
  },
  textFieldLabel: {
    marginBottom: 0,
  },
  textFieldRoot: {
    marginTop: 0,
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  reportTypography: {
    display: "flex",
    alignItems: "center",
    color: "#999",
    margin: "10px 0px",
  },
  icon: {
    marginRight: 10,
  },
  newIcon: {
    color: "#58B423",
    cursor: "pointer",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  clearClassName: {
    paddingLeft: 10,
  },
}));

const initialProcessConfigList = {
  isStartModel: "false",
  metaJsonModel: null,
  metaJsonName: null,
  metaModelName: null,
  metaModelFullName: null,
  metaModel: null,
  model: null,
  pathCondition: null,
  processPath: null,
  userDefaultPath: null,
};

function getProcessConfig(element) {
  let bo = getBusinessObject(element);
  if ((element && element.type) === "bpmn:Participant") {
    bo = getBusinessObject(bo.processRef);
  }
  const extensionElements = bo.extensionElements;
  if (!extensionElements || !extensionElements.values) return null;
  const processConfigurations = extensionElements.values.find(
    (e) => e.$type === "camunda:ProcessConfiguration"
  );
  return processConfigurations;
}

function createElement(type, parent, factory, properties) {
  return elementHelper.createElement(type, properties, parent, factory);
}

function createProcessConfiguration(parent, bpmnFactory, properties) {
  return createElement(
    "camunda:ProcessConfiguration",
    parent,
    bpmnFactory,
    properties
  );
}

export default function ProcessConfiguration({
  element,
  index,
  label,
  bpmnFactory,
}) {
  const classes = useStyles();
  const [processConfigList, setProcessConfigList] = useState(null);
  const [openProcessPathDialog, setOpenProcessDialog] = useState(false);
  const [startModel, setStartModel] = useState(null);
  const [selectedProcessConfig, setSelectedProcessConfig] = useState(null);

  const getProcessConfigList = React.useCallback(
    (field = "processConfigurationParameters") => {
      const processConfiguration = getProcessConfig(element);
      const processConfigurations =
        processConfiguration && processConfiguration[field];
      return processConfigurations;
    },
    [element]
  );

  const getProcessConfigs = React.useCallback(() => {
    const entries = getProcessConfigList();
    if (entries) {
      return entries;
    }
    return [];
  }, [getProcessConfigList]);

  const updateElement = (value, label, optionIndex) => {
    let entries = getProcessConfigList();
    if (!entries) return;
    const entry = entries[optionIndex];
    if (entry) {
      entry[label] = value;
    }
  };

  const newElement = function (
    type,
    prop,
    element,
    extensionElements,
    bpmnFactory
  ) {
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant") {
      bo = getBusinessObject(bo.processRef);
    }
    if (!extensionElements) {
      extensionElements = elementHelper.createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory
      );
      bo.extensionElements = extensionElements;
    }

    let processConfigurations = getProcessConfig(element);
    if (!processConfigurations) {
      let parent = bo.extensionElements;
      processConfigurations = createProcessConfiguration(parent, bpmnFactory, {
        processConfigurationParameters: [],
      });
      let newElem = createParameter(
        prop,
        processConfigurations,
        bpmnFactory,
        {}
      );
      newElem.isStartModel = "false";
      processConfigurations[type] = [newElem];
      bo.extensionElements.values.push(processConfigurations);
    }
  };

  function createParameter(type, parent, bpmnFactory, properties) {
    return createElement(type, parent, bpmnFactory, properties);
  }

  const addElement = (parameterType, type) => {
    let bo = getBusinessObject(element);
    if ((element && element.type) === "bpmn:Participant") {
      bo = getBusinessObject(bo.processRef);
    }
    const extensionElements = bo.extensionElements;
    if (extensionElements && extensionElements.values) {
      const processConfigurations = extensionElements.values.find(
        (e) => e.$type === "camunda:ProcessConfiguration"
      );
      if (!processConfigurations) {
        newElement(
          parameterType,
          type,
          element,
          bo.extensionElements,
          bpmnFactory
        );
      } else {
        let newElem = createParameter(
          type,
          processConfigurations,
          bpmnFactory,
          {}
        );
        newElem.isStartModel = "false";
        if (
          !processConfigurations[parameterType] ||
          processConfigurations[parameterType].length === 0
        ) {
          processConfigurations[parameterType] = [newElem];
        } else {
          processConfigurations[parameterType].push(newElem);
        }
      }
    } else {
      newElement(
        parameterType,
        type,
        element,
        bo.extensionElements,
        bpmnFactory
      );
    }
  };

  const removeElement = (optionIndex) => {
    let processConfigList = getProcessConfigList();
    if (optionIndex < 0) return;
    processConfigList.splice(optionIndex, 1);
    if (processConfigList.length === 0) {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo.processRef);
      }
      const extensionElements = bo.extensionElements;
      if (!extensionElements || !extensionElements.values) return null;
      const processConfigurationsIndex = extensionElements.values.findIndex(
        (e) => e.$type === "camunda:ProcessConfiguration"
      );
      if (processConfigurationsIndex < 0) return;
      if (extensionElements && extensionElements.values) {
        extensionElements.values.splice(processConfigurationsIndex, 1);
        if (extensionElements.values.length === 0) {
          bo.extensionElements = undefined;
        }
      }
    }
  };

  const addItems = () => {
    const cloneProcessConfigList = [...(processConfigList || [])];
    cloneProcessConfigList.push({ ...initialProcessConfigList });
    setProcessConfigList(cloneProcessConfigList);
    addElement(
      "processConfigurationParameters",
      "camunda:ProcessConfigurationParameter"
    );
  };

  const removeItem = (index) => {
    const cloneProcessConfigList = [...(processConfigList || [])];
    cloneProcessConfigList.splice(index, 1);
    setProcessConfigList(cloneProcessConfigList);
  };

  const updateValue = async (
    value,
    name,
    label,
    index,
    optionLabel,
    valueLabel
  ) => {
    const cloneProcessConfigList = [...(processConfigList || [])];
    cloneProcessConfigList[index] = {
      ...(cloneProcessConfigList[index] || {}),
      [name]: (value && value[optionLabel]) || value,
    };
    if (name === "metaModel") {
      cloneProcessConfigList[index][`${name}FullName`] =
        value && value.fullName;
    }
    let model = "";
    if (name === "metaModel" || name === "metaJsonModel") {
      cloneProcessConfigList[index][`${name}Label`] = value
        ? `${valueLabel || ""} (${value[optionLabel]})`
        : undefined;

      model = await getProcessConfigModel({
        ...cloneProcessConfigList[index],
        [name === "metaModel" ? "metaJsonModel" : "metaModel"]: null,
      });
      cloneProcessConfigList[index] = {
        ...(cloneProcessConfigList[index] || {}),
        [name === "metaModel" ? "metaJsonModel" : "metaModel"]: null,
        model: model,
      };
      updateElement(
        undefined,
        `${name === "metaModel" ? "metaJsonModel" : "metaModel"}`,
        index
      );
      updateElement(model, "model", index);
    }
    updateElement((value && value[optionLabel]) || value, name, index);
    if (value) {
      updateElement(
        `${valueLabel || ""} (${value[optionLabel]})`,
        `${name}Label`,
        index
      );
      if (name === "metaModel") {
        updateElement(value.fullName, `${name}FullName`, index);
      }
    } else {
      updateElement(undefined, `${name}Label`, index);
    }
    setProcessConfigList(cloneProcessConfigList);
  };

  useEffect(() => {
    const processConfigList = getProcessConfigs();
    setProcessConfigList(processConfigList);
    let selectedProcessConfig;
    for (let i = 0; i < processConfigList.length; i++) {
      if (getBool(processConfigList[i].isStartModel)) {
        selectedProcessConfig = {
          processConfig: processConfigList[i],
          key: i,
        };
        setSelectedProcessConfig(selectedProcessConfig);
        return;
      }
    }
  }, [getProcessConfigs, element]);

  return (
    <div>
      <React.Fragment>
        {index > 0 && <div className={classes.divider} />}
      </React.Fragment>
      <div>
        <Grid container alignItems="center">
          <Grid item xs={6}>
            <div className={classes.groupLabel}>{label}</div>
          </Grid>
          <Grid item xs={6} style={{ textAlign: "right" }}>
            <Button
              className={classes.button}
              onClick={addItems}
              startIcon={<Add />}
            >
              New
            </Button>
          </Grid>
        </Grid>
        <Grid>
          {processConfigList && processConfigList.length > 0 && (
            <Typography className={classes.reportTypography}>
              <ReportProblem fontSize="small" className={classes.icon} />
              Must provide meta model or custom model
            </Typography>
          )}
          {processConfigList && processConfigList.length > 0 && (
            <TableContainer>
              <Table size="small" aria-label="a dense table">
                <colgroup>
                  <col width="23%" />
                  <col width="22%" />
                  <col width="15%" />
                  <col width="15%" />
                  <col width="5%" />
                  <col width="15%" />
                  <col width="5%" />
                </colgroup>
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.tableHead} align="center">
                      {translate("Meta model")}
                    </TableCell>
                    <TableCell className={classes.tableHead} align="center">
                      {translate("Custom model")}
                    </TableCell>
                    <TableCell className={classes.tableHead} align="center">
                      {translate("Process path")}
                    </TableCell>
                    <TableCell className={classes.tableHead} align="center">
                      {translate("Condition")}
                    </TableCell>
                    <TableCell className={classes.tableHead} align="center">
                      {translate("Start model ?")}
                    </TableCell>
                    <TableCell className={classes.tableHead} align="center">
                      {translate("User default path")}
                    </TableCell>
                    <TableCell
                      className={classes.tableHead}
                      align="center"
                    ></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processConfigList.map((processConfig, key) => (
                    <TableRow key={key}>
                      <TableCell className={classes.tableHead} align="center">
                        <Select
                          fetchMethod={() => getMetaModels()}
                          update={(value, label) => {
                            updateValue(
                              value,
                              "metaModel",
                              undefined,
                              key,
                              "name",
                              label
                            );
                          }}
                          name="metaModel"
                          value={processConfig.metaModelLabel}
                          isLabel={false}
                        />
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        <Select
                          fetchMethod={() => getCustomModels()}
                          update={(value, label) =>
                            updateValue(
                              value,
                              "metaJsonModel",
                              undefined,
                              key,
                              "name",
                              label
                            )
                          }
                          name="metaJsonModel"
                          value={processConfig.metaJsonModelLabel}
                          isLabel={false}
                        />
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        <div style={{ display: "flex" }}>
                          <TextField
                            element={element}
                            canRemove={true}
                            rootClass={classes.textFieldRoot}
                            labelClass={classes.textFieldLabel}
                            clearClassName={classes.clearClassName}
                            entry={{
                              id: `processPath_${key}`,
                              name: "processPath",
                              modelProperty: "processPath",
                              get: function () {
                                return {
                                  processPath: processConfig.processPath,
                                };
                              },
                              set: function (e, value) {
                                if (
                                  value.processPath !==
                                  processConfig.processPath
                                ) {
                                  updateValue(
                                    value.processPath === ""
                                      ? undefined
                                      : value.processPath,
                                    "processPath",
                                    undefined,
                                    key
                                  );
                                }
                              },
                            }}
                          />
                          {getBool(processConfig.isStartModel) && (
                            <Edit
                              className={classes.newIcon}
                              onClick={() => {
                                setOpenProcessDialog(true);
                                setStartModel(
                                  processConfig.metaModel
                                    ? {
                                        fullName:
                                          processConfig.metaModelFullName,
                                        name: processConfig.metaModel,
                                        type: "metaModel",
                                      }
                                    : processConfig.metaJsonModel
                                    ? {
                                        name: processConfig.metaJsonModel,
                                        type: "metaJsonModel",
                                      }
                                    : undefined
                                );
                                if (
                                  !selectedProcessConfig &&
                                  processConfig.isStartModel
                                ) {
                                  setSelectedProcessConfig({
                                    processConfig,
                                    key,
                                  });
                                }
                              }}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        <TextField
                          element={element}
                          canRemove={true}
                          rootClass={classes.textFieldRoot}
                          labelClass={classes.textFieldLabel}
                          entry={{
                            id: `pathCondition_${key}`,
                            name: "pathCondition",
                            modelProperty: "pathCondition",
                            get: function () {
                              return {
                                pathCondition: processConfig.pathCondition,
                              };
                            },
                            set: function (e, values) {
                              updateValue(
                                values.pathCondition,
                                "pathCondition",
                                undefined,
                                key
                              );
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        <Checkbox
                          className={classes.checkbox}
                          entry={{
                            id: `start-model-${key}`,
                            modelProperty: "isStartModel",
                            get: function () {
                              return {
                                isStartModel: getBool(
                                  processConfig.isStartModel
                                ),
                              };
                            },
                            set: function (e, values) {
                              updateValue(
                                !values.isStartModel,
                                "isStartModel",
                                undefined,
                                key
                              );
                            },
                          }}
                          element={element}
                        />
                      </TableCell>
                      <TableCell className={classes.tableHead} align="center">
                        <TextField
                          element={element}
                          canRemove={true}
                          rootClass={classes.textFieldRoot}
                          labelClass={classes.textFieldLabel}
                          entry={{
                            id: `userDefaultPath_${key}`,
                            name: "userDefaultPath",
                            modelProperty: "userDefaultPath",
                            get: function () {
                              return {
                                userDefaultPath: processConfig.userDefaultPath,
                              };
                            },
                            set: function (e, value) {
                              updateValue(
                                value.userDefaultPath,
                                "userDefaultPath",
                                undefined,
                                key
                              );
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" className={classes.tableCell}>
                        <IconButton
                          className={classes.iconButton}
                          onClick={() => {
                            removeItem(key);
                            removeElement(key);
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </div>
      <Dialog
        open={openProcessPathDialog}
        onClose={() => setOpenProcessDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        classes={{
          paper: classes.dialog,
        }}
      >
        <DialogTitle id="alert-dialog-title">Process Path</DialogTitle>
        <DialogContent>
          <FieldEditor
            getMetaFields={() => getMetaFields(startModel)}
            onChange={(val) => {
              updateValue(
                val,
                "processPath",
                undefined,
                selectedProcessConfig && selectedProcessConfig.key,
                "fieldName"
              );
            }}
            value={{
              fieldName:
                selectedProcessConfig &&
                selectedProcessConfig.processConfig &&
                selectedProcessConfig.processConfig.processPath,
            }}
            isParent={true}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenProcessDialog(false)}
            color="primary"
            autoFocus
            className={classes.save}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
