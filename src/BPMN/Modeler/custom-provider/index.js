import CustomPropertiesProvider from "./providers/CustomPropertiesProvider";
import Comments from "./embedded-comments/comments";

export default {
  __init__: ["propertiesProvider", "comments"],
  propertiesProvider: ["type", CustomPropertiesProvider],
  comments: ["type", Comments],
};
