import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

const HIGH_PRIORITY = 1500;
const TASKCOLOR = {
  "bpmn:Task": "#5EAEDA",
  "bpmn:UserTask": "#3f97f6",
  "bpmn:SendTask": "#F79000",
  "bpmn:ReceiveTask": "#F8B200",
  "bpmn:ManualTask": "#B567CA",
  "bpmn:BusinessRuleTask": "#E76092",
  "bpmn:ServiceTask": "#3EBFA5",
  "bpmn:ScriptTask": "#3FC84C",
  "bpmn:CallActivity": "#FBA729",
  "bpmn:SubProcess": "#E4EBF8",
  "bpmn:SequenceFlow": "#8095B3",
};

export default class CustomRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);
    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    return (
      isAny(element, [
        "bpmn:Task",
        "bpmn:Event",
        "bpmn:Gateway",
        "bpmn:CallActivity",
        "bpmn:SequenceFlow",
        "bpmn:SubProcess",
        "bpmn:UserTask",
        "bpmn:SendTask",
        "bpmn:ReceiveTask",
        "bpmn:ManualTask",
        "bpmn:BusinessRuleTask",
        "bpmn:ServiceTask",
        "bpmn:ScriptTask",
        "bpmn:TextAnnotation",
      ]) && !element.labelTarget
    );
  }

  drawConnection(parentNode, element) {
    const shape = this.bpmnRenderer.drawConnection(parentNode, element);
    if (is(element, "bpmn:SequenceFlow")) {
      element.businessObject.di.set("stroke", TASKCOLOR[element.type]);
      return shape;
    }
    return shape;
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    if (is(element, "bpmn:StartEvent")) {
      element.businessObject.di.set("stroke", "#55c041");
      return shape;
    } else if (is(element, "bpmn:EndEvent")) {
      element.businessObject.di.set("stroke", "#ff7043");
      return shape;
    } else if (
      isAny(element, [
        "bpmn:IntermediateThrowEvent",
        "bpmn:IntermediateCatchEvent",
      ])
    ) {
      element.businessObject.di.set("stroke", "#ff9800");
      return shape;
    } else if (is(element, "bpmn:SubProcess")) {
      element.businessObject.di.set("stroke", "#92ACE2");
      element.businessObject.di.set("fill", TASKCOLOR[element.type]);
      return shape;
    } else if (is(element, ["bpmn:Gateway"])) {
      element.businessObject.di.set("fill", "#f9c000");
      element.businessObject.di.set("stroke", "white");
      return shape;
    } else if (is(element, "bpmn:TextAnnotation")) {
      element.businessObject.di.set("stroke", "#A9B1BD");
    } else if (
      isAny(element, [
        "bpmn:UserTask",
        "bpmn:SendTask",
        "bpmn:ReceiveTask",
        "bpmn:ManualTask",
        "bpmn:BusinessRuleTask",
        "bpmn:ServiceTask",
        "bpmn:ScriptTask",
      ])
    ) {
      element.businessObject.di.set("stroke", "#fff");
      element.businessObject.di.set("fill", TASKCOLOR[element.type]);
      return shape;
    } else if (is(element, "bpmn:CallActivity")) {
      element.businessObject.di.set("stroke", "#54657D");
      element.businessObject.di.set("fill", TASKCOLOR[element.type]);
      return shape;
    } else if (is(element, "bpmn:Task")) {
      element.businessObject.di.set("stroke", "#fff");
      element.businessObject.di.set("fill", TASKCOLOR[element.type]);
      return shape;
    }
    return shape;
  }
}

CustomRenderer.$inject = ["eventBus", "bpmnRenderer"];
