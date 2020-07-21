import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

export default function JobPriority(element, bpmnFactory, options, translate) {
  let getBusinessObject = options.getBusinessObject;

  let jobPriorityEntry = {
    id: "jobPriority",
    label: translate("Job Priority"),
    modelProperty: "jobPriority",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      return {
        jobPriority: bo.get("camunda:jobPriority"),
      };
    },

    set: function (element, values) {
      let bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, {
        "camunda:jobPriority": values.jobPriority || undefined,
      });
    },
  };

  return [jobPriorityEntry];
}
