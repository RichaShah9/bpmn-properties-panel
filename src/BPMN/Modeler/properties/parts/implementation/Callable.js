import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import forEach from "lodash/forEach";
import resultVariable from "./ResultVariable";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

let attributeInfo = {
  bpmn: {
    element: "calledElement",
    binding: "camunda:calledElementBinding",
    version: "camunda:calledElementVersion",
    versionTag: "camunda:calledElementVersionTag",
    tenantId: "camunda:calledElementTenantId",
  },

  cmmn: {
    element: "camunda:caseRef",
    binding: "camunda:caseBinding",
    version: "camunda:caseVersion",
    tenantId: "camunda:caseTenantId",
  },

  dmn: {
    element: "camunda:decisionRef",
    binding: "camunda:decisionRefBinding",
    version: "camunda:decisionRefVersion",
    versionTag: "camunda:decisionRefVersionTag",
    tenantId: "camunda:decisionRefTenantId",
  },
};

let mapDecisionResultOptions = [
  {
    name: "singleEntry (TypedValue)",
    value: "singleEntry",
  },
  {
    name: "singleResult (Map<String, Object>)",
    value: "singleResult",
  },
  {
    name: "collectEntries (List<Object>)",
    value: "collectEntries",
  },
  {
    name: "resultList (List<Map<String, Object>>)",
    value: "resultList",
  },
];

let delegateVariableMappingOptions = [
  {
    name: "variableMappingClass",
    value: "variableMappingClass",
  },
  {
    name: "variableMappingDelegateExpression",
    value: "variableMappingDelegateExpression",
  },
];

function getCamundaInWithBusinessKey(element) {
  let camundaIn = [],
    bo = getBusinessObject(element);

  let camundaInParams = extensionElementsHelper.getExtensionElements(
    bo,
    "camunda:In"
  );
  if (camundaInParams) {
    forEach(camundaInParams, function (param) {
      if (param.businessKey !== undefined) {
        camundaIn.push(param);
      }
    });
  }
  return camundaIn;
}

function setBusinessKey(element, text, bpmnFactory) {
  let commands = [];

  let camundaInWithBusinessKey = getCamundaInWithBusinessKey(element);

  if (camundaInWithBusinessKey.length) {
    commands.push(
      cmdHelper.updateBusinessObject(element, camundaInWithBusinessKey[0], {
        businessKey: text,
      })
    );
  } else {
    let bo = getBusinessObject(element),
      extensionElements = bo.extensionElements;

    if (!extensionElements) {
      extensionElements = elementHelper.createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory
      );
      commands.push(
        cmdHelper.updateProperties(element, {
          extensionElements: extensionElements,
        })
      );
    }

    let camundaIn = elementHelper.createElement(
      "camunda:In",
      { businessKey: text },
      extensionElements,
      bpmnFactory
    );

    commands.push(
      cmdHelper.addAndRemoveElementsFromList(
        element,
        extensionElements,
        "values",
        "extensionElements",
        [camundaIn],
        []
      )
    );
  }

  return commands;
}

function deleteBusinessKey(element) {
  let camundaInExtensions = getCamundaInWithBusinessKey(element);
  let commands = [];
  forEach(camundaInExtensions, function (elem) {
    commands.push(
      extensionElementsHelper.removeEntry(
        getBusinessObject(element),
        element,
        elem
      )
    );
  });
  return commands;
}

function isSupportedCallableType(type) {
  return ["bpmn", "cmmn", "dmn"].indexOf(type) !== -1;
}

