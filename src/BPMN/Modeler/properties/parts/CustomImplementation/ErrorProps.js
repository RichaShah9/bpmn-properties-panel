import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { is } from "bpmn-js/lib/util/ModelUtil";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";

import { CustomSelectBox, TextField } from "../../components";
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
    border: "1px dotted #ccc",
  },
});

let errorEvents = ["bpmn:StartEvent", "bpmn:BoundaryEvent", "bpmn:EndEvent"];

export default function ErrorProps({ element, index, label, bpmnFactory }) {
  const [isVisible, setVisible] = useState(false);
  const [isCatchingErrorEvent, setIsCatchingErrorEvent] = useState(false);
  const classes = useStyles();

  const getValue = (modelProperty) => {
    return function (element) {
      let errorEventDefinition = eventDefinitionHelper.getErrorEventDefinition(
        element
      );
      let modelPropertyValue = errorEventDefinition.get(
        "camunda:" + modelProperty
      );
      let value = {};

      value[modelProperty] = modelPropertyValue;
      return value;
    };
  };

  const setValue = (modelProperty) => {
    return function (element, values) {
      let props = {};

      props["camunda:" + modelProperty] = values[modelProperty] || undefined;

      // return cmdHelper.updateBusinessObject(
      //   element,
      //   errorEventDefinition,
      //   props
      // );
    };
  };

  useEffect(() => {
    errorEvents.forEach((event) => {
      if (is(element, event)) {
        let errorEventDefinition = eventDefinitionHelper.getErrorEventDefinition(
          element
        );
        if (errorEventDefinition) {
          let isCatchingErrorEvent =
            is(element, "bpmn:StartEvent") || is(element, "bpmn:BoundaryEvent");
          setIsCatchingErrorEvent(isCatchingErrorEvent);
          setVisible(true);
        }
      }
    });
  });
  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <CustomSelectBox
          element={element}
          bpmnFactory={bpmnFactory}
          definition={element && eventDefinitionHelper.getErrorEventDefinition(element)}
          entry={{
            label: translate("Error"),
            elementName: "error",
            elementType: "bpmn:Error",
            referenceProperty: "errorRef",
            newElementIdPrefix: "Error_",
          }}
        />
        <TextField
          entry={{
            id: "error-element-name",
            label: translate("Error Name"),
            referenceProperty: "errorRef",
            modelProperty: "name",
            shouldValidate: true,
          }}
        />
        <TextField
          entry={{
            id: "error-element-code",
            label: translate("Error Code"),
            referenceProperty: "errorRef",
            modelProperty: "errorCode",
          }}
        />
        <TextField
          entry={{
            id: "error-element-message",
            label: translate("Error Message"),
            referenceProperty: "errorRef",
            modelProperty: "errorMessage",
          }}
        />
        {isCatchingErrorEvent && (
          <React.Fragment>
            <TextField
              element={element}
              entry={{
                id: "errorCodeVariable",
                label: translate("Error Code Variable"),
                modelProperty: "errorCodeVariable",
                get: getValue("errorCodeVariable"),
                set: setValue("errorCodeVariable"),
              }}
            />
            <TextField
              element={element}
              entry={{
                id: "errorMessageVariable",
                label: translate("Error Message Variable"),
                modelProperty: "errorMessageVariable",
                get: getValue("errorMessageVariable"),
                set: setValue("errorMessageVariable"),
              }}
            />
          </React.Fragment>
        )}
      </div>
    )
  );
}