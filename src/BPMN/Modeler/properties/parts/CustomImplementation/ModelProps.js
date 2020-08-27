import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import Select from "../../../../../components/Select";
import { getCustomModels, getMetaModels } from "../../../../../services/api";
import { translate } from "../../../../../utils";

const CONDITIONAL_SOURCES = [
  "bpmn:EventBasedGateway",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
  "bpmn:ParallelGateway",
  "bpmn:SequenceFlow",
  "label",
  "bpmn:IntermediateThrowEvent",
];

const TITLE_SOURCES = [
  "bpmn:Process",
  "bpmn:Participant",
  "bpmn:Collaboration",
  "bpmn:Group",
  "bpmn:SubProcess",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction",
  "bpmn:Task"
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
});

export default function ModelProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [metaModel, setMetaModel] = useState(null);
  const [metaJsonModel, setMetaJsonModel] = useState(null);
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
      setProperty(`${name}Id`, undefined);
      return;
    }
    setProperty(name, value[optionLabel]);
    setProperty(`${name}Id`, value.id);
  };

  const getSelectValue = React.useCallback(
    (name) => {
      let id = getProperty(`${name}Id`);
      let label = getProperty(`${name}Label`);
      let newName = getProperty(name);
      if (id) {
        let value = { id: id, name: newName };
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
    if (!isConditionalSource(element)) {
      setVisible(true);
    }
  }, [element]);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaJsonModel = getSelectValue("metaJsonModel");
    setMetaModel(metaModel);
    setMetaJsonModel(metaJsonModel);
  }, [getSelectValue]);

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
      </div>
    )
  );
}
