import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
// import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import forEach from "lodash/forEach";

function getLinkEventDefinition(element) {
  var bo = getBusinessObject(element);

  var linkEventDefinition = null;
  if (bo.eventDefinitions) {
    forEach(bo.eventDefinitions, function (eventDefinition) {
      if (is(eventDefinition, "bpmn:LinkEventDefinition")) {
        linkEventDefinition = eventDefinition;
      }
    });
  }

  return linkEventDefinition;
}

export default function LinkProps(group, element, translate) {
  var linkEvents = [
    "bpmn:IntermediateThrowEvent",
    "bpmn:IntermediateCatchEvent",
  ];

  forEach(linkEvents, function (event) {
    if (is(element, event)) {
      var linkEventDefinition = getLinkEventDefinition(element);

      if (linkEventDefinition) {
        var entry = {
          id: "link-event",
          label: translate("Link Name"),
          modelProperty: "link-name",
          widget: "textField",
        };

        entry.get = function () {
          return { "link-name": linkEventDefinition.get("name") };
        };

        entry.set = function (element, values) {
          // var newProperties = {
          //   name: values["link-name"],
          // };
          // return cmdHelper.updateBusinessObject(
          //   element,
          //   {...linkEventDefinition, name: values["link-name"]},
          //   newProperties
          // );
          element.businessObject.eventDefinitions[0].name = values["link-name"];
        };

        group.entries.push(entry);
      }
    }
  });
}
