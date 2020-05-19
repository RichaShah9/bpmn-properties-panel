import CustomElementsPropertiesActivator from "bpmn-js-properties-panel/lib/provider/camunda/element-templates/CustomElementsPropertiesActivator";
import ElementTemplates from "bpmn-js-properties-panel/lib/provider/camunda/element-templates/ElementTemplates";
import ElementTemplatesLoader from "bpmn-js-properties-panel/lib/provider/camunda/element-templates/ElementTemplatesLoader";
import cmd from "bpmn-js-properties-panel/lib/provider/camunda/element-templates/cmd";
import CamundaPropertiesProvider from "./CamundaPropertiesProvider";

export default {
  __depends__: [cmd, require("diagram-js/lib/i18n/translate").default],
  __init__: ["customElementsPropertiesActivator", "elementTemplatesLoader"],
  propertiesProvider: ["type", CamundaPropertiesProvider],
  customElementsPropertiesActivator: [
    "type",
    CustomElementsPropertiesActivator,
  ],
  elementTemplates: ["type", ElementTemplates],
  elementTemplatesLoader: ["type", ElementTemplatesLoader],
};
