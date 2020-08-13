import React, { useState, useEffect } from "react";
import { is } from "bpmn-js/lib/util/ModelUtil";

import { TextField, CustomSelectBox } from "../../components";
import { translate } from "../../../../../utils";

export default function ErrorEventProps({
  element,
  bpmnFactory,
  errorEventDefinition,
  bpmnModdle,
  bpmnModeler,
}) {
  const [selectedError, setSelectedError] = useState(null);
  const [errorOptions, setErrorOptions] = useState([]);
  const [ele, setEle] = useState(null);

  const getValue = (modelProperty) => {
    return function (element) {
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
      if (!errorEventDefinition) return;
      errorEventDefinition["camunda:" + modelProperty] =
        values[modelProperty] || undefined;
    };
  };

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler &&
      bpmnModeler.get("canvas").getRootElement().businessObject.$parent
        .rootElements;
    const elements =
      rootElements && rootElements.filter((r) => r.$type === "bpmn:Error");
    const options =
      elements &&
      elements.map((element) => {
        return {
          value: element.name,
          name: `${element.name} (id=${element.id})`,
          id: element.id,
        };
      });
    setErrorOptions(options || []);
  }, [bpmnModeler]);

  useEffect(() => {
    if (!errorEventDefinition) return;
    let reference = errorEventDefinition.get("errorRef");
    setSelectedError(reference && reference.id);
  }, [errorEventDefinition]);

  useEffect(() => {
    getOptions();
  }, [getOptions]);

  return (
    <div>
      <CustomSelectBox
        element={element}
        definition={errorEventDefinition}
        bpmnFactory={bpmnFactory}
        bpmnModdle={bpmnModdle}
        bpmnModeler={bpmnModeler}
        defaultOptions={errorOptions}
        entry={{
          label: translate("Error"),
          elementName: "error",
          elementType: "bpmn:Error",
          referenceProperty: "errorRef",
          newElementIdPrefix: "Error_",
          set: function (value, ele) {
            setSelectedError(value);
            setEle(ele);
            if (errorEventDefinition && errorEventDefinition.errorRef) {
              errorEventDefinition.errorRef.name = ele.name;
            }
          },
          get: function () {
            return {
              errorRef: selectedError,
            };
          },
        }}
      />
      {(selectedError || selectedError === "") && (
        <React.Fragment>
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "error-element-name",
              label: translate("Error Name"),
              referenceProperty: "errorRef",
              modelProperty: "name",
              shouldValidate: true,
              get: function () {
                if (!errorEventDefinition) return;
                let reference = errorEventDefinition.get("errorRef");
                return {
                  name: reference && reference.name,
                };
              },
              set: function (e, value) {
                if (errorEventDefinition && errorEventDefinition.errorRef) {
                  errorEventDefinition.errorRef.name = value.name;
                  getOptions();
                  setSelectedError(ele && ele.id);
                }
              },
              validate: function (e, values) {
                if (!values.name && selectedError) {
                  return { name: "Must provide a value" };
                }
              },
            }}
          />
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "error-element-code",
              label: translate("Error Code"),
              referenceProperty: "errorRef",
              modelProperty: "errorCode",
              get: function () {
                if (!errorEventDefinition) return;
                let reference = errorEventDefinition.get("errorRef");
                return {
                  errorCode: reference && reference.errorCode,
                };
              },
              set: function (e, value) {
                if (!errorEventDefinition) return;
                let reference = errorEventDefinition.get("errorRef");
                if (reference) {
                  reference.errorCode = value.errorCode;
                }
              },
            }}
          />
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "error-element-message",
              label: translate("Error Message"),
              referenceProperty: "errorRef",
              modelProperty: "errorMessage",
              get: function () {
                if (!errorEventDefinition) return;
                let reference = errorEventDefinition.get("errorRef");
                return {
                  errorMessage: reference && reference.errorMessage,
                };
              },
              set: function (e, value) {
                if (!errorEventDefinition) return;
                let reference = errorEventDefinition.get("errorRef");
                if (reference) {
                  reference.errorMessage = value.errorMessage;
                }
              },
            }}
          />
          {is(element, "bpmn:StartEvent") ||
            (is(element, "bpmn:BoundaryEvent") && (
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
            ))}
        </React.Fragment>
      )}
    </div>
  );
}
