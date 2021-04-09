import { VALUE_FROM } from "./constant";
import { lowerCaseFirstLetter } from "./utils";

const getTarget = (element) => {
  if (element.target) {
    return element.target.split(".").pop();
  }
  return null;
};

const getModelFieldValue = (fields) => {
  let modelFieldText = "";
  if (fields) {
    fields.forEach((field) => {
      if (field.name) {
        if (modelFieldText) {
          modelFieldText = `${modelFieldText}?.${field.name}`;
        } else {
          modelFieldText = `${field.name}`;
        }
      }
    });
  }
  return modelFieldText;
};

export function generateJson(data, currentJson, defaultFrom) {
  const jsonData = [];
  const getValue = (element) => {
    const { value, modelSubField } = element;
    const from = value ? value.from || defaultFrom : defaultFrom;
    let newValue = value?.selected;
    const modelFieldValue = getModelFieldValue(modelSubField);
    if (from === VALUE_FROM.CONTEXT) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.SOURCE) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (from === VALUE_FROM.SELF) {
      if (modelFieldValue) {
        newValue = { value: modelFieldValue };
      } else {
        newValue = null;
      }
    }
    if (
      [VALUE_FROM.PARENT].includes(from) &&
      newValue?.value &&
      typeof newValue?.value === "object"
    ) {
      const contextKey = lowerCaseFirstLetter(newValue.value.name);
      if (!modelFieldValue) {
        newValue = { value: contextKey };
      } else {
        newValue = { value: `${contextKey}?.${modelFieldValue}` };
      }
    }
    return newValue || null;
  };
  data.forEach((element) => {
    let { value, dataPath, type } = element;
    let newValue = { ...value };
    const { fields } = newValue || {};
    const modelTarget = getTarget(element);
    const targetModel = element.targetModel;
    const jsonTarget = element.jsonTarget;
    const jsonModel = element.jsonModel;
    if (typeof fields === "object" && fields) {
      newValue.fields = generateJson(value.fields, currentJson);
    }

    newValue.selected = getValue(element);

    if (newValue && !newValue.from) {
      newValue.from = defaultFrom;
    }
    if (
      !element.isRemoved &&
      newValue.selected &&
      ![undefined, null].includes(newValue.selected.value)
    ) {
      const record = {
        dataPath,
        type,
        target: modelTarget || undefined,
        targetModel: targetModel || undefined,
        jsonTarget: jsonTarget || undefined,
        value: newValue,
        name: element.name,
        jsonModel: jsonModel || undefined,
        modelSubField: element.modelSubField || undefined,
        sourceField: element.sourceField || undefined,
        selfField: element.selfField || undefined,
      };
      jsonData.push(JSON.parse(JSON.stringify(record)));
    }
  });
  return jsonData;
}

export function getAssignmentJson(jsonData = []) {
  let object = {};
  jsonData.forEach((item) => {
    const { other, ...rest } = item;
    object = { ...object, ...rest };
  });
  return object;
}
