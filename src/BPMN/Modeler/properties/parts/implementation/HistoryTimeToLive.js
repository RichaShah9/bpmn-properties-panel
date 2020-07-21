import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

export default function HistoryTimeToLive(
  element,
  bpmnFactory,
  options,
  translate
) {
  let getBusinessObject = options.getBusinessObject;

  let historyTimeToLiveEntry = {
    id: "historyTimeToLive",
    label: translate("History Time To Live"),
    modelProperty: "historyTimeToLive",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      let historyTimeToLive = bo.get("camunda:historyTimeToLive");

      return {
        historyTimeToLive: historyTimeToLive ? historyTimeToLive : "",
      };
    },

    set: function (element, values) {
      let bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, {
        "camunda:historyTimeToLive": values.historyTimeToLive || undefined,
      });
    },
  };

  return [historyTimeToLiveEntry];
}
