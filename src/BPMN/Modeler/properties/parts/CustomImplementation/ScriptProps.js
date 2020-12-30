import React, { useEffect, useState } from "react";
import classnames from "classnames";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { Edit } from "@material-ui/icons";

import Select from "../../../../../components/Select";
import ExpressionBuilder from "../../../expression-builder";
import {
  getCustomModels,
  getMetaModels,
  getAllModels,
  getViews,
} from "../../../../../services/api";
import { TextField, Textbox, Checkbox } from "../../components";
import { translate, getBool } from "../../../../../utils";

const useStyles = makeStyles({
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
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  expressionBuilder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  newIcon: {
    color: "#58B423",
    marginLeft: 5,
  },
  new: {
    cursor: "pointer",
    marginTop: 18.6,
    display: "flex",
  },
  textbox: {
    width: "100%",
  },
  dialog: {
    minWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default function ScriptProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [isQuery, setQuery] = useState(false);
  const [metaModel, setMetaModel] = useState(null);
  const [metaJsonModel, setMetaJsonModel] = useState(null);
  const [models, setModels] = useState([]);
  const [displayStatus, setDisplayStatus] = useState(true);
  const [defaultForm, setDefaultForm] = useState(null);
  const [formViews, setFormViews] = useState(null);
  const [isDefaultFormVisible, setDefaultFormVisible] = useState(false);
  const [isReadOnly, setReadOnly] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const classes = useStyles();

  const openAlertDialog = () => {
    setAlert(true);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function getProcessConfig(type) {
    let bo =
      element && element.businessObject && element.businessObject.$parent;
    if (element.type === "bpmn:Process") {
      bo = element.businessObject;
    }
    if (
      (element && element.businessObject && element.businessObject.$type) ===
      "bpmn:Participant"
    ) {
      bo =
        element && element.businessObject && element.businessObject.processRef;
    }
    const noOptions = {
      criteria: [
        {
          fieldName: "name",
          operator: "IN",
          value: [],
        },
      ],
    };
    const extensionElements = bo && bo.extensionElements;
    if (!extensionElements || !extensionElements.values) return noOptions;
    const processConfigurations = extensionElements.values.find(
      (e) => e.$type === "camunda:ProcessConfiguration"
    );
    const metaModels = [],
      metaJsonModels = [];
    if (
      !processConfigurations &&
      !processConfigurations.processConfigurationParameters
    )
      return noOptions;
    processConfigurations.processConfigurationParameters.forEach((config) => {
      if (config.metaModel) {
        metaModels.push(config.metaModel);
      } else if (config.metaJsonModel) {
        metaJsonModels.push(config.metaJsonModel);
      }
    });

    let value = [];
    if (type === "metaModel") {
      value = [...metaModels];
    } else if (type === "metaJsonModel") {
      value = [...metaJsonModels];
    } else {
      value = [...metaModels, ...metaJsonModels];
    }
    const data = {
      criteria: [
        {
          fieldName: "name",
          operator: "IN",
          value: value,
        },
      ],
      operator: "or",
    };
    return data;
  }

  const setProperty = React.useCallback(
    (name, value) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo.processRef);
      }
      let propertyName = `camunda:${name}`;
      if (!bo) return;
      if (bo.$attrs) {
        bo.$attrs[propertyName] = value;
      } else {
        bo.$attrs = { [propertyName]: value };
      }
      if (value === undefined) {
        delete bo.$attrs[propertyName];
      }
    },
    [element]
  );

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo.processRef);
      }
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const getFormViews = React.useCallback(
    async (value, name) => {
      if (!value) return;
      const formViews = await getViews(
        name === "metaModel"
          ? { ...(value || {}), type: "metaModel" }
          : {
              ...(value || {}),
              type: "metaJsonModel",
            },
        []
      );
      setFormViews(formViews);
      if (formViews && (formViews.length === 1 || formViews.length === 0)) {
        setDefaultFormVisible(false);
        setProperty("defaultForm", formViews[0] && formViews[0]["name"]);
        return;
      }
      setDefaultFormVisible(true);
    },
    [setProperty]
  );

  const updateValue = (name, value, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      setProperty(`${name}ModelName`, undefined);
      setProperty("defaultForm", undefined);
      setDefaultForm(null);
      setDefaultFormVisible(false);
      return;
    }
    setProperty(name, value[optionLabel]);
    setProperty(`${name}ModelName`, value["fullName"] || value["name"]);
    getFormViews(value, name);
  };

  const addModels = (values) => {
    const displayOnModels = [];
    if (Array.isArray(values)) {
      if (values && values.length === 0) {
        setProperty("displayOnModels", undefined);
        return;
      }
      values &&
        values.forEach((value) => {
          if (!value) {
            setProperty("displayOnModels", undefined);
            return;
          }
          displayOnModels.push(value.name);
        });
    }
    if (displayOnModels.length > 0) {
      setProperty("displayOnModels", displayOnModels.toString());
    }
  };

  const getSelectValue = React.useCallback(
    (name) => {
      let label = getProperty(`${name}Label`);
      let newName = getProperty(name);
      if (newName) {
        let value = { name: newName };
        if (label) {
          value.title = label;
        }
        return value;
      } else {
        return null;
      }
    },
    [getProperty]
  );

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaModelName = getSelectValue("metaModelModelName");
    const metaJsonModel = getSelectValue("metaJsonModel");
    const displayOnModels = getProperty("displayOnModels");
    const displayStatus = getProperty("displayStatus");
    const defaultForm = getProperty("defaultForm");
    setDisplayStatus(getBool(displayStatus));
    setMetaModel(metaModel);
    setMetaJsonModel(metaJsonModel);
    setDefaultForm(defaultForm);
    const model = metaModel ? "metaModel" : "metaJsonModel";
    const value = metaModel
      ? { ...(metaModel || {}), fullName: metaModelName && metaModelName.name }
      : { ...(metaJsonModel || {}) };
    getFormViews(value, model);
    const models = [];
    if (displayOnModels) {
      const names = displayOnModels.split(",");
      names &&
        names.forEach((name) => {
          models.push({
            name: name,
          });
        });
      setModels(models);
    }
  }, [getProperty, getSelectValue, getFormViews]);

  useEffect(() => {
    const query = getProperty("query") || false;
    setQuery(getBool(query));
    setReadOnly(getBool(query));
  }, [getProperty]);

  useEffect(() => {
    if (is(element, "bpmn:ScriptTask")) {
      const bo = getBusinessObject(element);
      if (bo) {
        setVisible(true);
      }
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <Checkbox
          element={element}
          entry={{
            id: "query",
            label: translate("Query"),
            modelProperty: "query",
            widget: "checkbox",
            get: function () {
              return {
                query: isQuery,
              };
            },
            set: function (e, values) {
              let query = !values.query;
              if (!query) {
                element.businessObject.scriptFormat = "axelor";
                updateValue("metaModel", undefined);
                updateValue("metaJsonModel", undefined);
                setProperty("defaultForm", undefined);
                setProperty("displayStatus", undefined);
                setProperty("displayOnModels", undefined);
              }
              setProperty("query", query);
              setQuery(query);
              setReadOnly(query);
            },
          }}
        />
        <div className={classes.expressionBuilder}>
          <Textbox
            element={element}
            className={classes.textbox}
            rows={3}
            readOnly={isQuery && isReadOnly ? true : false}
            entry={{
              id: "script",
              label: translate("Script"),
              modelProperty: "script",
              get: function () {
                let bo = getBusinessObject(element);
                return { script: bo.get("script") };
              },
              set: function (e, values) {
                if (element.businessObject) {
                  element.businessObject.script = values.script;
                  element.businessObject.scriptFormat = "axelor";
                  element.businessObject.resource = undefined;
                  setProperty("scriptOperatorType", undefined);
                  setProperty("scriptValue", undefined);
                }
              },
              validate: function (e, values) {
                if (!values.script) {
                  return { script: "Must provide a value" };
                }
              },
            }}
          />
          {isQuery && (
            <div className={classes.new}>
              <Edit className={classes.newIcon} onClick={handleClickOpen} />
              <ExpressionBuilder
                open={open}
                handleClose={() => handleClose()}
                openAlertDialog={openAlertDialog}
                type="bpmQuery"
                getExpression={() => {
                  const value = getProperty("scriptValue");
                  const combinator = getBool(
                    getProperty("scriptOperatorType") || false
                  );
                  let values;
                  if (value !== undefined) {
                    try {
                      values = JSON.parse(value);
                    } catch (errror) {}
                  }
                  return { values: values, combinator };
                }}
                setProperty={(val) => {
                  const { expression, value, combinator } = val;
                  element.businessObject.script = expression;
                  if (
                    expression === "" ||
                    expression === null ||
                    expression === undefined
                  ) {
                    setProperty("scriptValue", undefined);
                    setProperty("scriptOperatorType", undefined);
                    return;
                  }
                  if (value) {
                    setProperty("scriptValue", value);
                  }
                  if (combinator) {
                    setProperty("scriptOperatorType", combinator);
                  }
                }}
                element={element}
                title="Add Query"
              />
              <Dialog
                open={openAlert}
                onClose={() => setAlert(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                classes={{
                  paper: classes.dialog,
                }}
              >
                <DialogTitle id="alert-dialog-title">
                  <label className={classes.title}>Error</label>
                </DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    Add all values
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => setAlert(false)}
                    color="primary"
                    autoFocus
                  >
                    Ok
                  </Button>
                </DialogActions>
              </Dialog>
            </div>
          )}
        </div>
        <TextField
          element={element}
          entry={{
            id: "scriptResultVariable",
            label: translate("Result Variable"),
            modelProperty: "scriptResultVariable",
            get: function () {
              let bo = getBusinessObject(element);
              let boResultVariable = bo.get("camunda:resultVariable");
              return { scriptResultVariable: boResultVariable };
            },
            set: function (e, values) {
              if (element.businessObject) {
                element.businessObject.resultVariable =
                  values.scriptResultVariable || undefined;
              }
            },
            validate: function (e, values) {
              if (!values.scriptResultVariable) {
                return { scriptResultVariable: "Must provide a value" };
              }
            },
          }}
          canRemove={true}
        />
        {!isQuery && (
          <React.Fragment>
            <label className={classes.label}>{translate("Model")}</label>
            {!metaJsonModel && (
              <Select
                className={classes.select}
                fetchMethod={() => getMetaModels(getProcessConfig("metaModel"))}
                update={(value) => {
                  setMetaModel(value);
                  updateValue("metaModel", value);
                }}
                name="metaModel"
                value={metaModel}
                optionLabel="name"
                isLabel={false}
                placeholder={translate("Model")}
              />
            )}
            {!metaModel && (
              <Select
                className={classnames(classes.select, classes.metajsonModel)}
                fetchMethod={() =>
                  getCustomModels(getProcessConfig("metaJsonModel"))
                }
                update={(value) => {
                  setMetaJsonModel(value);
                  updateValue("metaJsonModel", value);
                }}
                name="metaJsonModel"
                value={metaJsonModel}
                optionLabel="name"
                placeholder={translate("Custom model")}
                isLabel={false}
              />
            )}
            {isDefaultFormVisible && (
              <React.Fragment>
                <label className={classes.label}>
                  {translate("Default form")}
                </label>
                <Select
                  className={classes.select}
                  update={(value) => {
                    setDefaultForm(value);
                    setProperty("defaultForm", value ? value.name : undefined);
                  }}
                  options={formViews}
                  name="defaultForm"
                  value={defaultForm}
                  optionLabel="name"
                  label={translate("Default form")}
                  isLabel={false}
                />
              </React.Fragment>
            )}

            <div className={classes.container}>
              <Checkbox
                element={element}
                entry={{
                  id: "displayStatus",
                  label: translate("Display status"),
                  modelProperty: "displayStatus",
                  get: function () {
                    return {
                      displayStatus: displayStatus,
                    };
                  },
                  set: function (e, value) {
                    const displayStatus = !value.displayStatus;
                    setDisplayStatus(displayStatus);
                    setProperty("defaultForm", value ? value.name : undefined);
                    setProperty("displayStatus", displayStatus);
                    if (displayStatus === false) {
                      setModels([]);
                      addModels([]);
                    }
                  },
                }}
              />
              {displayStatus && (
                <React.Fragment>
                  <div className={classes.allModels}>
                    <label className={classes.label}>
                      {translate("Display on models")}
                    </label>
                    <Select
                      className={classes.select}
                      update={(value) => {
                        setModels(value);
                        addModels(value);
                      }}
                      fetchMethod={() => getAllModels(getProcessConfig())}
                      name="models"
                      value={models || []}
                      multiple={true}
                      isLabel={false}
                      optionLabel="name"
                    />
                  </div>
                </React.Fragment>
              )}
            </div>
          </React.Fragment>
        )}
      </div>
    )
  );
}
