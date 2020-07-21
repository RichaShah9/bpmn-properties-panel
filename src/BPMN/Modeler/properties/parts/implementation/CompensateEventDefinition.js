import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import forEach from "lodash/forEach";
import find from "lodash/find";
import filter from "lodash/filter";

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

// subprocess: only when it is not triggeredByEvent
// activity: only when it attach a compensation boundary event
// callActivity: no limitation
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

  // if throwing compensation event is in an event sub process:
  // get also all activities outside of the event sub process
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

export default function CompensateEventDefinition(
  group,
  element,
  bpmnFactory,
  compensateEventDefinition,
  elementRegistry,
  translate
) {
  group.entries.push({
    id: "wait-for-completion",
    label: translate("Wait for Completion"),
    modelProperty: "waitForCompletion",
    widget: "checkbox",
    get: function (element, node) {
      return {
        waitForCompletion: compensateEventDefinition.waitForCompletion,
      };
    },

    set: function (element, values) {
      values.waitForCompletion = values.waitForCompletion || false;
      return cmdHelper.updateBusinessObject(
        element,
        compensateEventDefinition,
        values
      );
    },
  });

  group.entries.push({
    id: "activity-ref",
    label: translate("Activity Ref"),
    selectOptions: createActivityRefOptions(element),
    modelProperty: "activityRef",
    widget: "selectBox",
    get: function (element, node) {
      let activityRef = compensateEventDefinition.activityRef;
      activityRef = activityRef && activityRef.id;
      return {
        activityRef: activityRef || "",
      };
    },

    set: function (element, values) {
      let activityRef = values.activityRef || undefined;
      activityRef =
        activityRef && getBusinessObject(elementRegistry.get(activityRef));
      return cmdHelper.updateBusinessObject(
        element,
        compensateEventDefinition,
        {
          activityRef: activityRef,
        }
      );
    },
  });
}
