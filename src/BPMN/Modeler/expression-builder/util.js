import React from "react";

export function useDebounce(cb, duration) {
  const timer = React.useRef(null);

  const clearTimer = () => timer.current && clearTimeout(timer.current);
  const setTimer = (cb) => (timer.current = setTimeout(cb, duration));

  React.useEffect(() => {
    return () => clearTimer();
  }, []);

  return (...args) => {
    clearTimer();
    setTimer(() => cb(...args));
  };
}

export function isBPMQuery(type) {
  return type === "bpmQuery" ? true : false;
}

export function lowerCaseFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function getProcessConfig(element) {
  if (!element) return null;
  let bo = element && element.businessObject && element.businessObject.$parent;
  if (element && element.type === "bpmn:Process") {
    bo = element.businessObject;
  }
  if (
    (element && element.businessObject && element.businessObject.$type) ===
    "bpmn:Participant"
  ) {
    bo = element && element.businessObject && element.businessObject.processRef;
  }
  const extensionElements = bo && bo.extensionElements;
  const noOptions = {
    criteria: [
      {
        fieldName: "name",
        operator: "IN",
        value: [],
      },
    ],
  };
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
  let value = [...metaModels, ...metaJsonModels];
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

export const join_operator = {
  JS: ".",
  GROOVY: "?.",
  BPM: ".",
};
