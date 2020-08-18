import React, { useEffect, useState } from "react";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import find from "lodash/find";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import TextField from "../../components/TextField";
import { translate } from "../../../../../utils";

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    border: "1px dotted #ccc",
  },
});

export default function UserTaskProps({
  element,
  index,
  label,
  bpmnFactory,
  bpmnModeler,
}) {
  const [isVisible, setVisible] = useState(false);
  const classes = useStyles();

  const getProperty = (name) => {
    const bo = getBusinessObject(element);
    let camundaProperties = extensionElementsHelper.getExtensionElements(
      bo,
      "camunda:Properties"
    );
    const elements =
      camundaProperties && camundaProperties[0] && camundaProperties[0].values;
    const existingElement =
      elements && elements.find((element) => element.name === name);
    return existingElement && existingElement.value;
  };

  function createParent(element, bo) {
    const bpmnFactory = bpmnModeler.get("bpmnFactory");

    let parent = elementHelper.createElement(
      "bpmn:ExtensionElements",
      { values: [] },
      bo,
      bpmnFactory
    );
    let cmd = cmdHelper.updateBusinessObject(element, bo, {
      extensionElements: parent,
    });
    return {
      cmd: cmd,
      parent: parent,
    };
  }

  const createCamundaProperty = () => {
    const bo = getBusinessObject(element);
    let result = createParent(element, bo);
    let camundaProperties = elementHelper.createElement(
      "camunda:Properties",
      {},
      result && result.parent,
      bpmnFactory
    );
    element.businessObject.extensionElements &&
      element.businessObject.extensionElements.values.push(camundaProperties);
  };

  function isExtensionElements(element) {
    return is(element, "bpmn:ExtensionElements");
  }

  function getPropertiesElementInsideExtensionElements(extensionElements) {
    return find(
      extensionElements.$parent.extensionElements &&
        extensionElements.$parent.extensionElements.values,
      function (elem) {
        return is(elem, "camunda:Properties");
      }
    );
  }

  function getPropertiesElement(element) {
    if (!isExtensionElements(element)) {
      return element.properties;
    } else {
      return getPropertiesElementInsideExtensionElements(element);
    }
  }

  const setValue = (name, value) => {
    const bo = getBusinessObject(element);
    let camundaProperties = extensionElementsHelper.getExtensionElements(
      bo,
      "camunda:Properties"
    );

    let propertyProps = {
      name: name,
      value: value,
    };
    let result = createParent(element, bo);
    let properties = getPropertiesElement(result.parent);

    if (camundaProperties && camundaProperties[0]) {
      const elements = camundaProperties[0].values;
      if (!elements) {
        let property = elementHelper.createElement(
          "camunda:Property",
          propertyProps,
          properties,
          bpmnFactory
        );
        camundaProperties[0].values = [property];
        property.value = value;
      } else {
        const existingElement =
          elements && elements.find((element) => element.name === name);
        if (!existingElement) {
          let property = elementHelper.createElement(
            "camunda:Property",
            propertyProps,
            properties,
            bpmnFactory
          );
          property.value = value;
          elements.push(property);
        } else {
          existingElement.value = value;
        }
      }
    }
  };

  const setProperty = (name, value) => {
    const bo = getBusinessObject(element);
    let extensionElements = bo.extensionElements;
    if (!extensionElements) {
      extensionElements = elementHelper.createElement(
        "bpmn:ExtensionElements",
        { values: [] },
        bo,
        bpmnFactory
      );
      element.businessObject.extensionElements = extensionElements;
      createCamundaProperty();
      setValue(name, value);
    } else {
      let camundaProperties = extensionElementsHelper.getExtensionElements(
        bo,
        "camunda:Properties"
      );
      if (camundaProperties && camundaProperties[0]) {
        setValue(name, value);
      } else {
        createCamundaProperty();
        setValue(name, value);
      }
    }
  };

  useEffect(() => {
    if (is(element, "bpmn:UserTask")) {
      setVisible(true);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <TextField
          element={element}
          entry={{
            id: "completedIf",
            label: translate("Completed If"),
            modelProperty: "completedIf",
            get: function () {
              return {
                completedIf: getProperty("completedIf"),
              };
            },
            set: function (e, values) {
              setProperty("completedIf", values["completedIf"]);
            },
          }}
          canRemove={true}
        />
        <TextField
          element={element}
          entry={{
            id: "buttons",
            label: translate("Buttons"),
            modelProperty: "buttons",
            get: function () {
              return {
                buttons: getProperty("buttons"),
              };
            },
            set: function (e, values) {
              setProperty("buttons", values["buttons"]);
            },
          }}
          canRemove={true}
        />
      </div>
    )
  );
}
