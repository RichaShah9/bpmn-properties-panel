import CustomPropertiesProvider from "./providers/CustomPropertiesProvider";
import CustomReplaceMenuProvider from "./providers/ReplaceMenuProvider";

export default {
  __init__: ["propertiesProvider", "replaceMenuProvider"],
  propertiesProvider: ["type", CustomPropertiesProvider],
  replaceMenuProvider: ["type", CustomReplaceMenuProvider],
};
