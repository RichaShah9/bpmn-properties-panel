import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import asyncCapableHelper from "bpmn-js-properties-panel/lib/helper/AsyncCapableHelper";
import { is } from "bpmn-js/lib/util/ModelUtil";

function isAsyncBefore(bo) {
  return asyncCapableHelper.isAsyncBefore(bo);
}

function isAsyncAfter(bo) {
  return asyncCapableHelper.isAsyncAfter(bo);
}

function getFailedJobRetryTimeCycle(bo) {
  return asyncCapableHelper.getFailedJobRetryTimeCycle(bo);
}

function removeFailedJobRetryTimeCycle(bo, element) {
  return asyncCapableHelper.removeFailedJobRetryTimeCycle(bo, element);
}

function createExtensionElements(parent, bpmnFactory) {
  return elementHelper.createElement(
    "bpmn:ExtensionElements",
    { values: [] },
    parent,
    bpmnFactory
  );
}

function createFailedJobRetryTimeCycle(parent, bpmnFactory, cycle) {
  return elementHelper.createElement(
    "camunda:FailedJobRetryTimeCycle",
    { body: cycle },
    parent,
    bpmnFactory
  );
}

export default function JobRetryTimeCycle(
  element,
  bpmnFactory,
  options,
  translate
) {
  let getBusinessObject = options.getBusinessObject;

  let idPrefix = options.idPrefix || "",
    labelPrefix = options.labelPrefix || "";

  let retryTimeCycleEntry = {
    id: idPrefix + "retryTimeCycle",
    label: labelPrefix + translate("Retry Time Cycle"),
    modelProperty: "cycle",
    widget: "textField",
    get: function (element, node) {
      let retryTimeCycle = getFailedJobRetryTimeCycle(
        getBusinessObject(element)
      );
      let value = retryTimeCycle && retryTimeCycle.get("body");
      return {
        cycle: value,
      };
    },

    set: function (element, values, node) {
      let newCycle = values.cycle;
      let bo = getBusinessObject(element);

      if (newCycle === "" || typeof newCycle === "undefined") {
        // remove retry time cycle element(s)
        return removeFailedJobRetryTimeCycle(bo, element);
      }

      let retryTimeCycle = getFailedJobRetryTimeCycle(bo);

      if (!retryTimeCycle) {
        // add new retry time cycle element
        let commands = [];

        let extensionElements = bo.get("extensionElements");
        if (!extensionElements) {
          extensionElements = createExtensionElements(bo, bpmnFactory);
          commands.push(
            cmdHelper.updateBusinessObject(element, bo, {
              extensionElements: extensionElements,
            })
          );
        }

        retryTimeCycle = createFailedJobRetryTimeCycle(
          extensionElements,
          bpmnFactory,
          newCycle
        );
        commands.push(
          cmdHelper.addAndRemoveElementsFromList(
            element,
            extensionElements,
            "values",
            "extensionElements",
            [retryTimeCycle],
            []
          )
        );

        return commands;
      }

      // update existing retry time cycle element
      return cmdHelper.updateBusinessObject(element, retryTimeCycle, {
        body: newCycle,
      });
    },

    hidden: function (element) {
      let bo = getBusinessObject(element);

      if (bo && (isAsyncBefore(bo) || isAsyncAfter(bo))) {
        return false;
      }

      if (is(element, "bpmn:Event")) {
        return !eventDefinitionHelper.getTimerEventDefinition(element);
      }

      return true;
    },
  };

  return [retryTimeCycleEntry];
}
