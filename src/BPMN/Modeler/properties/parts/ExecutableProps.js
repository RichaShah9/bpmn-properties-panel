import participantHelper from "bpmn-js-properties-panel/lib/helper/ParticipantHelper";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

export default function ExecutableProps(group, element, translate) {
  let bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && bo.get("processRef"))
  ) {
    let executableEntry = {
      id: "process-is-executable",
      label: translate("Executable"),
      modelProperty: "isExecutable",
      widget: "checkbox",
    };

    // in participants we have to change the default behavior of set and get
    if (is(element, "bpmn:Participant")) {
      executableEntry.get = function (element) {
        return participantHelper.getProcessBusinessObject(
          element,
          "isExecutable"
        );
      };

      executableEntry.set = function (element, values) {
        return participantHelper.modifyProcessBusinessObject(
          element,
          "isExecutable",
          values
        );
      };
    }

    group.entries.push(executableEntry);
  }
}
