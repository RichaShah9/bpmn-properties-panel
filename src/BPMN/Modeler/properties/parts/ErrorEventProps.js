import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import error from "./implementation/ErrorEventDefinition";
import forEach from "lodash/forEach";
import { is } from "bpmn-js/lib/util/ModelUtil";

export default function ErrorEventProps(group, element, bpmnFactory, translate) {
  let errorEvents = ["bpmn:StartEvent", "bpmn:BoundaryEvent", "bpmn:EndEvent"];

  forEach(errorEvents, function (event) {
    if (is(element, event)) {
      let errorEventDefinition = eventDefinitionHelper.getErrorEventDefinition(
        element
      );

      if (errorEventDefinition) {
        let isCatchingErrorEvent =
          is(element, "bpmn:StartEvent") || is(element, "bpmn:BoundaryEvent");

        let showErrorCodeVariable = isCatchingErrorEvent,
          showErrorMessageVariable = isCatchingErrorEvent;

        error(
          group,
          element,
          bpmnFactory,
          errorEventDefinition,
          showErrorCodeVariable,
          showErrorMessageVariable,
          translate
        );
      }
    }
  });
};
