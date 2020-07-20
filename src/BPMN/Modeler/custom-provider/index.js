import CustomPropertiesProvider from "./providers/CustomPropertiesProvider";

export default {
  __init__: ["propertiesProvider"],
  propertiesProvider: ["type", CustomPropertiesProvider],
};
