import React from "react";
import utils from "bpmn-js-properties-panel/lib/Utils";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import forEach from "lodash/forEach";
import find from "lodash/find";
import filter from "lodash/filter";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import {
  Checkbox,
  SelectBox,
} from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";

function getContainedActivities(element) {
  return getFlowElements(element, "bpmn:Activity");
}

function getContainedBoundaryEvents(element) {
  return getFlowElements(element, "bpmn:BoundaryEvent");
}

function getFlowElements(element, type) {
  return utils.filterElementsByType(element.flowElements, type);
}

function isCompensationEventAttachedToActivity(activity, boundaryEvents) {
  let activityId = activity.id;
  let boundaryEvent = find(boundaryEvents, function (boundaryEvent) {
    let compensateEventDefinition = eventDefinitionHelper.getCompensateEventDefinition(
      boundaryEvent
    );
    let attachedToRef = boundaryEvent.attachedToRef;
    return (
      compensateEventDefinition &&
      attachedToRef &&
      attachedToRef.id === activityId
    );
  });
  return !!boundaryEvent;
}

function canActivityBeCompensated(activity, boundaryEvents) {
  return (
    (is(activity, "bpmn:SubProcess") && !activity.triggeredByEvent) ||
    is(activity, "bpmn:CallActivity") ||
    isCompensationEventAttachedToActivity(activity, boundaryEvents)
  );
}

function getActivitiesForCompensation(element) {
  let boundaryEvents = getContainedBoundaryEvents(element);
  return filter(getContainedActivities(element), function (activity) {
    return canActivityBeCompensated(activity, boundaryEvents);
  });
}

function getActivitiesForActivityRef(element) {
  let bo = getBusinessObject(element);
  let parent = bo.$parent;
  let activitiesForActivityRef = getActivitiesForCompensation(parent);
  if (is(parent, "bpmn:SubProcess") && parent.triggeredByEvent) {
    parent = parent.$parent;
    if (parent) {
      activitiesForActivityRef = activitiesForActivityRef.concat(
        getActivitiesForCompensation(parent)
      );
    }
  }
  return activitiesForActivityRef;
}

function createActivityRefOptions(element) {
  let options = [{ value: "" }];
  let activities = getActivitiesForActivityRef(element);
  forEach(activities, function (activity) {
    let activityId = activity.id;
    let name =
      (activity.name ? activity.name + " " : "") + "(id=" + activityId + ")";
    options.push({ value: activityId, name: name });
  });
  return options;
}

export default function CompensateProps({
  element,
  bpmnFactory,
  bpmnModeler,
  compensateEventDefinition,
}) {
  return (
    <div>
      <Checkbox
        element={element}
        entry={{
          id: "wait-for-completion",
          label: translate("Wait for Completion"),
          modelProperty: "waitForCompletion",
          widget: "checkbox",
          get: function () {
            if (!compensateEventDefinition) return;
            return {
              waitForCompletion: compensateEventDefinition.waitForCompletion,
            };
          },
          set: function (element, values) {
            if (!compensateEventDefinition) return;
            compensateEventDefinition.waitForCompletion =
              !values.waitForCompletion || false;
          },
        }}
      />
      <SelectBox
        element={element}
        entry={{
          id: "activity-ref",
          label: translate("Activity Ref"),
          selectOptions: createActivityRefOptions(element),
          modelProperty: "activityRef",
          get: function () {
            let activityRef = compensateEventDefinition.activityRef;
            activityRef = activityRef && activityRef.id;
            return {
              activityRef: activityRef || "",
            };
          },

          set: function (e, values) {
            let activityRef = values.activityRef || undefined;
            let elementRegistry = bpmnModeler.get("elementRegistry");
            activityRef =
              activityRef &&
              getBusinessObject(
                elementRegistry && elementRegistry.get(activityRef)
              );
            if (!compensateEventDefinition) return;
            compensateEventDefinition.activityRef = activityRef;
          },
        }}
      />
    </div>
  );
}
