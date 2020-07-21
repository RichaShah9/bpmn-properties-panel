import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import jobPriority from "./implementation/JobPriority";
import jobRetryTimeCycle from "./implementation/JobRetryTimeCycle";

export default function JobConfigurationProps(group, element, bpmnFactory, translate) {
  let businessObject = getBusinessObject(element);

  if (
    is(element, "camunda:JobPriorized") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    group.entries = group.entries.concat(
      jobPriority(
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

  if (is(element, "camunda:AsyncCapable")) {
    group.entries = group.entries.concat(
      jobRetryTimeCycle(
        element,
        bpmnFactory,
        {
          getBusinessObject: getBusinessObject,
        },
        translate
      )
    );
  }
};
