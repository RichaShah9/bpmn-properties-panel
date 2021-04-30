import CustomPropertiesProvider from "./providers/CustomPropertiesProvider";
import CustomReplaceMenuProvider from "./providers/ReplaceMenuProvider";
import BpmnReplace from "./features/replace/BpmnReplace";
import Modeling from "./features/modeling/Modeling";
import BpmnRenderer from "./features/renderer/BpmnRenderer";

export default {
  __init__: ["propertiesProvider", "replaceMenuProvider"],
  bpmnReplace: ["type", BpmnReplace],
  modeling: ["type", Modeling],
  propertiesProvider: ["type", CustomPropertiesProvider],
  replaceMenuProvider: ["type", CustomReplaceMenuProvider],
  bpmnRenderer: ["type", BpmnRenderer],
};
