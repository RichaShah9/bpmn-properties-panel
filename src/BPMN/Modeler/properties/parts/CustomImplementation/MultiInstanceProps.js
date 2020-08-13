import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import ReportProblemIcon from "@material-ui/icons/ReportProblem";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { makeStyles } from "@material-ui/core/styles";

import { translate } from "../../../../../utils";
import { TextField } from "../../components";
import { Typography } from "@material-ui/core";

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
    border: "1px dotted #ccc",
  },
  typography: {
    display: "flex",
    alignItems: "center",
    color: "#CC3333",
  },
  icon: {
    marginRight: 10,
  },
});

function getProperty(element, propertyName) {
  let loopCharacteristics = getLoopCharacteristics(element);
  return loopCharacteristics && loopCharacteristics.get(propertyName);
}

function getBody(expression) {
  return expression && expression.get("body");
}

function getLoopCharacteristics(element) {
  let bo = getBusinessObject(element);
  return bo.loopCharacteristics;
}

function getLoopCardinality(element) {
  return getProperty(element, "loopCardinality");
}

function getLoopCardinalityValue(element) {
  let loopCardinality = getLoopCardinality(element);
  return getBody(loopCardinality);
}

function getCompletionCondition(element) {
  return getProperty(element, "completionCondition");
}

function getCompletionConditionValue(element) {
  let completionCondition = getCompletionCondition(element);
  return getBody(completionCondition);
}

function getCollection(element) {
  return getProperty(element, "camunda:collection");
}

function getElementVariable(element) {
  return getProperty(element, "camunda:elementVariable");
}

function createFormalExpression(parent, body, bpmnFactory) {
  return elementHelper.createElement(
    "bpmn:FormalExpression",
    { body: body },
    parent,
    bpmnFactory
  );
}

function updateFormalExpression(element, propertyName, newValue, bpmnFactory) {
  let loopCharacteristics = getLoopCharacteristics(element);
  if (!newValue) {
    loopCharacteristics[propertyName] = undefined;
    return;
  }
  let existingExpression = loopCharacteristics.get(propertyName);
  if (!existingExpression) {
    // add formal expression
    loopCharacteristics[propertyName] = createFormalExpression(
      loopCharacteristics,
      newValue,
      bpmnFactory
    );
    return;
  }
  // edit existing formal expression
  existingExpression.body = newValue;
  return;
}

function ensureMultiInstanceSupported(element) {
  let loopCharacteristics = getLoopCharacteristics(element);
  return (
    !!loopCharacteristics && is(loopCharacteristics, "camunda:Collectable")
  );
}

export default function MultiInstanceLoopCharacteristics({
  element,
  bpmnFactory,
  label,
  index,
}) {
  const [isVisible, setVisible] = useState(false);
  const [loopCardinality, setLoopCardinality] = useState(null);
  const [collection, setCollection] = useState(null);
  const classes = useStyles();

  useEffect(() => {
    if (ensureMultiInstanceSupported(element)) {
      setVisible(true);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        {!collection && !loopCardinality && (
          <Typography className={classes.typography}>
            <ReportProblemIcon fontSize="small" className={classes.icon} />
            Must provide either loop cardinality or collection
          </Typography>
        )}
        <TextField
          element={element}
          entry={{
            id: "multiInstance-loopCardinality",
            label: translate("Loop Cardinality"),
            modelProperty: "loopCardinality",
            get: function () {
              const loopCardinality = getLoopCardinalityValue(element);
              setLoopCardinality(loopCardinality);
              return {
                loopCardinality: loopCardinality,
              };
            },
            set: function (e, values) {
              setLoopCardinality(values.loopCardinality);
              return updateFormalExpression(
                element,
                "loopCardinality",
                values.loopCardinality,
                bpmnFactory
              );
            },
          }}
          canRemove={true}
        />
        <TextField
          element={element}
          entry={{
            id: "multiInstance-collection",
            label: translate("Collection"),
            modelProperty: "collection",
            get: function () {
              const collection = getCollection(element);
              setCollection(collection);
              return {
                collection: collection,
              };
            },
            set: function (e, values) {
              let loopCharacteristics = getLoopCharacteristics(element);
              if (!loopCharacteristics) return;
              setCollection(values.collection);
              loopCharacteristics.collection = values.collection;
              loopCharacteristics["camunda:collection"] =
                values.collection || undefined;
            },
            validate: function (element) {
              let collection = getCollection(element);
              let elementVariable = getElementVariable(element);
              if (!collection && elementVariable) {
                return { collection: "Must provide a value" };
              }
            },
          }}
          canRemove={true}
        />
        <TextField
          element={element}
          entry={{
            id: "multiInstance-elementVariable",
            label: translate("Element Variable"),
            modelProperty: "elementVariable",
            get: function (element) {
              return {
                elementVariable: getElementVariable(element),
              };
            },

            set: function (e, values) {
              let loopCharacteristics = getLoopCharacteristics(element);
              if (!loopCharacteristics) return;
              loopCharacteristics.elementVariable =
                values.elementVariable || undefined;
            },
          }}
          canRemove={true}
        />
        <TextField
          element={element}
          entry={{
            id: "multiInstance-completionCondition",
            label: translate("Completion Condition"),
            modelProperty: "completionCondition",
            get: function (element) {
              return {
                completionCondition: getCompletionConditionValue(element),
              };
            },

            set: function (element, values) {
              return updateFormalExpression(
                element,
                "completionCondition",
                values.completionCondition,
                bpmnFactory
              );
            },
          }}
          canRemove={true}
        />
      </div>
    )
  );
}
