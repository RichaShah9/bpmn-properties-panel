import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import candidateStarter from "./implementation/CandidateStarter";

export default function CandidateStarterProps(
  group,
  element,
  bpmnFactory,
  translate
) {
  let businessObject = getBusinessObject(element);

  if (
    (is(element, "camunda:Process") || is(element, "bpmn:Participant")) &&
    businessObject.get("processRef")
  ) {
    group.entries = group.entries.concat(
      candidateStarter(
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
}
