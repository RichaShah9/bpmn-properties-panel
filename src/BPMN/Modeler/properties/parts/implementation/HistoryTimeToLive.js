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
      if (
        element &&
        element.businessObject &&
        element.businessObject.processRef
      ) {
        element.businessObject.processRef.historyTimeToLive =
          values.historyTimeToLive || undefined;
      }
    },
  };

  return [historyTimeToLiveEntry];
}
