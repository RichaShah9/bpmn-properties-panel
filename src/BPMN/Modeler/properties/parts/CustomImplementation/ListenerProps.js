import React, { useEffect, useState } from "react";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";
import find from "lodash/find";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { Edit, NotInterested } from "@material-ui/icons";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Tooltip,
} from "@material-ui/core";

import MapperBuilder from "../../../mapper-builder/App";
import { translate } from "../../../../../utils";
import {
  ExtensionElementTable,
  SelectBox,
  TextField,
  Textbox,
} from "../../../../../components/properties/components";

const useStyles = makeStyles((theme) => ({
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
  editIcon: {
    color: "#58B423",
    marginLeft: 5,
  },
  edit: {
    cursor: "pointer",
    marginTop: 18.6,
    display: "flex",
  },
  mapperBuilder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textbox: {
    width: "100%",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    textTransform: "none",
    color: "white",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
}));

const CAMUNDA_EXECUTION_LISTENER_ELEMENT = "camunda:ExecutionListener";
const CAMUNDA_TASK_LISTENER_ELEMENT = "camunda:TaskListener";

const LISTENER_TYPE_LABEL = {
  class: translate("Java Class"),
  expression: translate("Expression"),
  delegateExpression: translate("Delegate Expression"),
  script: translate("Script"),
};

const taskListenerEventTypeOptions = [
  { name: translate("create"), value: "create" },
  { name: translate("assignment"), value: "assignment" },
  { name: translate("complete"), value: "complete" },
  { name: translate("delete"), value: "delete" },
  { name: translate("update"), value: "update" },
  { name: translate("timeout"), value: "timeout" },
];

const timerOptions = [
  { value: "timeDate", name: translate("Date") },
  { value: "timeDuration", name: translate("Duration") },
  { value: "timeCycle", name: translate("Cycle") },
];

function getListeners(bo, type) {
  return (bo && extensionElementsHelper.getExtensionElements(bo, type)) || [];
}

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

function getTimerDefinition(timerOrFunction, element, node) {
  if (typeof timerOrFunction === "function") {
    return timerOrFunction(element, node);
  }
  return timerOrFunction;
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

export default function ListenerProps({
  element,
  index,
  label,
  bpmnFactory,
  bpmnModeler,
}) {
  const [isVisible, setVisible] = useState(false);
  const [selectedExecutionEntity, setSelectedExecutionEntity] = useState(null);
  const [selectedTaskEntity, setSelectedTaskEntity] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [timerDefinitionType, setTimerDefinitionType] = useState("");
  const [taskOptions, setTaskOptions] = useState(null);
  const [executionOptions, setExecutionOptions] = useState(null);
  const [open, setOpen] = useState(false);
  const [openAlert, setAlert] = useState(false);

  const classes = useStyles();
  const isSequenceFlow = ImplementationTypeHelper.isSequenceFlow(element);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSave = (expr) => {
    const listener = getListener();
    if (!expr) {
      listener.script.value = undefined;
      listener.script.resource = undefined;
      listener.script.scriptFormat = undefined;
      listener.script.scriptValue = undefined;
      handleClose();
      return;
    }
    if (!listener.script) {
      listener.script =
        listener.script ||
        elementHelper.createElement(
          "camunda:Script",
          {
            scriptFormat: "axelor",
            value: expr.resultField,
            scriptValue: expr.resultMetaField,
          },
          getBO(),
          bpmnFactory
        );
    } else {
      listener.script.value = expr.resultField;
      listener.script.resource = undefined;
      listener.script.scriptFormat = "axelor";
      listener.script.scriptValue = expr.resultMetaField;
    }
    handleClose();
  };

  const getExpression = () => {
    const listener = getListener();
    if (!listener && !(listener && listener.script))
      return {
        resultField: undefined,
        resultMetaField: undefined,
      };
    return {
      resultField: listener.script && listener.script.value,
      resultMetaField: listener.script && listener.script.scriptValue,
    };
  };

  const getReadOnly = () => {
    const listener = getListener();
    if (listener && listener.script && listener.script.scriptValue) {
      return true;
    } else {
      return false;
    }
  };

  const getExecutionOptions = () => {
    const executionListenerEventTypeOptions = ImplementationTypeHelper.isSequenceFlow(
      element
    )
      ? [{ name: translate("take"), value: "take" }]
      : [
          { name: translate("start"), value: "start" },
          { name: translate("end"), value: "end" },
        ];
    return executionListenerEventTypeOptions;
  };

  const newElement = (element, type, initialEvent) => {
    return function (e, extensionEle, value) {
      let props = {
        event: initialEvent,
        script: undefined,
      };

      let newElem = elementHelper.createElement(
        type,
        props,
        extensionEle,
        bpmnFactory
      );

      let bo = getBusinessObject(element);
      let extensionElements = bo && bo.extensionElements;
      if (!extensionElements) {
        extensionElements = elementHelper.createElement(
          "bpmn:ExtensionElements",
          { values: [] },
          bo,
          bpmnFactory
        );
        element.businessObject.extensionElements = extensionElements;
      }
      element.businessObject.extensionElements.values.push(newElem);
      return newElem;
    };
  };

  const removeElement = (type) => {
    return function (index) {
      let bo = getBusinessObject(element);
      const extensionElements =
        bo.extensionElements && bo.extensionElements.values;
      let count;
      extensionElements &&
        extensionElements.forEach((element, ind) => {
          if (element.$type === type) {
            if (count > -1) {
              count++;
            } else {
              count = 0;
            }
          }
          if (count === Number(index)) {
            bo.extensionElements.values.splice(ind, 1);
            return;
          }
        });
      addOptions(element);
      if (
        extensionElements &&
        !extensionElements.find((e) => e.$type === type)
      ) {
        if (type === CAMUNDA_EXECUTION_LISTENER_ELEMENT) {
          setSelectedExecutionEntity(null);
        } else {
          setSelectedTaskEntity(null);
        }
      } else {
        setSelectedExecutionEntity(null);
        setSelectedTaskEntity(null);
      }
    };
  };

  const getBO = React.useCallback(() => {
    let bo = getBusinessObject(element);
    if (is(element, "bpmn:Participant")) {
      bo = bo.get("processRef");
    }
    return bo;
  }, [element]);

  const getListener = React.useCallback(() => {
    let type =
      selectedExecutionEntity === 0 || selectedExecutionEntity
        ? CAMUNDA_EXECUTION_LISTENER_ELEMENT
        : CAMUNDA_TASK_LISTENER_ELEMENT;
    let bo = getBO();
    const listeners = getListeners(bo, type);
    const listener =
      listeners[
        selectedExecutionEntity === 0 || selectedExecutionEntity
          ? selectedExecutionEntity
          : selectedTaskEntity
      ];
    return listener || (listeners && listeners[0]);
  }, [getBO, selectedExecutionEntity, selectedTaskEntity]);

  const showExecutionListener = () => {
    if (
      is(element, "bpmn:FlowElement") ||
      is(element, "bpmn:Process") ||
      is(element, "bpmn:Participant")
    ) {
      const bo = getBO();
      if (bo) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  const setOptionLabelValue = (type) => {
    const bo = getBO();
    return function (index) {
      let listeners = getListeners(bo, type);
      let listener = listeners[index];
      let listenerType = ImplementationTypeHelper.getImplementationType(
        listener
      );
      if (!listener) return "";
      let event = listener.get("event") ? listener.get("event") : "<empty>";

      let label =
        (event || "*") +
        " : " +
        (LISTENER_TYPE_LABEL[listenerType] || "Script");
      return label;
    };
  };

  function createTimerEventDefinition(listener) {
    if (!listener || !isTimeoutTaskListener(listener)) {
      return;
    }
    let eventDefinitions = listener.get("eventDefinitions") || [],
      timerEventDefinition = bpmnFactory.create("bpmn:TimerEventDefinition");
    eventDefinitions.push(timerEventDefinition);
    listener.eventDefinitions = eventDefinitions;
    return timerEventDefinition;
  }

  function isTimeoutTaskListener(listener) {
    let eventType = listener && listener.event;
    return eventType === "timeout";
  }

  // timerEventDefinition //////
  let timerEventDefinitionHandler = function (listener) {
    if (!listener || !isTimeoutTaskListener(listener)) {
      return;
    }
    let timerEventDefinition = getTimerEventDefinition(listener);
    if (!timerEventDefinition) {
      return false;
    }
    return timerEventDefinition;
  };

  function getTimerEventDefinition(bo) {
    let eventDefinitions = bo.eventDefinitions || [];
    return find(eventDefinitions, function (event) {
      return is(event, "bpmn:TimerEventDefinition");
    });
  }

  const addOptions = (element, isInitial = false) => {
    const bo = getBusinessObject(element);
    const executionListeners = getListeners(
      bo,
      CAMUNDA_EXECUTION_LISTENER_ELEMENT
    );

    const executionOptions =
      executionListeners &&
      executionListeners.map(function (l, index) {
        let listenerType = ImplementationTypeHelper.getImplementationType(l);
        return {
          id: index,
          text: `${l.event} : ${LISTENER_TYPE_LABEL[listenerType] || "Script"}`,
        };
      });

    const taskListeners = getListeners(bo, CAMUNDA_TASK_LISTENER_ELEMENT);
    const taskOptions =
      taskListeners &&
      taskListeners.map(function (l, index) {
        let listenerType = ImplementationTypeHelper.getImplementationType(l);
        return {
          id: index,
          text: `${l.event} : ${LISTENER_TYPE_LABEL[listenerType] || "Script"}`,
        };
      });
    setExecutionOptions(executionOptions);
    setTaskOptions(taskOptions);
    if (isInitial) {
      if (executionOptions.length > 0) {
        setSelectedExecutionEntity(executionOptions[0]);
        setSelectedTaskEntity(null);
      } else if (taskOptions.length > 0) {
        setSelectedExecutionEntity(null);
        setSelectedTaskEntity(taskOptions[0]);
      }
    }
  };

  useEffect(() => {
    setVisible(
      !eventDefinitionHelper.getLinkEventDefinition(element) ||
        (!is(element, "bpmn:IntermediateThrowEvent") &&
          eventDefinitionHelper.getLinkEventDefinition(element))
    );
  }, [element]);

  useEffect(() => {
    addOptions(element, true);
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        {showExecutionListener() && (
          <ExtensionElementTable
            element={element}
            options={executionOptions}
            entry={{
              id: "executionListeners",
              label: translate("Execution Listener"),
              modelProperty: "name",
              idGeneration: "false",
              reference: "processRef",
              createExtensionElement: newElement(
                element,
                CAMUNDA_EXECUTION_LISTENER_ELEMENT,
                isSequenceFlow ? "take" : "start"
              ),
              removeExtensionElement: removeElement(
                CAMUNDA_EXECUTION_LISTENER_ELEMENT
              ),
              onSelectionChange: function (value) {
                setSelectedExecutionEntity(value);
                setSelectedTaskEntity(null);
              },
              setOptionLabelValue: setOptionLabelValue(
                CAMUNDA_EXECUTION_LISTENER_ELEMENT
              ),
            }}
          />
        )}
        {is(element, "bpmn:UserTask") && (
          <ExtensionElementTable
            element={element}
            options={taskOptions}
            entry={{
              id: "taskListeners",
              label: translate("Task Listener"),
              modelProperty: "name",
              idGeneration: "false",
              createExtensionElement: newElement(
                element,
                CAMUNDA_TASK_LISTENER_ELEMENT,
                "create"
              ),
              removeExtensionElement: removeElement(
                CAMUNDA_TASK_LISTENER_ELEMENT
              ),
              onSelectionChange: function (value) {
                setSelectedTaskEntity(value);
                setSelectedExecutionEntity(null);
              },
              setOptionLabelValue: setOptionLabelValue(
                CAMUNDA_TASK_LISTENER_ELEMENT
              ),
            }}
          />
        )}
        {(selectedExecutionEntity ||
          selectedExecutionEntity === 0 ||
          selectedTaskEntity ||
          selectedTaskEntity === 0) && (
          <React.Fragment>
            <SelectBox
              element={element}
              entry={{
                id: "listener-event-type",
                label: translate("Event Type"),
                modelProperty: "eventType",
                emptyParameter: false,
                selectOptions: function () {
                  return selectedExecutionEntity ||
                    selectedExecutionEntity === 0
                    ? getExecutionOptions()
                    : taskListenerEventTypeOptions;
                },
                get: function () {
                  const listener = getListener();
                  if (!listener) return;
                  let eventType = listener && listener.get("event");
                  setEventType(eventType);
                  return {
                    eventType: eventType,
                  };
                },
                set: function (element, values) {
                  let eventType = values.eventType;
                  setEventType(eventType);
                  const listener = getListener();
                  if (!listener) return;
                  let eventDefinitions = listener && listener.eventDefinitions;
                  // ensure only timeout events can have timer event definitions
                  if (eventDefinitions && eventType !== "timeout") {
                    eventDefinitions = [];
                  }
                  listener.event = eventType;
                  listener.eventDefinitions = eventDefinitions;
                  addOptions(element);
                },
              }}
            />
            {(selectedTaskEntity || selectedTaskEntity === 0) && (
              <TextField
                element={element}
                canRemove={true}
                entry={{
                  id: "listener-id",
                  label: translate("Listener Id"),
                  modelProperty: "listenerId",
                  get: function () {
                    const listener = getListener();
                    if (!listener) return;
                    return { listenerId: listener.id };
                  },
                  set: function (e, values) {
                    const listener = getListener();
                    if (!listener) return;
                    listener.id = values.listenerId;
                  },
                  validate: function (e, values) {
                    if (!values.listenerId && eventType === "timeout") {
                      return {
                        listenerId:
                          "Must provide a value for timeout task listener",
                      };
                    }
                  },
                }}
              />
            )}
            <div className={classes.mapperBuilder}>
              <Textbox
                element={element}
                rows={3}
                className={classes.textbox}
                readOnly={() => getReadOnly()}
                entry={{
                  id: "script",
                  label: translate("Script"),
                  modelProperty: "script",
                  get: function () {
                    const listener = getListener();
                    if (listener && listener.script) {
                      return { script: listener.script.value };
                    }
                  },
                  set: function (e, values) {
                    const listener = getListener();
                    if (!listener.script) {
                      listener.script =
                        listener.script ||
                        elementHelper.createElement(
                          "camunda:Script",
                          {
                            scriptFormat: "axelor",
                            value: values.script,
                          },
                          getBO(),
                          bpmnFactory
                        );
                    } else {
                      listener.script.value = values.script;
                      listener.script.resource = undefined;
                      listener.script.scriptFormat = "axelor";
                    }
                  },
                  validate: function (e, values) {
                    if (!values.script) {
                      return { script: "Must provide a value" };
                    }
                  },
                }}
              />
              {(selectedExecutionEntity === 0 || selectedExecutionEntity) && (
                <div className={classes.edit}>
                  <Tooltip title="Enable" aria-label="enable">
                    <NotInterested
                      className={classes.editIcon}
                      onClick={() => {
                        const listener = getListener();

                        if (
                          listener &&
                          listener.script &&
                          listener.script.scriptValue
                        ) {
                          setAlert(true);
                        }
                      }}
                    />
                  </Tooltip>
                  <Edit
                    className={classes.editIcon}
                    onClick={handleClickOpen}
                  />
                  {open && (
                    <MapperBuilder
                      open={open}
                      handleClose={handleClose}
                      bpmnModeler={bpmnModeler}
                      onSave={(expr) => {
                        onSave(expr);
                      }}
                      params={() => getExpression()}
                    />
                  )}
                  {openAlert && (
                    <Dialog
                      open={openAlert}
                      onClose={() => setAlert(false)}
                      aria-labelledby="alert-dialog-title"
                      aria-describedby="alert-dialog-description"
                      classes={{
                        paper: classes.dialog,
                      }}
                    >
                      <DialogTitle id="alert-dialog-title">
                        <label className={classes.title}>
                          {translate("Warning")}
                        </label>
                      </DialogTitle>
                      <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                          {translate(
                            "Script can't be managed using builder once changed manually."
                          )}
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button
                          onClick={() => {
                            setAlert(false);
                            const listener = getListener();
                            listener.script.scriptValue = undefined;
                          }}
                          color="primary"
                          className={classes.save}
                          autoFocus
                        >
                          Ok
                        </Button>
                        <Button
                          onClick={() => {
                            setAlert(false);
                          }}
                          color="primary"
                          className={classes.save}
                        >
                          Cancel
                        </Button>
                      </DialogActions>
                    </Dialog>
                  )}
                </div>
              )}
            </div>
            {eventType === "timeout" && (
              <React.Fragment>
                <SelectBox
                  element={element}
                  entry={{
                    id: "listener-timer-event-definition-type",
                    label: translate("Timer Definition Type"),
                    selectOptions: timerOptions,
                    emptyParameter: true,
                    modelProperty: "timerDefinitionType",
                    get: function (element, node) {
                      const listener = getListener();
                      let timerDefinition = getTimerDefinition(
                        timerEventDefinitionHandler(listener),
                        element,
                        node
                      );
                      let timerDefinitionType =
                        getTimerDefinitionType(timerDefinition) || "";
                      setTimerDefinitionType(timerDefinitionType);
                      return {
                        timerDefinitionType: timerDefinitionType,
                      };
                    },
                    set: function (element, values) {
                      setTimerDefinitionType(values.timerDefinitionType);
                      let props = {
                        timeDuration: undefined,
                        timeDate: undefined,
                        timeCycle: undefined,
                      };
                      const listener = getListener();
                      let timerDefinition = getTimerDefinition(
                          timerEventDefinitionHandler(listener),
                          element
                        ),
                        newType = values.timerDefinitionType;
                      if (
                        !timerDefinition &&
                        typeof createTimerEventDefinition === "function"
                      ) {
                        timerDefinition = createTimerEventDefinition(listener);
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
                      if (!listener) return;
                      listener.eventDefinitions = [timerDefinition];
                    },
                  }}
                />
                {(timerDefinitionType || timerDefinitionType !== "") && (
                  <TextField
                    element={element}
                    canRemove={true}
                    entry={{
                      id: "listener-timer-event-definition",
                      label: translate("Timer Definition"),
                      modelProperty: "timerDefinition",
                      get: function (element, node) {
                        const listener = getListener();
                        let timerDefinition = getTimerDefinition(
                            timerEventDefinitionHandler(listener),
                            element,
                            node
                          ),
                          type = getTimerDefinitionType(timerDefinition),
                          definition = type && timerDefinition.get(type),
                          value = definition && definition.get("body");

                        return {
                          timerDefinition: value,
                        };
                      },
                      set: function (element, values, node) {
                        const listener = getListener();
                        let timerDefinition = getTimerDefinition(
                            timerEventDefinitionHandler(listener),
                            element,
                            node
                          ),
                          type = getTimerDefinitionType(timerDefinition),
                          definition = type && timerDefinition.get(type);

                        if (definition) {
                          definition.body = values.timerDefinition || undefined;
                        }
                        if (!listener) return;
                        listener.eventDefinitions = [timerDefinition];
                      },
                      validate: function (e, values) {
                        if (!values.timerDefinition && timerDefinitionType) {
                          return { timerDefinition: "Must provide a value" };
                        }
                      },
                    }}
                  />
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </div>
    )
  );
}
