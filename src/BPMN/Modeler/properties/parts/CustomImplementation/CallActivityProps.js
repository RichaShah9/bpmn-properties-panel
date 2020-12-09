import React, { useEffect, useState } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import AddIcon from "@material-ui/icons/Add";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Button,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Select from "../../../../../components/Select";
import { TextField, SelectBox, Checkbox } from "../../components";
import { translate } from "../../../../../utils";
import { getWkfModel, getBPMNModels } from "../../../../../services/api";

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
  bpmn: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  linkIcon: {
    color: "#58B423",
    marginLeft: 5,
  },
  link: {
    cursor: "pointer",
  },
  dialogPaper: {
    padding: 5,
    minWidth: 450,
    overflow: "auto",
  },
});

const bindingOptions = [
  {
    name: translate("latest"),
    value: "latest",
  },
  {
    name: translate("deployment"),
    value: "deployment",
  },
  {
    name: translate("version"),
    value: "version",
  },
  {
    name: translate("versionTag"),
    value: "versionTag",
  },
];

const delegateVariableMappingOptions = [
  {
    name: "variableMappingClass",
    value: "variableMappingClass",
  },
  {
    name: "variableMappingDelegateExpression",
    value: "variableMappingDelegateExpression",
  },
];

function getCallableType(bo) {
  let boCalledElement = bo.get("calledElement"),
    boCaseRef = bo.get("camunda:caseRef");
  let callActivityType = "";
  if (typeof boCalledElement !== "undefined") {
    callActivityType = "bpmn";
  } else if (typeof boCaseRef !== "undefined") {
    callActivityType = "cmmn";
  }
  return callActivityType;
}

function getDelegateVariableMapping(bo) {
  let boVariableMappingClass = bo.get("variableMappingClass"),
    boVariableMappingDelegateExpression = bo.get(
      "variableMappingDelegateExpression"
    );
  let bindingType = "";
  if (typeof boVariableMappingClass !== "undefined") {
    bindingType = "variableMappingClass";
  } else if (typeof boVariableMappingDelegateExpression !== "undefined") {
    bindingType = "variableMappingDelegateExpression";
  }
  return bindingType;
}

function getCamundaInWithBusinessKey(element) {
  let camundaIn = [],
    bo = getBusinessObject(element);

  let camundaInParams = extensionElementsHelper.getExtensionElements(
    bo,
    "camunda:In"
  );
  if (camundaInParams) {
    camundaInParams.forEach((param) => {
      if (param.businessKey !== undefined) {
        camundaIn.push(param);
      }
    });
  }
  return camundaIn;
}

function setBusinessKeyInCamunda(element, text, bpmnFactory) {
  let camundaInWithBusinessKey = getCamundaInWithBusinessKey(element);
  if (camundaInWithBusinessKey.length) {
    camundaInWithBusinessKey[0].businessKey = text;
  } else {
    let bo = getBusinessObject(element),
      extensionElements = bo.extensionElements;

    if (!extensionElements) {
      extensionElements = elementHelper.createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory
      );
      element.businessObject.extensionElements = extensionElements;
    }

    let camundaIn = elementHelper.createElement(
      "camunda:In",
      { businessKey: text },
      extensionElements,
      bpmnFactory
    );

    element.businessObject.extensionElements &&
      element.businessObject.extensionElements.values.push(camundaIn);
  }
}

function deleteBusinessKey(element) {
  let extensionElements = element.businessObject.extensionElements;
  if (
    extensionElements &&
    extensionElements.values &&
    extensionElements.values.length > 0
  ) {
    let index = extensionElements.values.findIndex(
      (e) => e.$type === "camunda:In"
    );
    if (index > -1) {
      extensionElements.values.splice(index, 1);
    }
  }
}

