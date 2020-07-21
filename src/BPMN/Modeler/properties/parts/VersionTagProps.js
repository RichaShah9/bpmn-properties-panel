import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

export default function VersionTagProps(group, element, translate) {
  let bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && bo.get("processRef"))
  ) {
    let versionTagEntry = {
      id: "versionTag",
      label: translate("Version Tag"),
      modelProperty: "versionTag",
      widget: "textField",
    };

    // in participants we have to change the default behavior of set and get
    if (is(element, "bpmn:Participant")) {
      versionTagEntry.get = function (element) {
        let processBo = bo.get("processRef");

        return {
          versionTag: processBo.get("camunda:versionTag"),
        };
      };

      versionTagEntry.set = function (element, values) {
        let processBo = bo.get("processRef");

        return cmdHelper.updateBusinessObject(element, processBo, {
          "camunda:versionTag": values.versionTag || undefined,
        });
      };
    }

    group.entries.push(versionTagEntry);
  }
}
