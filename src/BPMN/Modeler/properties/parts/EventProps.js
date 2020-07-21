import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import error from "./implementation/ErrorEventDefinition";
import forEach from "lodash/forEach";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import message from "./implementation/MessageEventDefinition";
import signal from "./implementation/SignalEventDefinition";
import escalation from "./implementation/EscalationEventDefinition";
import timer from "./implementation/TimerEventDefinition";
import compensation from "./implementation/CompensateEventDefinition";
import condition from "./implementation/ConditionalEventDefinition";

export default function EventProps(
  group,
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let events = [
    "bpmn:StartEvent",
    "bpmn:EndEvent",
    "bpmn:IntermediateThrowEvent",
    "bpmn:BoundaryEvent",
    "bpmn:IntermediateCatchEvent",
  ];

  // Message and Signal Event Definition
  forEach(events, function (event) {
    if (is(element, event)) {
      let messageEventDefinition = eventDefinitionHelper.getMessageEventDefinition(
          element
        ),
        signalEventDefinition = eventDefinitionHelper.getSignalEventDefinition(
          element
        );

      if (messageEventDefinition) {
        message(group, element, bpmnFactory, messageEventDefinition, translate);
      }

      if (signalEventDefinition) {
        signal(group, element, bpmnFactory, signalEventDefinition, translate);
      }
    }
  });

  // Special Case: Receive Task
  if (is(element, "bpmn:ReceiveTask")) {
    message(group, element, bpmnFactory, getBusinessObject(element), translate);
  }

  // Error Event Definition
  let errorEvents = ["bpmn:StartEvent", "bpmn:BoundaryEvent", "bpmn:EndEvent"];

  forEach(errorEvents, function (event) {
    if (is(element, event)) {
      let errorEventDefinition = eventDefinitionHelper.getErrorEventDefinition(
        element
      );

      if (errorEventDefinition) {
        error(group, element, bpmnFactory, errorEventDefinition, translate);
      }
    }
  });

  // Escalation Event Definition
  let escalationEvents = [
    "bpmn:StartEvent",
    "bpmn:BoundaryEvent",
    "bpmn:IntermediateThrowEvent",
    "bpmn:EndEvent",
  ];

  forEach(escalationEvents, function (event) {
    if (is(element, event)) {
      let showEscalationCodeVariable =
        is(element, "bpmn:StartEvent") || is(element, "bpmn:BoundaryEvent");

      // get business object
      let escalationEventDefinition = eventDefinitionHelper.getEscalationEventDefinition(
        element
      );

      if (escalationEventDefinition) {
        escalation(
          group,
          element,
          bpmnFactory,
          escalationEventDefinition,
          showEscalationCodeVariable,
          translate
        );
      }
    }
  });

  // Timer Event Definition
  let timerEvents = [
    "bpmn:StartEvent",
    "bpmn:BoundaryEvent",
    "bpmn:IntermediateCatchEvent",
  ];

  forEach(timerEvents, function (event) {
    if (is(element, event)) {
      // get business object
      let timerEventDefinition = eventDefinitionHelper.getTimerEventDefinition(
        element
      );

      if (timerEventDefinition) {
        timer(group, element, bpmnFactory, timerEventDefinition, translate);
      }
    }
  });

  // Compensate Event Definition
  let compensationEvents = ["bpmn:EndEvent", "bpmn:IntermediateThrowEvent"];

  forEach(compensationEvents, function (event) {
    if (is(element, event)) {
      // get business object
      let compensateEventDefinition = eventDefinitionHelper.getCompensateEventDefinition(
        element
      );

      if (compensateEventDefinition) {
        compensation(
          group,
          element,
          bpmnFactory,
          compensateEventDefinition,
          elementRegistry,
          translate
        );
      }
    }
  });

  // Conditional Event Definition
  let conditionalEvents = [
    "bpmn:StartEvent",
    "bpmn:BoundaryEvent",
    "bpmn:IntermediateThrowEvent",
    "bpmn:IntermediateCatchEvent",
  ];

  if (isAny(element, conditionalEvents)) {
    // get business object
    let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
      element
    );

    if (conditionalEventDefinition) {
      condition(
        group,
        element,
        bpmnFactory,
        conditionalEventDefinition,
        elementRegistry,
        translate
      );
    }
  }
}
