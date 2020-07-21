import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

export default function ExternalTaskPriority(
  element,
  bpmnFactory,
  options,
  translate
) {
  let getBusinessObject = options.getBusinessObject;

  let externalTaskPriorityEntry = {
    id: "externalTaskPriority",
    label: translate("Task Priority"),
    modelProperty: "taskPriority",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      return {
        taskPriority: bo.get("camunda:taskPriority"),
      };
    },

    set: function (element, values) {
      let bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, {
        "camunda:taskPriority": values.taskPriority || undefined,
      });
    },
  };

  return [externalTaskPriorityEntry];
}