export default function Callable(element, bpmnFactory, options, translate) {
  let bindingOptions = [
    {
      name: translate("latest"),
      value: "latest",
    },
    {
      name: translate("deployment"),
      value: "deployment",
    },
    {
      name: translate("version"),
      value: "version",
    },
    {
      name: translate("versionTag"),
      value: "versionTag",
    },
  ];

  let getCallableType = options.getCallableType;

  let entries = [];

  function getAttribute(element, prop) {
    let type = getCallableType(element);
    return (attributeInfo[type] || {})[prop];
  }

  function getCallActivityBindingValue(element) {
    let type = getCallableType(element);
    let bo = getBusinessObject(element);
    let attr = (attributeInfo[type] || {}).binding;
    return bo.get(attr);
  }

  function getDelegateVariableMappingType(element) {
    let bo = getBusinessObject(element);

    let boVariableMappingClass = bo.get("camunda:variableMappingClass"),
      boVariableMappingDelegateExpression = bo.get(
        "camunda:variableMappingDelegateExpression"
      );

    let delegateVariableMappingType = "";
    if (typeof boVariableMappingClass !== "undefined") {
      delegateVariableMappingType = "variableMappingClass";
    } else if (typeof boVariableMappingDelegateExpression !== "undefined") {
      delegateVariableMappingType = "variableMappingDelegateExpression";
    }

    return delegateVariableMappingType;
  }

  function getLabel(element){
    let label = "";
    let type = getCallableType(element);
    if (type === "bpmn") {
      label = translate("Called Element");
    } else if (type === "cmmn") {
      label = translate("Case Ref");
    } else if (type === "dmn") {
      label = translate("Decision Ref");
    }
    return label
  }

  entries.push({
    id: "callable-element-ref",
    dataValueLabel: "callableElementLabel",
    modelProperty: "callableElementRef",
    widget: "textField",
    label: getLabel(element),
    get: function (element, node) {
      let callableElementRef;

      let attr = getAttribute(element, "element");
      if (attr) {
        let bo = getBusinessObject(element);
        callableElementRef = bo.get(attr);
      }

      let label = "";
      let type = getCallableType(element);
      if (type === "bpmn") {
        label = translate("Called Element");
      } else if (type === "cmmn") {
        label = translate("Case Ref");
      } else if (type === "dmn") {
        label = translate("Decision Ref");
      }

      return {
        callableElementRef: callableElementRef,
        callableElementLabel: label,
      };
    },

    set: function (element, values, node) {
      let newCallableElementRef = values.callableElementRef;
      let attr = getAttribute(element, "element");

      let props = {};
      props[attr] = newCallableElementRef || "";

      return cmdHelper.updateProperties(element, props);
    },

    validate: function (element, values, node) {
      let elementRef = values.callableElementRef;
      let type = getCallableType(element);
      return isSupportedCallableType(type) && !elementRef
        ? { callableElementRef: translate("Must provide a value") }
        : {};
    },

    hidden: function (element, node) {
      return !isSupportedCallableType(getCallableType(element));
    },
  });

  entries.push({
    id: "callable-binding",
    label: translate("Binding"),
    selectOptions: function (element) {
      let type = getCallableType(element);
      let options;

      if (type === "cmmn") {
        options = bindingOptions.filter(function (bindingOption) {
          return bindingOption.value !== "versionTag";
        });
      } else {
        options = bindingOptions;
      }
      return options;
    },
    modelProperty: "callableBinding",
    widget: "selectBox",
    get: function (element, node) {
      let callableBinding;

      let attr = getAttribute(element, "binding");
      if (attr) {
        let bo = getBusinessObject(element);
        callableBinding = bo.get(attr) || "latest";
      }

      return {
        callableBinding: callableBinding,
      };
    },

    set: function (element, values, node) {
      let binding = values.callableBinding;
      let attr = getAttribute(element, "binding"),
        attrVer = getAttribute(element, "version"),
        attrVerTag = getAttribute(element, "versionTag");

      let props = {};
      props[attr] = binding;

      // set version and versionTag values always to undefined to delete the existing value
      props[attrVer] = undefined;
      props[attrVerTag] = undefined;

      return cmdHelper.updateProperties(element, props);
    },

    hidden: function (element, node) {
      return !isSupportedCallableType(getCallableType(element));
    },
  });

  entries.push({
    id: "callable-version",
    label: translate("Version"),
    modelProperty: "callableVersion",
    widget: "textField",
    get: function (element, node) {
      let callableVersion;

      let attr = getAttribute(element, "version");
      if (attr) {
        let bo = getBusinessObject(element);
        callableVersion = bo.get(attr);
      }

      return {
        callableVersion: callableVersion,
      };
    },

    set: function (element, values, node) {
      let version = values.callableVersion;
      let attr = getAttribute(element, "version");

      let props = {};
      props[attr] = version || undefined;

      return cmdHelper.updateProperties(element, props);
    },

    validate: function (element, values, node) {
      let version = values.callableVersion;

      let type = getCallableType(element);
      return (
        isSupportedCallableType(type) &&
        getCallActivityBindingValue(element) === "version" &&
        (!version ? { callableVersion: translate("Must provide a value") } : {})
      );
    },

    hidden: function (element, node) {
      let type = getCallableType(element);
      return (
        !isSupportedCallableType(type) ||
        getCallActivityBindingValue(element) !== "version"
      );
    },
  });

  entries.push({
    id: "callable-version-tag",
    label: translate("Version Tag"),
    modelProperty: "versionTag",
    widget: "textField",
    get: function (element, node) {
      let versionTag;

      let attr = getAttribute(element, "versionTag");

      if (attr) {
        let bo = getBusinessObject(element);

        versionTag = bo.get(attr);
      }

      return {
        versionTag: versionTag,
      };
    },

    set: function (element, values, node) {
      let versionTag = values.versionTag;

      let attr = getAttribute(element, "versionTag");

      let props = {};

      props[attr] = versionTag || undefined;

      return cmdHelper.updateProperties(element, props);
    },

    validate: function (element, values, node) {
      let versionTag = values.versionTag;

      let type = getCallableType(element);

      return (
        isSupportedCallableType(type) &&
        getCallActivityBindingValue(element) === "versionTag" &&
        (!versionTag ? { versionTag: translate("Must provide a value") } : {})
      );
    },

    hidden: function (element, node) {
      let type = getCallableType(element);

      return (
        !isSupportedCallableType(type) ||
        getCallActivityBindingValue(element) !== "versionTag"
      );
    },
  });

  entries.push({
    id: "tenant-id",
    label: translate("Tenant Id"),
    modelProperty: "tenantId",
    widget: "textField",
    get: function (element, node) {
      let tenantId;

      let attr = getAttribute(element, "tenantId");
      if (attr) {
        let bo = getBusinessObject(element);
        tenantId = bo.get(attr);
      }

      return {
        tenantId: tenantId,
      };
    },

    set: function (element, values, node) {
      let tenantId = values.tenantId;
      let attr = getAttribute(element, "tenantId");

      let props = {};
      props[attr] = tenantId || undefined;

      return cmdHelper.updateProperties(element, props);
    },

    hidden: function (element, node) {
      let type = getCallableType(element);
      return !isSupportedCallableType(type);
    },
  });

  if (is(getBusinessObject(element), "bpmn:CallActivity")) {
    entries.push({
      id: "callable-business-key",
      label: translate("Business Key"),
      modelProperty: "callableBusinessKey",
      widget: "checkbox",
      get: function (element, node) {
        let camundaIn = getCamundaInWithBusinessKey(element);

        return {
          callableBusinessKey: !!(camundaIn && camundaIn.length > 0),
        };
      },

      set: function (element, values, node) {
        if (values.callableBusinessKey) {
          return setBusinessKey(
            element,
            "#{execution.processBusinessKey}",
            bpmnFactory
          );
        } else {
          return deleteBusinessKey(element);
        }
      },
    });
  }

  entries.push({
    id: "business-key-expression",
    label: translate("Business Key Expression"),
    modelProperty: "businessKey",
    widget: "textField",
    get: function (element, node) {
      let camundaInWithBusinessKey = getCamundaInWithBusinessKey(element);

      return {
        businessKey: camundaInWithBusinessKey.length
          ? camundaInWithBusinessKey[0].get("camunda:businessKey")
          : undefined,
      };
    },

    set: function (element, values, node) {
      let businessKey = values.businessKey;

      return setBusinessKey(element, businessKey, bpmnFactory);
    },

    validate: function (element, values, node) {
      let businessKey = values.businessKey;

      return businessKey === ""
        ? { businessKey: translate("Must provide a value") }
        : {};
    },

    hidden: function (element, node) {
      return !getCamundaInWithBusinessKey(element).length;
    },
  });

  entries = entries.concat(
    resultVariable(
      element,
      bpmnFactory,
      {
        id: "dmn-resultVariable",
        getBusinessObject: getBusinessObject,
        getImplementationType: getCallableType,
        hideResultVariable: function (element, node) {
          return getCallableType(element) !== "dmn";
        },
      },
      translate
    )
  );

  entries.push({
    id: "dmn-map-decision-result",
    label: translate("Map Decision Result"),
    selectOptions: mapDecisionResultOptions,
    modelProperty: "mapDecisionResult",
    widget: "selectBox",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      return {
        mapDecisionResult: bo.get("camunda:mapDecisionResult") || "resultList",
      };
    },

    set: function (element, values, node) {
      return cmdHelper.updateProperties(element, {
        "camunda:mapDecisionResult": values.mapDecisionResult || "resultList",
      });
    },

    hidden: function (element, node) {
      let bo = getBusinessObject(element);
      let resultVariable = bo.get("camunda:resultVariable");
      return !(
        getCallableType(element) === "dmn" &&
        typeof resultVariable !== "undefined"
      );
    },
  });

  entries.push({
    id: "delegateVariableMappingType",
    label: translate("Delegate Variable Mapping"),
    selectOptions: delegateVariableMappingOptions,
    emptyParameter: true,
    modelProperty: "delegateVariableMappingType",
    widget: "selectBox",
    get: function (element, node) {
      return {
        delegateVariableMappingType: getDelegateVariableMappingType(element),
      };
    },

    set: function (element, values, node) {
      let delegateVariableMappingType = values.delegateVariableMappingType;

      let props = {
        "camunda:variableMappingClass": undefined,
        "camunda:variableMappingDelegateExpression": undefined,
      };

      if (delegateVariableMappingType === "variableMappingClass") {
        props["camunda:variableMappingClass"] = "";
      } else if (
        delegateVariableMappingType === "variableMappingDelegateExpression"
      ) {
        props["camunda:variableMappingDelegateExpression"] = "";
      }

      return cmdHelper.updateProperties(element, props);
    },

    hidden: function (element, node) {
      return getCallableType(element) !== "bpmn";
    },
  });

  entries.push({
    id: "delegateVariableMapping",
    dataValueLabel: "delegateVariableMappingLabel",
    modelProperty: "delegateVariableMapping",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);

      let label = "";
      let delegateVariableMapping = undefined;
      let type = getDelegateVariableMappingType(element);

      if (type === "variableMappingClass") {
        label = translate("Class");
        delegateVariableMapping = bo.get("camunda:variableMappingClass");
      } else if (type === "variableMappingDelegateExpression") {
        label = translate("Delegate Expression");
        delegateVariableMapping = bo.get(
          "camunda:variableMappingDelegateExpression"
        );
      }

      return {
        delegateVariableMapping: delegateVariableMapping,
        delegateVariableMappingLabel: label,
      };
    },

    set: function (element, values, node) {
      let delegateVariableMapping = values.delegateVariableMapping;

      let attr = "camunda:" + getDelegateVariableMappingType(element);

      let props = {};
      props[attr] = delegateVariableMapping || undefined;

      return cmdHelper.updateProperties(element, props);
    },

    validate: function (element, values, node) {
      let delegateVariableMapping = values.delegateVariableMapping;
      return (
        getCallableType(element) === "bpmn" &&
        (!delegateVariableMapping
          ? { delegateVariableMapping: translate("Must provide a value") }
          : {})
      );
    },

    hidden: function (element, node) {
      return !(
        getCallableType(element) === "bpmn" &&
        getDelegateVariableMappingType(element) !== ""
      );
    },
  });

  return entries;
}
