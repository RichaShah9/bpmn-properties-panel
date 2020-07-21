import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

export default function Tasklist(element, bpmnFactory, options, translate) {
  let getBusinessObject = options.getBusinessObject;

  let isStartableInTasklistEntry = {
    id: "isStartableInTasklist",
    label: translate("Startable"),
    modelProperty: "isStartableInTasklist",
    widget: "checkbox",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      let isStartableInTasklist = bo.get("camunda:isStartableInTasklist");

      return {
        isStartableInTasklist: isStartableInTasklist
          ? isStartableInTasklist
          : "",
      };
    },

    set: function (element, values) {
      let bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, {
        "camunda:isStartableInTasklist": !!values.isStartableInTasklist,
      });
    },
  };

  return [isStartableInTasklistEntry];
}
