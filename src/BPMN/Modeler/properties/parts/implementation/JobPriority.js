
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
      element.businessObject.jobPriority = values.jobPriority || undefined;
    },
  };

  return [jobPriorityEntry];
}
