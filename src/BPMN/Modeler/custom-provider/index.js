import CustomPropertiesProvider from "./providers/CustomPropertiesProvider";
import Comments from "./embedded-comments/comments";
import CustomRenderer from "./providers/CustomRenderer";

export default {
  __init__: ["propertiesProvider", "comments", "customRenderer"],
  propertiesProvider: ["type", CustomPropertiesProvider],
  comments: ["type", Comments],
  customRenderer: ["type", CustomRenderer],
};
