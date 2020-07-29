import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import formHelper from "bpmn-js-properties-panel/lib/helper/FormHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";
import { Close } from "@material-ui/icons";

import TextField from "../properties/components/TextField";
import { translate } from "../../../utils";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
  extensionElements: {
    width: "100%",
  },
  remove: {
    top: "-23px !important",
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    borderBottom: "none",
    right: 23,
    display: "flex",
    alignItems: "center",
  },
  add: {
    top: "-23px !important",
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    borderBottom: "none",
    right: 0,
  },
  container: {
    position: "relative",
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
  fieldWrapper: {
    position: "relative",
  },
  input: {
    width: "calc(100% - 35px)",
    padding: "3px 28px 3px 6px ",
    border: "1px solid #ccc",
  },
  clearButton: {
    background: "transparent",
    border: "none",
    top: 0,
    right: 0,
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  clear: {
    fontSize: "1rem",
  },
});

const TYPES = [
  { name: "string", value: "string" },
  { name: "long", value: "long" },
  { name: "boolean", value: "boolean" },
  { name: "date", value: "date" },
  { name: "enum", value: "enum" },
  { name: "custom", value: "custom" },
];

export default function Forms({ element, id, bpmnFactory }) {
  const classes = useStyles();
  const [options, setOptions] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [formFieldId, setFormFieldId] = useState(null);
  const [label, setLabel] = useState(null);
  const [type, setType] = useState(null);
  const [defaultValue, setDefaultValue] = useState(null);
  const [customType, setCustomType] = useState(null);

  const isCustomType = (type) => {
    return TYPES.find((t) => t.value === type);
  };
  const addElement = () => {
    let bo = getBusinessObject(element);
    let prefix = "FormField_";
    let id = utils.nextId(prefix);
    let option = createExtensionElement(bo.extensionElements, id);
    setOptions([...(options || []), option]);
    setSelectedOption(option);
    if (!option) return;
    setFormFieldId(option.id);
    if (option.type) {
      if (!isCustomType(option.type)) {
        setType(option.type);
      } else {
        setCustomType(option.type);
      }
    }
    setLabel(option.label);
    setDefaultValue(option.defaultValue);
  };

  const selectElement = (e) => {
    const option = options.find((opt) => opt.id === e.target.value);
    setSelectedOption(option);
    if (!option) return;
    setFormFieldId(option.id);
    if (option.type) {
      if (!isCustomType(option.type)) {
        setType(option.type);
      } else {
        setCustomType(option.type);
      }
    }
    setLabel(option.label);
    setDefaultValue(option.defaultValue);
  };

  const removeElement = () => {
    const cloneOptions = [...(options || [])];
    const optionIndex = cloneOptions.findIndex(
      (opt) => opt.id === selectedOption.id
    );
    cloneOptions.splice(optionIndex, 1);
    setOptions(cloneOptions);
  };

  function createExtensionElement(extensionElements, value) {
    let bo = getBusinessObject(element);
    if (!extensionElements) {
      extensionElements = elementHelper.createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory
      );
      element.businessObject.extensionElements = extensionElements;
    }
    let formData = formHelper.getFormData(element);
    if (!formData) {
      formData = elementHelper.createElement(
        "camunda:FormData",
        { fields: [] },
        extensionElements,
        bpmnFactory
      );
      element.businessObject.extensionElements &&
        element.businessObject.extensionElements.values.push(formData);
    }
    let field = elementHelper.createElement(
      "camunda:FormField",
      { id: value },
      formData,
      bpmnFactory
    );
    if (typeof formData.fields !== "undefined") {
      formData.fields && formData.fields.push(field);
    } else {
      formData = {
        ...formData,
        fields: [field],
      };
    }
    return field;
  }

  // function removeExtensionElement(element, extensionElements, value, idx) {
  //   let formData = getExtensionElements(
  //       getBusinessObject(element),
  //       "camunda:FormData"
  //     )[0],
  //     entry = formData.fields[idx],
  //     commands = [];

  //   if (formData.fields.length < 2) {
  //     commands.push(removeEntry(getBusinessObject(element), element, formData));
  //   } else {
  //     commands.push(
  //       cmdHelper.removeElementsFromList(element, formData, "fields", null, [
  //         entry,
  //       ])
  //     );

  //     if (entry.id === formData.get("businessKey")) {
  //       commands.push(
  //         cmdHelper.updateBusinessObject(element, formData, {
  //           businessKey: undefined,
  //         })
  //       );
  //     }
  //   }
  //   return commands;
  // }

  function getExtensionElements(element) {
    return formHelper.getFormFields(element);
  }

  const updateOptions = (property, formField, e) => {
    const cloneOptions = [...options];
    let optionIndex = cloneOptions.findIndex((opt) => opt.id === formField.id);
    cloneOptions[optionIndex] = {
      ...(cloneOptions[optionIndex] || {}),
      [property]: e.target.value,
    };
    setOptions(cloneOptions);
  };

  function getBusinessKey() {
    let result = { businessKey: "" };
    let formData = getExtensionElements(getBusinessObject(element));
    if (formData) {
      let storedValue = formData["businessKey"];
      result = storedValue;
    }
    return result;
  }

  const getSelectedFormField = () => {
    if (!selectedOption) return;
    const formField = selectedOption;
    const extensionElement = getExtensionElements(getBusinessObject(element));
    let fieldIndex =
      extensionElement &&
      extensionElement.findIndex((e) => e.id === formField.id);
    let formData = getExtensionElements(
      getBusinessObject(element),
      "camunda:FormData"
    );
    return { formData, fieldIndex };
  };

  useEffect(() => {
    let bo = getBusinessObject(element);
    let formDataExtension = getExtensionElements(bo, "camunda:FormData");
    setOptions(formDataExtension);
    if (formDataExtension && formDataExtension.length > 0) {
      setSelectedOption(formDataExtension[0]);
      setFormFieldId(formDataExtension[0].id);
      if (formDataExtension[0].type) {
        if (!isCustomType(formDataExtension[0].type)) {
          setType(formDataExtension[0].type);
        } else {
          setCustomType(formDataExtension[0].type);
        }
      }
      setLabel(formDataExtension[0].label);
      setDefaultValue(formDataExtension[0].defaultValue);
    }
  }, [element]);

  return (
    <div>
      <TextField
        element={element}
        entry={{
          id: "form-key",
          label: translate("Form Key"),
          modelProperty: "formKey",
          widget: "textField",
          get: function (element, node) {
            let bo = getBusinessObject(element);
            return {
              formKey: bo.get("camunda:formKey"),
            };
          },
          set: function (element, values, node) {
            if (values.formKey) {
              let bo = getBusinessObject(element),
                formKey = values.formKey || undefined;
              bo.formKey = formKey;
            }
          },
        }}
      />
      <div className={classes.root}>
        <div>
          <label
            htmlFor={`cam-extensionElements-${id}`}
            className={classes.label}
          >
            {translate("Form Fields")}
          </label>
          <div className={classes.container}>
            <select
              id={`cam-extensionElements-form-fields`}
              className={classes.extensionElements}
              name="selectedExtensionElement"
              size={5}
              data-list-entry-container
              value={(selectedOption && selectedOption.id) || ""}
              onChange={selectElement}
            >
              {options &&
                options.length > 0 &&
                options.map((option) => (
                  <option key={option.id}>{option.id}</option>
                ))}
            </select>
            <button
              className={classes.add}
              id={`cam-extensionElements-create-${id}`}
              onClick={addElement}
            >
              <span>+</span>
            </button>
            <button
              className={classes.remove}
              id={`cam-extensionElements-remove-${id}`}
              onClick={removeElement}
            >
              <Close className={classes.clear} />
            </button>
          </div>
        </div>
      </div>
      {options && options.length > 0 && (
        <React.Fragment>
          <div className={classes.root}>
            <label htmlFor={`camunda-business-key`} className={classes.label}>
              {translate("Business Key")}
            </label>
            <select
              id={`form-business-key`}
              name={"businessKey"}
              onChange={(e) => {
                let formData = formHelper.getFormData(element);
                formData.businessKey = e.target.value || undefined;
              }}
              defaultValue={getBusinessKey()}
            >
              <option value=""></option>
              {options &&
                options.map((opt, index) => (
                  <option value={opt.id} key={index}>
                    {opt.id}
                  </option>
                ))}
            </select>
          </div>
          <div className={classes.root}>
            <div className={classes.groupLabel}>Form Field</div>
            <div className={classes.root}>
              <label className={classes.label}>{translate("ID")}</label>
              <div className={classes.fieldWrapper}>
                <input
                  id="form-field-id"
                  type="text"
                  name="id"
                  value={formFieldId || ""}
                  className={classes.input}
                  onChange={(e) => setFormFieldId(e.target.value)}
                  onBlur={(e) => {
                    const formField = selectedOption;
                    const extensionElement = getExtensionElements(
                      getBusinessObject(element)
                    );
                    let fieldIndex =
                      extensionElement &&
                      extensionElement.findIndex((e) => e.id === formField.id);
                    let formData = getExtensionElements(
                      getBusinessObject(element),
                      "camunda:FormData"
                    );
                    formData[fieldIndex].id = e.target.value;
                    updateOptions("id", formField, e);
                  }}
                />
                {formFieldId && (
                  <button
                    onClick={() => {
                      setFormFieldId(null);
                    }}
                    className={classes.clearButton}
                  >
                    <Close className={classes.clear} />
                  </button>
                )}
              </div>
              <div className={classes.root}>
                <label
                  htmlFor={`camunda-business-type`}
                  className={classes.label}
                >
                  {translate("Type")}
                </label>
                <select
                  id={`form-field-type-${selectedOption && selectedOption.id}`}
                  name="type"
                  onChange={(e) => {
                    let { formData, fieldIndex } = getSelectedFormField();
                    if (
                      e.target.value !== "enum" &&
                      selectedOption &&
                      selectedOption.type === "enum"
                    ) {
                      // delete camunda:value objects from formField.values when switching from type enum
                      formData[fieldIndex].values = undefined;
                    }
                    if (
                      e.target.value === "boolean" &&
                      selectedOption.id === formData.businessKey
                    ) {
                      formData.businessKey = undefined;
                    }
                    setType(e.target.value);
                    if (e.target.value === "custom") return;
                    formData[fieldIndex].type = e.target.value;
                  }}
                  value={type || ""}
                >
                  <option value=""></option>
                  {TYPES.map((opt, index) => (
                    <option value={opt.value} key={index}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              {type === "custom" && (
                <div className={classes.root}>
                  <div className={classes.fieldWrapper}>
                    <input
                      id="form-custom-input"
                      type="text"
                      name="type"
                      value={customType || ""}
                      className={classes.input}
                      onChange={(e) => setCustomType(e.target.value)}
                      onBlur={(e) => {
                        let { formData, fieldIndex } = getSelectedFormField();
                        formData[fieldIndex].type = e.target.value;
                      }}
                    />
                    {label && (
                      <button
                        onClick={() => {
                          setLabel(null);
                        }}
                        className={classes.clearButton}
                      >
                        <Close className={classes.clear} />
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className={classes.root}>
                <label className={classes.label}>{translate("Label")}</label>
                <div className={classes.fieldWrapper}>
                  <input
                    id="form-field-label"
                    type="text"
                    name="label"
                    value={label || ""}
                    className={classes.input}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={(e) => {
                      let { formData, fieldIndex } = getSelectedFormField();
                      formData[fieldIndex].label = e.target.value;
                    }}
                  />
                  {label && (
                    <button
                      onClick={() => {
                        setLabel(null);
                      }}
                      className={classes.clearButton}
                    >
                      <Close className={classes.clear} />
                    </button>
                  )}
                </div>
              </div>
              <div className={classes.root}>
                <label className={classes.label}>
                  {translate("Default Value")}
                </label>
                <div className={classes.fieldWrapper}>
                  <input
                    id="form-field-defaultValue"
                    type="text"
                    name="defaultValue"
                    value={defaultValue || ""}
                    className={classes.input}
                    onChange={(e) => setDefaultValue(e.target.value)}
                    onBlur={(e) => {
                      let { formData, fieldIndex } = getSelectedFormField();
                      formData[fieldIndex].defaultValue = e.target.value;
                    }}
                  />
                  {defaultValue && (
                    <button
                      onClick={() => {
                        setDefaultValue(null);
                      }}
                      className={classes.clearButton}
                    >
                      <Close className={classes.clear} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
