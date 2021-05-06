import CustomPropertiesProvider from "./providers/CustomPropertiesProvider";
import CustomReplaceMenuProvider from "./providers/ReplaceMenuProvider";
import BpmnRenderer from "./features/renderer/BpmnRenderer";

export default {
  __init__: ["propertiesProvider", "replaceMenuProvider"],
  propertiesProvider: ["type", CustomPropertiesProvider],
  replaceMenuProvider: ["type", CustomReplaceMenuProvider],
  bpmnRenderer: ["type", BpmnRenderer],
};
