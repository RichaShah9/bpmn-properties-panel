import React, { useState, useEffect } from "react";
import formHelper from "bpmn-js-properties-panel/lib/helper/FormHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";
import _ from "lodash";
import { Close } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Table from "../properties/components/Table";
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

function generateId(prefix) {
  return utils.nextId(prefix);
}

export default function Forms({ element, id, bpmnFactory, createParent }) {
  const classes = useStyles();
  const [options, setOptions] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [formFieldId, setFormFieldId] = useState(null);
  const [label, setLabel] = useState(null);
  const [type, setType] = useState(null);
  const [defaultValue, setDefaultValue] = useState(null);
  const [customType, setCustomType] = useState(null);

  const isType = (type) => {
    return TYPES.findIndex((t) => t.value === type);
  };

  const addElement = () => {
    let bo = getBusinessObject(element);
    let id = generateId("FormField_");
    let option = createExtensionElement(bo.extensionElements, id);
    setOptions(_.uniqBy([...(options || []), option], "id"));
    setSelectedOption(option);
    if (!option) return;
    setFormFieldId(option.id);
    if (isType(option.type) > -1) {
      setType(option.type);
    } else if (!option.type) {
      setType("");
    } else {
      setCustomType(option.type);
    }
    setLabel(option.label);
    setDefaultValue(option.defaultValue);
  };

  const selectElement = (e) => {
    const option = options.find((opt) => opt.id === e.target.value);
    setSelectedOption(option);
    if (!option) return;
    setFormFieldId(option.id);
    if (isType(option.type) > -1) {
      setType(option.type);
    } else if (!option.type) {
      setType("");
    } else {
      setCustomType(option.type);
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
    removeExtensionElement();
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

  function getPropertyValues() {
    const { formData, fieldIndex } = getSelectedFormField();
    const formField = formData[fieldIndex];
    const { properties } = formField || {};
    if (properties && properties.values) {
      return properties.values;
    }
    return [];
  }

  function getPropertiesElement() {
    const { formData, fieldIndex } = getSelectedFormField();
    const formField = formData[fieldIndex];
    const { properties } = formField || {};
    return properties;
  }

  function removeExtensionElement() {
    let formData = formHelper.getFormData(element);
    const { fieldIndex } = getSelectedFormField();
    const formField = formData.fields[fieldIndex];
    if (formData.fields.length < 2) {
      const extensionElements = element.businessObject.extensionElements.values;
      const index = extensionElements.findIndex(
        (e) => e.$type === formData.$type
      );
      extensionElements.splice(index, 1);
    } else {
      formData.fields.splice(fieldIndex, 1);
    }
    if ((formField && formField.id) === formData.businessKey) {
      formData.businessKey = undefined;
    }
  }

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
        if (isType(formDataExtension[0].type) > -1) {
          setType(formDataExtension[0].type);
        } else if (!formDataExtension[0].type) {
          setType("");
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
              {type === "enum" && (
                <div className={classes.root}>
                  <label
                    id="form-field-enum-values-header"
                    className={classes.groupLabel}
                  >
                    {translate("Values")}
                  </label>
                  <Table
                    entry={{
                      id: "form-field-enum-values",
                      labels: [translate("Id"), translate("Name")],
                      modelProperties: ["id", "name"],
                      addLabel: translate("Add value"),
                      showDefaultEntry: false,
                      getElements: function () {
                        return formHelper.getEnumValues(selectedOption);
                      },
                      addElement: function () {
                        let id = generateId("Value_");
                        let enumValue = elementHelper.createElement(
                          "camunda:Value",
                          { id: id, name: undefined },
                          getBusinessObject(element),
                          bpmnFactory
                        );
                        const { formData, fieldIndex } = getSelectedFormField();
                        if (
                          formData[fieldIndex].values &&
                          formData[fieldIndex].values.length > 0
                        ) {
                          formData[fieldIndex].values.push(enumValue);
                        } else {
                          formData[fieldIndex].values = [enumValue];
                        }
                        return enumValue;
                      },
                      removeElement: function (enumValue) {
                        const { formData, fieldIndex } = getSelectedFormField();
                        let index = formData[fieldIndex].values.findIndex(
                          (e) => e.id === enumValue.id
                        );
                        formData[fieldIndex].values.splice(index, 1);
                      },
                      updateElement: function (value, label, option) {
                        const { formData, fieldIndex } = getSelectedFormField();
                        let index = formData[fieldIndex].values.findIndex(
                          (e) => e.id === option.id
                        );
                        formData[fieldIndex].values[index][label] = value;
                      },
                      validate: function (value, index) {
                        const { formData, fieldIndex } = getSelectedFormField();
                        const selectedFormField = formData[fieldIndex];
                        const enumValue = selectedFormField.values[index];

                        if (enumValue) {
                          // check if id is valid
                          let validationError = utils.isIdValid(
                            enumValue,
                            value,
                            translate
                          );

                          if (validationError) {
                            return { id: validationError };
                          }
                        }
                      },
                    }}
                  />
                </div>
              )}
              <div className={classes.root}>
                <label
                  id="form-field-validation-header"
                  className={classes.groupLabel}
                >
                  {translate("Validation")}
                </label>
                <Table
                  entry={{
                    id: "constraints-list",
                    modelProperties: ["name", "config"],
                    labels: [translate("Name"), translate("Config")],
                    addLabel: translate("Add Constraint"),
                    showDefaultEntry: false,
                    getElements: function () {
                      const { formData, fieldIndex } = getSelectedFormField();
                      return formHelper.getConstraints(formData[fieldIndex]);
                    },
                    addElement: function () {
                      const { formData, fieldIndex } = getSelectedFormField();
                      let validation = formData[fieldIndex].validation;
                      if (!validation) {
                        // create validation business object and add it to form data, if it doesn't exist
                        validation = elementHelper.createElement(
                          "camunda:Validation",
                          {},
                          getBusinessObject(element),
                          bpmnFactory
                        );
                        formData[fieldIndex].validation = validation;
                      }

                      let newConstraint = elementHelper.createElement(
                        "camunda:Constraint",
                        { name: undefined, config: undefined },
                        validation,
                        bpmnFactory
                      );

                      if (
                        validation.constraints &&
                        validation.constraints.length > 0
                      ) {
                        validation.constraints.push(newConstraint);
                      } else {
                        validation.constraints = [newConstraint];
                      }
                      return newConstraint;
                    },
                    updateElement: function (value, label, option, index) {
                      const { formData, fieldIndex } = getSelectedFormField();
                      formData[fieldIndex].validation.constraints[index][
                        label
                      ] = value || undefined;
                    },
                    removeElement: function (option, index) {
                      const { formData, fieldIndex } = getSelectedFormField();
                      const formField = formData[fieldIndex];
                      formField.validation.constraints.splice(index, 1);
                      // remove camunda:validation if the last existing constraint has been removed
                      if (formField.validation.constraints.length < 1) {
                        formField.validation = undefined;
                      }
                    },
                  }}
                />
              </div>
              <div className={classes.root}>
                <label
                  id="form-field-properties-header"
                  className={classes.groupLabel}
                >
                  {translate("Properties")}
                </label>
                <Table
                  //Check properties
                  entry={{
                    id: "form-field-properties",
                    addLabel: translate("Add Properties"),
                    modelProperties: ["id", "value"],
                    labels: [translate("Id"), translate("Value")],
                    showDefaultEntry: false,
                    getElements: function () {
                      return getPropertyValues();
                    },
                    addElement: function () {
                      let properties = getPropertiesElement();
                      const { formData, fieldIndex } = getSelectedFormField();
                      let bo = getBusinessObject(element);
                      let parent = properties && properties.parent;
                      if (!parent && typeof createParent === "function") {
                        let result = createParent(element, bo);
                        parent = result.parent;
                      }
                      if (!properties) {
                        properties = elementHelper.createElement(
                          "camunda:Properties",
                          {},
                          parent,
                          bpmnFactory
                        );
                        formData[fieldIndex].properties = properties;
                      }
                      let propertyProps = {};
                      ["id", "value"].forEach((prop) => {
                        propertyProps[prop] = undefined;
                      });
                      // create id if necessary
                      if (["id", "value"].indexOf("id") >= 0) {
                        propertyProps.id = generateId("Property_");
                      }
                      let property = elementHelper.createElement(
                        "camunda:Property",
                        propertyProps,
                        properties,
                        bpmnFactory
                      );
                      if (properties.values && properties.values.length > 0) {
                        properties.values.push(property);
                      } else {
                        properties.values = [property];
                      }
                      return property;
                    },
                    updateElement: function (value, label, option, index) {
                      const { formData, fieldIndex } = getSelectedFormField();
                      formData[fieldIndex].properties.values[index][label] =
                        value || undefined;
                    },
                    // validate: function (element, value, node, idx) {
                    //   // validate id if necessary
                    //   if (["id", "value"].indexOf("id") >= 0) {
                    //     var parent = getParent(element, node, bo),
                    //       properties = getPropertyValues(),
                    //       property = properties[idx];
                    //     if (property) {
                    //       // check if id is valid
                    //       var validationError = utils.isIdValid(
                    //         property,
                    //         value.id,
                    //         translate
                    //       );
                    //       if (validationError) {
                    //         return { id: validationError };
                    //       }
                    //     }
                    //   }
                    // },
                    removeElement: function (option, index) {
                      const { formData, fieldIndex } = getSelectedFormField();
                      const formField = formData[fieldIndex];
                      formField.properties.values.splice(index, 1);
                      // remove camunda:properties if the last existing property has been removed
                      if (formField.properties.values.length < 1) {
                        formField.properties = undefined;
                      }
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
