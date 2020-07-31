import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import multiInstanceLoopCharacteristics from "./implementation/MultiInstanceLoopCharacteristics";
import jobRetryTimeCycle from "./implementation/JobRetryTimeCycle";

function getLoopCharacteristics(element) {
  var bo = getBusinessObject(element);
  return bo.loopCharacteristics;
}

function ensureMultiInstanceSupported(element) {
  var loopCharacteristics = getLoopCharacteristics(element);
  return (
    !!loopCharacteristics && is(loopCharacteristics, "camunda:Collectable")
  );
}

export default function MultiInstanceLoopProps(group, element, bpmnFactory, translate) {
  if (!ensureMultiInstanceSupported(element)) {
    return;
  }

  // multi instance properties
  group.entries = group.entries.concat(
    multiInstanceLoopCharacteristics(element, bpmnFactory, translate)
  );

  // retry time cycle //////////////////////////////////////////////////////////
  group.entries = group.entries.concat(
    jobRetryTimeCycle(
      element,
      bpmnFactory,
      {
        getBusinessObject: getLoopCharacteristics,
        idPrefix: "multiInstance-",
        labelPrefix: translate("Multi Instance "),
      },
      translate
    )
  );
};
