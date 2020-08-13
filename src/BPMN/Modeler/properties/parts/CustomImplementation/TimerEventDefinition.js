import React, { useState } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";

import { TextField, SelectBox } from "../../components";
import { translate } from "../../../../../utils";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

const timerOptions = [
  { value: "timeDate", name: translate("Date") },
  { value: "timeDuration", name: translate("Duration") },
  { value: "timeCycle", name: translate("Cycle") },
];

function getTimerDefinitionType(timer) {
  if (!timer) {
    return;
  }

  let timeDate = timer.get("timeDate");
  if (typeof timeDate !== "undefined") {
    return "timeDate";
  }

  let timeCycle = timer.get("timeCycle");
  if (typeof timeCycle !== "undefined") {
    return "timeCycle";
  }

  let timeDuration = timer.get("timeDuration");
  if (typeof timeDuration !== "undefined") {
    return "timeDuration";
  }
}

function createFormalExpression(parent, body, bpmnFactory) {
  body = body || undefined;
  return elementHelper.createElement(
    "bpmn:FormalExpression",
    { body: body },
    parent,
    bpmnFactory
  );
}

export default function TimerEventProps({
  element,
  bpmnFactory,
  timerEventDefinition,
}) {
  const [timerDefinitionType, setTimerDefinitionType] = useState("");

  function createTimerEventDefinition(bo) {
    let eventDefinitions = bo.get("eventDefinitions") || [],
      timerEventDefinition = bpmnFactory.create("bpmn:TimerEventDefinition");
    eventDefinitions.push(timerEventDefinition);
    bo.eventDefinitions = eventDefinitions;
    return timerEventDefinition;
  }

  return (
    <div>
      <SelectBox
        element={element}
        entry={{
          id: "timer-event-definition-type",
          label: translate("Timer Definition Type"),
          selectOptions: timerOptions,
          emptyParameter: true,
          modelProperty: "timerDefinitionType",
          get: function () {
            let timerDefinition = timerEventDefinition;
            let timerDefinitionType =
              getTimerDefinitionType(timerDefinition) || "";
            setTimerDefinitionType(timerDefinitionType);
            return {
              timerDefinitionType: timerDefinitionType,
            };
          },
          set: function (e, values) {
            const bo = getBusinessObject(element);
            setTimerDefinitionType(values.timerDefinitionType);
            let props = {
              timeDuration: undefined,
              timeDate: undefined,
              timeCycle: undefined,
            };
            let timerDefinition = timerEventDefinition,
              newType = values.timerDefinitionType;
            if (
              !timerDefinition &&
              typeof createTimerEventDefinition === "function"
            ) {
              timerDefinition = createTimerEventDefinition(bo);
            }
            if (values.timerDefinitionType) {
              let oldType = getTimerDefinitionType(timerDefinition);

              let value;
              if (oldType) {
                let definition = timerDefinition.get(oldType);
                value = definition.get("body");
              }
              props[newType] = createFormalExpression(
                timerDefinition,
                value,
                bpmnFactory
              );
            }
            Object.entries(props).forEach(([key, value]) => {
              timerDefinition[key] = value;
            });
            bo.eventDefinitions = [timerDefinition];
          },
        }}
      />
      {(timerDefinitionType || timerDefinitionType !== "") && (
        <TextField
          element={element}
          canRemove={true}
          entry={{
            id: "timer-event-definition",
            label: translate("Timer Definition"),
            modelProperty: "timerDefinition",
            get: function (element, node) {
              let timerDefinition = timerEventDefinition,
                type = getTimerDefinitionType(timerDefinition),
                definition = type && timerDefinition.get(type),
                value = definition && definition.get("body");

              return {
                timerDefinition: value,
              };
            },
            set: function (element, values, node) {
              const bo = getBusinessObject(element);
              let timerDefinition = timerEventDefinition,
                type = getTimerDefinitionType(timerDefinition),
                definition = type && timerDefinition.get(type);

              if (definition) {
                definition.body = values.timerDefinition || undefined;
              }
              bo.eventDefinitions = [timerDefinition];
            },
            validate: function (e, values) {
              if (!values.timerDefinition && timerDefinitionType) {
                return { timerDefinition: "Must provide a value" };
              }
            },
          }}
        />
      )}
    </div>
  );
}
