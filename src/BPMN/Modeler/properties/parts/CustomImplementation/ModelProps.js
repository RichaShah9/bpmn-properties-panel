import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import Select from "../../../../../components/Select";
import { Checkbox } from "../../components";
import {
  getCustomModels,
  getMetaModels,
  getAllModels,
} from "../../../../../services/api";
import { translate, getBool } from "../../../../../utils";

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
];

const TITLE_SOURCES = [
  "bpmn:Process",
  "bpmn:Participant",
  "bpmn:Group",
  "bpmn:SubProcess",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction",
  "bpmn:Task",
  "bpmn:TextAnnotation",
];

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
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
  select: {
    margin: 0,
  },
  metajsonModel: {
    marginTop: 10,
  },
  allModels: {
    paddingBottom: 10,
  },
});

export default function ModelProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [metaModel, setMetaModel] = useState(null);
  const [metaJsonModel, setMetaJsonModel] = useState(null);
  const [displayOnAllModels, setDisplayOnAllModels] = useState(false);
  const [models, setModels] = useState([]);
  const [displayStatus, setDisplayStatus] = useState(false);
  const classes = useStyles();

  const subType =
    element.businessObject &&
    element.businessObject.eventDefinitions &&
    element.businessObject.eventDefinitions[0] &&
    element.businessObject.eventDefinitions[0].$type;

  const setProperty = (name, value) => {
    const bo = getBusinessObject(element);
    let propertyName = `camunda:${name}`;
    if (!bo) return;
    if (bo.$attrs) {
      bo.$attrs[propertyName] = value;
    } else {
      bo.$attrs = { [propertyName]: value };
    }
    if (!value) {
      delete bo.$attrs[propertyName];
    }
  };

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const updateValue = (name, value, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      setProperty(`${name}ModelName`, undefined);
      return;
    }
    setProperty(name, value[optionLabel]);
    setProperty(`${name}ModelName`, value["fullName"] || value["name"]);
  };

  const addModels = (values) => {
    const displayOnModels = [];
    if (Array.isArray(values)) {
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
    return () => {
      const bo = getBusinessObject(element);
      if (!bo || !bo.$attrs) return;
      if (bo.$attrs["camunda:displayOnAllModels"] === true) {
        delete bo.$attrs[`camunda:displayOnModels`];
      }
    };
  }, [element]);

  useEffect(() => {
    if (!isConditionalSource(element)) {
      setVisible(true);
    }
  }, [element]);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaJsonModel = getSelectValue("metaJsonModel");
    const displayOnAllModels = getProperty("displayOnAllModels");
    const displayOnModels = getProperty("displayOnModels");
    const displayStatus = getProperty("displayStatus");
    setDisplayOnAllModels(getBool(displayOnAllModels));
    setDisplayStatus(getBool(displayStatus));

    setMetaModel(metaModel);
    setMetaJsonModel(metaJsonModel);
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
  }, [getProperty, getSelectValue]);

  return (
    isVisible && (
      <div className={classes.root}>
        {(TITLE_SOURCES.includes(element.type) ||
          subType === "bpmn:TerminateEventDefinition" ||
          (element.type === "bpmn:EndEvent" && !subType)) && (
          <React.Fragment>
            <React.Fragment>
              {index > 0 && <div className={classes.divider} />}
            </React.Fragment>
            <div className={classes.groupLabel}>{label}</div>
          </React.Fragment>
        )}
        {!["bpmn:Process", "bpmn:Participant"].includes((element && element.type)) && (
          <React.Fragment>
            <label className={classes.label}>{translate("Model")}</label>
            {!metaJsonModel && (
              <Select
                className={classes.select}
                fetchMethod={() => getMetaModels()}
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
                fetchMethod={() => getCustomModels()}
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
                setProperty("displayStatus", displayStatus);
                if (displayStatus === false) {
                  setDisplayOnAllModels(false);
                  setProperty("displayOnAllModels", false);
                  setModels([]);
                  addModels([]);
                }
              },
            }}
          />
          {displayStatus && (
            <React.Fragment>
              <Checkbox
                element={element}
                entry={{
                  id: "displayOnAllModels",
                  label: translate("Display on all models"),
                  modelProperty: "displayOnAllModels",
                  get: function () {
                    return {
                      displayOnAllModels: displayOnAllModels || false,
                    };
                  },
                  set: function (e, value) {
                    setDisplayOnAllModels(!value.displayOnAllModels);
                    setProperty(
                      "displayOnAllModels",
                      !value.displayOnAllModels
                    );
                  },
                }}
              />
              {!displayOnAllModels && (
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
                    fetchMethod={() => getAllModels()}
                    name="models"
                    value={models || []}
                    multiple={true}
                    isLabel={false}
                    optionLabel="name"
                  />
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      </div>
    )
  );
}
