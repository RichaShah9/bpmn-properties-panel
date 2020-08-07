import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

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

    versionTagEntry.get = function (element) {
      var bo = getBusinessObject(element),
        res = {};
      res["versionTag"] = bo.get("versionTag");
      return res;
    };

    versionTagEntry.set = function (element, values) {
      if (element && element.businessObject) {
        element.businessObject.versionTag = values.versionTag;
      }
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
        if (
          element &&
          element.businessObject &&
          element.businessObject.processRef
        ) {
          element.businessObject.processRef.versionTag = values.versionTag;
        }
      };
    }

    group.entries.push(versionTagEntry);
  }
}