export default function CallActivityProps({
  element,
  index,
  label,
  bpmnFactory,
}) {
  const [isVisible, setVisible] = useState(false);
  const [callActivityType, setCallActivityType] = useState("");
  const [delegateMappingType, setDelegateMappingType] = useState("");
  const [bindingType, setBindingType] = useState("latest");
  const [isBusinessKey, setBusinessKey] = useState(false);
  const [wkfModel, setWkfModel] = useState(null);
  const [open, setOpen] = React.useState(false);
  const classes = useStyles();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onConfirm = () => {
    if (wkfModel) {
      if (element && element.businessObject) {
        element.businessObject.calledElement = wkfModel.processId;
        element.businessObject.$attrs["camunda:processName"] = wkfModel.name;
      }
    }
    handleClose();
  };

  const getPropertyValue = (propertyName, type = callActivityType) => {
    const bo = getBusinessObject(element);
    return bo[`${type === "bpmn" ? "calledElement" : "case"}${propertyName}`];
  };
  const setPropertyValue = (propertyName, value) => {
    const bo = getBusinessObject(element);
    bo[
      `${callActivityType === "bpmn" ? "calledElement" : "case"}${propertyName}`
    ] = value;
  };

  const updateModel = React.useCallback(
    async (processId) => {
      const wkfModel = await getWkfModel(processId);
      setWkfModel(wkfModel);
      if (processId) {
        const process = await getBPMNModels([
          {
            fieldName: "processId",
            operator: "=",
            value: processId,
          },
        ]);
        const processName = process && process[0] && process[0].name;
        if (element && element.businessObject && processName) {
          element.businessObject.$attrs["camunda:processName"] = processName;
        }
      }
    },
    [element]
  );

  useEffect(() => {
    if (is(element, "camunda:CallActivity")) {
      let bo = getBusinessObject(element);
      const callActivityType = getCallableType(bo);
      const delegateMappingType = getDelegateVariableMapping(bo);
      const calledElementBinding =
        bo[
          `${callActivityType === "bpmn" ? "calledElement" : "case"}Binding`
        ] || "latest";
      const camundaIn = getCamundaInWithBusinessKey(element);
      setVisible(true);
      setCallActivityType(callActivityType);
      setDelegateMappingType(delegateMappingType);
      setBindingType(calledElementBinding);
      setBusinessKey(camundaIn && camundaIn.length > 0 ? true : false);
    }
  }, [element]);

  useEffect(() => {
    const bo = getBusinessObject(element);
    if (bo && bo.calledElement) {
      updateModel(bo.calledElement);
    }
  }, [element, updateModel]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <SelectBox
          element={element}
          entry={{
            id: "callActivity",
            label: "CallActivity Type",
            modelProperty: "callActivityType",
            selectOptions: [
              { name: "BPMN", value: "bpmn" },
              { name: "CMMN", value: "cmmn" },
            ],
            emptyParameter: true,
            get: function () {
              return { callActivityType: callActivityType };
            },

            set: function (element, values) {
              setCallActivityType(values.callActivityType);
              let bindingType = getPropertyValue(
                "Binding",
                values.callActivityType
              );
              setBindingType(bindingType);
            },
          }}
        />
        {callActivityType === "bpmn" && (
          <div
            className={classes.bpmn}
            style={{
              alignItems:
                element &&
                getBusinessObject(element) &&
                getBusinessObject(element).calledElement
                  ? "flex-end"
                  : "center",
            }}
          >
            <TextField
              element={element}
              entry={{
                id: "calledElement",
                label: translate("Called Element"),
                modelProperty: "calledElement",
                get: function () {
                  const bo = getBusinessObject(element);
                  return { calledElement: bo.calledElement };
                },
                set: function (e, values) {
                  element.businessObject.calledElement = values.calledElement;
                  element.businessObject.calledElementBinding = bindingType;
                  element.businessObject.caseRef = undefined;
                  updateModel(values.calledElement);
                },
                validate: function (e, values) {
                  if (!values.calledElement && callActivityType === "bpmn") {
                    return { calledElement: "Must provide a value" };
                  }
                },
              }}
              canRemove={true}
            />
            <div onClick={handleClickOpen} className={classes.link}>
              <AddIcon className={classes.linkIcon} />
            </div>
            {wkfModel && (
              <div
                onClick={() => {
                  window.top.document
                    .getElementsByTagName("iframe")[0]
                    .contentWindow.parent.axelor.$openHtmlTab(
                      `wkf-editor/?id=${wkfModel && wkfModel.id}`,
                      translate("BPM editor")
                    );
                }}
                className={classes.link}
              >
                <OpenInNewIcon className={classes.linkIcon} />
              </div>
            )}
          </div>
        )}
        {callActivityType === "bpmn" && wkfModel && (
          <TextField
            element={element}
            readOnly={true}
            entry={{
              id: "processName",
              label: translate("Process Name"),
              modelProperty: "processName",
              get: function () {
                const bo = getBusinessObject(element);
                return { processName: bo.$attrs["camunda:processName"] };
              },
            }}
          />
        )}
        {callActivityType === "cmmn" && (
          <TextField
            element={element}
            entry={{
              id: "caseRef",
              label: translate("Case Ref"),
              modelProperty: "caseRef",
              get: function () {
                const bo = getBusinessObject(element);
                return { caseRef: bo.caseRef };
              },
              set: function (e, values) {
                element.businessObject.caseRef = values.caseRef;
                element.businessObject.calledElement = undefined;
                element.businessObject.caseBinding = bindingType;
              },
              validate: function (e, values) {
                if (!values.caseRef && callActivityType === "cmmn") {
                  return { caseRef: "Must provide a value" };
                }
              },
            }}
            canRemove={true}
          />
        )}
        {callActivityType && (
          <React.Fragment>
            <SelectBox
              element={element}
              entry={{
                id: "calledElementBinding",
                label: "Binding",
                modelProperty: "calledElementBinding",
                selectOptions: function () {
                  let options;
                  if (callActivityType === "cmmn") {
                    options = bindingOptions.filter(function (bindingOption) {
                      return bindingOption.value !== "versionTag";
                    });
                  } else {
                    options = bindingOptions;
                  }
                  return options;
                },
                emptyParameter: true,
                get: function () {
                  return {
                    calledElementBinding: bindingType,
                  };
                },
                set: function (e, values) {
                  setBindingType(values.calledElementBinding);
                  setPropertyValue("Binding", values.calledElementBinding);
                },
              }}
            />
            {bindingType === "version" && (
              <TextField
                element={element}
                entry={{
                  id: "calledElementVersion",
                  label: translate("Version"),
                  modelProperty: "calledElementVersion",
                  get: function () {
                    return {
                      calledElementVersion: getPropertyValue("Version"),
                    };
                  },
                  set: function (e, values) {
                    setPropertyValue("Version", values.calledElementVersion);
                    setPropertyValue("VersionTag", undefined);
                  },
                  validate: function (e, values) {
                    if (
                      !values.calledElementVersion &&
                      bindingType === "version"
                    ) {
                      return { calledElementVersion: "Must provide a value" };
                    }
                  },
                }}
                canRemove={true}
              />
            )}
            {bindingType === "versionTag" && (
              <TextField
                element={element}
                entry={{
                  id: "calledElementVersionTag",
                  label: translate("Version Tag"),
                  modelProperty: "calledElementVersionTag",
                  get: function () {
                    return {
                      calledElementVersionTag: getPropertyValue("VersionTag"),
                    };
                  },
                  set: function (e, values) {
                    setPropertyValue(
                      "VersionTag",
                      values.calledElementVersionTag
                    );
                    setPropertyValue("Version", undefined);
                  },
                  validate: function (e, values) {
                    if (
                      !values.calledElementVersionTag &&
                      bindingType === "versionTag"
                    ) {
                      return {
                        calledElementVersionTag: "Must provide a value",
                      };
                    }
                  },
                }}
                canRemove={true}
              />
            )}
            <TextField
              element={element}
              entry={{
                id: "calledElementTenantId",
                label: translate("Tenant id"),
                modelProperty: "calledElementTenantId",
                get: function () {
                  return {
                    calledElementTenantId: getPropertyValue("TenantId"),
                  };
                },
                set: function (e, values) {
                  setPropertyValue("TenantId", values.calledElementTenantId);
                },
              }}
              canRemove={true}
            />
          </React.Fragment>
        )}
        <Checkbox
          entry={{
            id: "business-key",
            label: translate("Business Key"),
            modelProperty: "businessKey",
            get: function (element) {
              return {
                businessKey: isBusinessKey,
              };
            },
            set: function (e, values) {
              setBusinessKey(!values.businessKey);
              if (values.businessKey) {
                //revert value as per condition
                deleteBusinessKey(element);
              } else {
                return setBusinessKeyInCamunda(
                  element,
                  "#{execution.processBusinessKey}",
                  bpmnFactory
                );
              }
            },
          }}
          element={element}
        />
        {isBusinessKey && (
          <TextField
            element={element}
            entry={{
              id: "businessKeyExpression",
              label: translate("Business Key Expression"),
              modelProperty: "businessKeyExpression",
              get: function () {
                let camundaInWithBusinessKey = getCamundaInWithBusinessKey(
                  element
                );
                return {
                  businessKeyExpression: camundaInWithBusinessKey.length
                    ? camundaInWithBusinessKey[0].get("camunda:businessKey")
                    : undefined,
                };
              },
              set: function (element, values) {
                let businessKeyExpression = values.businessKeyExpression;
                setBusinessKeyInCamunda(
                  element,
                  businessKeyExpression,
                  bpmnFactory
                );
              },
            }}
            canRemove={true}
          />
        )}
        {callActivityType === "bpmn" && (
          <SelectBox
            element={element}
            entry={{
              id: "delegateVariableMapping",
              label: "Delegate Variable Mapping",
              modelProperty: "delegateVariableMapping",
              selectOptions: delegateVariableMappingOptions,
              emptyParameter: true,
              get: function () {
                return { delegateVariableMapping: delegateMappingType };
              },
              set: function (e, values) {
                setDelegateMappingType(values.delegateVariableMapping);
              },
            }}
          />
        )}
        {delegateMappingType === "variableMappingClass" &&
          callActivityType === "bpmn" && (
            <TextField
              element={element}
              entry={{
                id: "variableMappingClass",
                label: translate("Class"),
                modelProperty: "variableMappingClass",
                get: function () {
                  const bo = getBusinessObject(element);
                  return { variableMappingClass: bo.variableMappingClass };
                },
                set: function (e, values) {
                  element.businessObject.variableMappingClass =
                    values.variableMappingClass;
                  element.businessObject.variableMappingDelegateExpression = undefined;
                },
                validate: function (e, values) {
                  if (
                    !values.variableMappingClass &&
                    callActivityType === "bpmn" &&
                    delegateMappingType === "variableMappingClass"
                  ) {
                    return { variableMappingClass: "Must provide a value" };
                  }
                },
              }}
              canRemove={true}
            />
          )}
        {delegateMappingType === "variableMappingDelegateExpression" &&
          callActivityType === "bpmn" && (
            <TextField
              element={element}
              entry={{
                id: "variableMappingDelegateExpression",
                label: translate("Delegate Expression"),
                modelProperty: "variableMappingDelegateExpression",
                get: function () {
                  const bo = getBusinessObject(element);
                  return {
                    variableMappingDelegateExpression:
                      bo.variableMappingDelegateExpression,
                  };
                },
                set: function (e, values) {
                  element.businessObject.variableMappingDelegateExpression =
                    values.variableMappingDelegateExpression;
                  element.businessObject.variableMappingClass = undefined;
                },
                validate: function (e, values) {
                  if (
                    !values.calledElement &&
                    delegateMappingType ===
                      "variableMappingDelegateExpression" &&
                    callActivityType === "bpmn"
                  ) {
                    return {
                      variableMappingDelegateExpression: "Must provide a value",
                    };
                  }
                },
              }}
              canRemove={true}
            />
          )}
        {open && (
          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="form-dialog-title"
            maxWidth="sm"
            classes={{
              paper: classes.dialogPaper,
            }}
          >
            <DialogTitle id="form-dialog-title">Select BPMN</DialogTitle>
            <DialogContent>
              <label className={classes.label}>{translate("BPMN")}</label>
              <Select
                className={classes.select}
                update={(value) => {
                  setWkfModel(value);
                }}
                name="wkfModel"
                optionLabel="name"
                isLabel={true}
                fetchMethod={() => getBPMNModels()}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleClose}
                className={classes.button}
                color="primary"
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                className={classes.button}
                color="primary"
                variant="outlined"
              >
                Ok
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </div>
    )
  );
}
