import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import historyTimeToLive from "./implementation/HistoryTimeToLive";

export default function HistoryTimeToLiveProps(group, element, bpmnFactory, translate) {
  let businessObject = getBusinessObject(element);
  if (
    is(element, "camunda:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    group.entries = group.entries.concat(
      historyTimeToLive(
        element,
        bpmnFactory,
        {
          getBusinessObject: function (element) {
            let bo = getBusinessObject(element);

            if (!is(bo, "bpmn:Participant")) {
              return bo;
            }

            return bo.get("processRef");
          },
        },
        translate
      )
    );
  }
};
