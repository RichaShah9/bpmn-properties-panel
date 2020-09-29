import React, { useEffect, useState } from "react";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import { Textbox } from "../../components";
import { translate } from "../../../../../utils";

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
});

let CONDITIONAL_SOURCES = [
  "bpmn:Activity",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
];

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}

const conditionType = "script";

export default function ConditionalProps({
  element,
  index,
  label,
  bpmnFactory,
  bpmnModeler,
}) {
  const [isVisible, setVisible] = useState(false);
  const classes = useStyles();

  useEffect(() => {
    if (
      is(element, "bpmn:SequenceFlow") &&
      isConditionalSource(element.source)
    ) {
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
        <Textbox
          element={element}
          rows={3}
          entry={{
            id: "script",
            label: translate("Script"),
            modelProperty: "script",
            get: function () {
              let bo = getBusinessObject(element);
              if (bo.conditionExpression && bo.conditionExpression.body) {
                return { script: bo.conditionExpression.body };
              }
            },
            set: function (e, values) {
              if (
                element.businessObject &&
                element.businessObject.conditionExpression
              ) {
                element.businessObject.conditionExpression.body = values.script
                  ? values.script
                  : undefined;
                element.businessObject.conditionExpression.resource = undefined;
                element.businessObject.conditionExpression.language = "axelor";
                let conditionOrConditionExpression;
                let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
                  element
                );
                if (conditionalEventDefinition) {
                  element.businessObject.condition = conditionOrConditionExpression;
                } else {
                  element.businessObject.conditionExpression = conditionOrConditionExpression;
                  if (conditionOrConditionExpression) {
                    element.businessObject.conditionExpression.body =
                      values.script;
                    element.businessObject.conditionExpression.resource = undefined;
                    element.businessObject.conditionExpression.language =
                      "axelor";
                  }
                }
                let bo = getBusinessObject(element);
                if (!bpmnModeler) return;
                let elementRegistry = bpmnModeler.get("elementRegistry");
                let modeling = bpmnModeler.get("modeling");
                let shape = elementRegistry.get(element.id);
                if (!shape) return;
                if (CONDITIONAL_SOURCES.includes(bo.sourceRef.$type)) return;
                modeling &&
                  modeling.updateProperties(shape, {
                    [conditionalEventDefinition
                      ? "condition"
                      : "conditionExpression"]: conditionOrConditionExpression,
                  });
              } else {
                let conditionOrConditionExpression;
                let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
                  element
                );
                let bo = getBusinessObject(element);
                if (values.script && values.script !== "" && conditionType) {
                  const conditionProps = {
                    body: "",
                    language: "",
                    "camunda:resource": undefined,
                  };
                  conditionOrConditionExpression = elementHelper.createElement(
                    "bpmn:FormalExpression",
                    conditionProps,
                    conditionalEventDefinition || bo,
                    bpmnFactory
                  );

                  let source = element.source;

                  // if default-flow, remove default-property from source
                  if (source && source.businessObject.default === bo) {
                    source.default = undefined;
                  }
                }

                if (conditionalEventDefinition) {
                  element.businessObject.condition = conditionOrConditionExpression;
                } else {
                  element.businessObject.conditionExpression = conditionOrConditionExpression;
                  if (conditionOrConditionExpression) {
                    element.businessObject.conditionExpression.body =
                      values.script;
                    element.businessObject.conditionExpression.resource = undefined;
                    element.businessObject.conditionExpression.language =
                      "axelor";
                  }
                }

                if (!bpmnModeler) return;
                let elementRegistry = bpmnModeler.get("elementRegistry");
                let modeling = bpmnModeler.get("modeling");
                let shape = elementRegistry.get(element.id);
                if (!shape) return;
                if (CONDITIONAL_SOURCES.includes(bo.sourceRef.$type)) return;
                modeling &&
                  modeling.updateProperties(shape, {
                    [conditionalEventDefinition
                      ? "condition"
                      : "conditionExpression"]: conditionOrConditionExpression,
                  });
              }
            },
          }}
        />
      </div>
    )
  );
}
