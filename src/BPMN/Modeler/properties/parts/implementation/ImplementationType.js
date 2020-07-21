import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import assign from "lodash/assign";
import map from "lodash/map";

let DEFAULT_DELEGATE_PROPS = ["class", "expression", "delegateExpression"];

let DELEGATE_PROPS = {
  "camunda:class": undefined,
  "camunda:expression": undefined,
  "camunda:delegateExpression": undefined,
  "camunda:resultVariable": undefined,
};

let DMN_CAPABLE_PROPS = {
  "camunda:decisionRef": undefined,
  "camunda:decisionRefBinding": "latest",
  "camunda:decisionRefVersion": undefined,
  "camunda:mapDecisionResult": "resultList",
  "camunda:decisionRefTenantId": undefined,
};

let EXTERNAL_CAPABLE_PROPS = {
  "camunda:type": undefined,
  "camunda:topic": undefined,
};

export default function ImplementationType(
  element,
  bpmnFactory,
  options,
  translate
) {
  let DEFAULT_OPTIONS = [
    { value: "class", name: translate("Java Class") },
    { value: "expression", name: translate("Expression") },
    { value: "delegateExpression", name: translate("Delegate Expression") },
  ];

  let DMN_OPTION = [{ value: "dmn", name: translate("DMN") }];

  let EXTERNAL_OPTION = [{ value: "external", name: translate("External") }];

  let CONNECTOR_OPTION = [{ value: "connector", name: translate("Connector") }];

  let SCRIPT_OPTION = [{ value: "script", name: translate("Script") }];

  let getType = options.getImplementationType,
    getBusinessObject = options.getBusinessObject;

  let hasDmnSupport = options.hasDmnSupport,
    hasExternalSupport = options.hasExternalSupport,
    hasServiceTaskLikeSupport = options.hasServiceTaskLikeSupport,
    hasScriptSupport = options.hasScriptSupport;

  let entries = [];

  let selectOptions = DEFAULT_OPTIONS.concat([]);

  if (hasDmnSupport) {
    selectOptions = selectOptions.concat(DMN_OPTION);
  }

  if (hasExternalSupport) {
    selectOptions = selectOptions.concat(EXTERNAL_OPTION);
  }

  if (hasServiceTaskLikeSupport) {
    selectOptions = selectOptions.concat(CONNECTOR_OPTION);
  }

  if (hasScriptSupport) {
    selectOptions = selectOptions.concat(SCRIPT_OPTION);
  }

  selectOptions.push({ value: "" });

  entries.push({
    id: "implementation",
    label: translate("Implementation"),
    selectOptions: selectOptions,
    modelProperty: "implType",
    widget: "selectBox",
    get: function (element, node) {
      return {
        implType: getType(element) || "",
      };
    },

    set: function (element, values, node) {
      let bo = getBusinessObject(element);
      let oldType = getType(element);
      let newType = values.implType;

      let props = assign({}, DELEGATE_PROPS);

      if (DEFAULT_DELEGATE_PROPS.indexOf(newType) !== -1) {
        let newValue = "";
        if (DEFAULT_DELEGATE_PROPS.indexOf(oldType) !== -1) {
          newValue = bo.get("camunda:" + oldType);
        }
        props["camunda:" + newType] = newValue;
      }

      if (hasDmnSupport) {
        props = assign(props, DMN_CAPABLE_PROPS);
        if (newType === "dmn") {
          props["camunda:decisionRef"] = "";
        }
      }

      if (hasExternalSupport) {
        props = assign(props, EXTERNAL_CAPABLE_PROPS);
        if (newType === "external") {
          props["camunda:type"] = "external";
          props["camunda:topic"] = "";
        }
      }

      if (hasScriptSupport) {
        props["camunda:script"] = undefined;

        if (newType === "script") {
          props["camunda:script"] = elementHelper.createElement(
            "camunda:Script",
            {},
            bo,
            bpmnFactory
          );
        }
      }

      let commands = [];
      commands.push(cmdHelper.updateBusinessObject(element, bo, props));

      if (hasServiceTaskLikeSupport) {
        let connectors = extensionElementsHelper.getExtensionElements(
          bo,
          "camunda:Connector"
        );
        commands.push(
          map(connectors, function (connector) {
            return extensionElementsHelper.removeEntry(bo, element, connector);
          })
        );

        if (newType === "connector") {
          let extensionElements = bo.get("extensionElements");
          if (!extensionElements) {
            extensionElements = elementHelper.createElement(
              "bpmn:ExtensionElements",
              { values: [] },
              bo,
              bpmnFactory
            );
            commands.push(
              cmdHelper.updateBusinessObject(element, bo, {
                extensionElements: extensionElements,
              })
            );
          }
          let connector = elementHelper.createElement(
            "camunda:Connector",
            {},
            extensionElements,
            bpmnFactory
          );
          commands.push(
            cmdHelper.addAndRemoveElementsFromList(
              element,
              extensionElements,
              "values",
              "extensionElements",
              [connector],
              []
            )
          );
        }
      }

      return commands;
    },
  });

  return entries;
}
