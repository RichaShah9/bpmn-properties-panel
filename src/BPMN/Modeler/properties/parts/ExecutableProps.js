import participantHelper from "bpmn-js-properties-panel/lib/helper/ParticipantHelper";
// import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
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

    executableEntry.get = function (element) {
      var bo = getBusinessObject(element),
        res = {};
      res["isExecutable"] = bo.get("isExecutable");
      return res;
    };

    executableEntry.set = function (element, values) {
      // var res = {};
      // res["isExecutable"] = !values["isExecutable"];
      element.businessObject.isExecutable = !values["isExecutable"];
      // return cmdHelper.updateProperties(element, res);
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
        if (!is(element, "bpmn:Participant")) {
          return {};
        }
        var processRef = getBusinessObject(element).get("processRef");
        processRef["isExecutable"] = !values["isExecutable"];
        element.businessObject.processRef = processRef;
      };

      // return participantHelper.modifyProcessBusinessObject(
      //   element,
      //   "isExecutable",
      //   values
      // );
      // };
    }

    group.entries.push(executableEntry);
  }
}
