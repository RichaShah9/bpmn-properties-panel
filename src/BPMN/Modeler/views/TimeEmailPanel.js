import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import find from "lodash/find";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import Select from "../../../components/Select";
import { TextField, Checkbox } from "../properties/components";
import {
  getCustomModels,
  getAllModels,
  getParentMenus,
  getSubMenus,
  getMetaModels,
} from "../../../services/api";
import { translate } from "../../../utils";

const useStyles = makeStyles({
  main: {
    display: "flex",
    flexDirection: "column",
  },
});

export default function ViewAttributePanel({
  id,
  handleAdd,
  element,
  bpmnFactory,
}) {
  const [attributeValue, setAttributeValue] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);
  const [newMenu, setNewMenu] = useState(false);
  const [newUserMenu, setNewUserMenu] = useState(false);
  const [displayStatus, setDisplayStatus] = useState(false);
  const [applyAllModels, setApplyAllModels] = useState(false);
  const [user, setUser] = useState("");

  const classes = useStyles();

  function isExtensionElements(element) {
    return is(element, "bpmn:ExtensionElements");
  }

  function createParent(element, bo) {
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

  const getProperty = React.useCallback(
    (name) => {
      const bo = getBusinessObject(element);
      const extensionElementValues =
        bo.extensionElements && bo.extensionElements.get("values");
      const camundaProperty =
        extensionElementValues &&
        extensionElementValues.find((e) => e.$type === "camunda:Properties");
      let property =
        camundaProperty &&
        camundaProperty.values &&
        camundaProperty.values.find((e) => e.name === name);
      return property && property.value;
    },
    [element]
  );

  const addProperty = (name, value) => {
    const bo = getBusinessObject(element);
    const businessObject = getBusinessObject(element);

    let parent;
    let result = createParent(element, bo);
    parent = result.parent;
    let properties = getPropertiesElement(parent);
    if (!properties) {
      properties = elementHelper.createElement(
        "camunda:Properties",
        {},
        parent,
        bpmnFactory
      );
    }

    let propertyProps = {
      name: name,
      value: value,
    };

    let property = elementHelper.createElement(
      "camunda:Property",
      propertyProps,
      properties,
      bpmnFactory
    );

    let camundaProps = bpmnFactory.create("camunda:Properties");
    camundaProps.get("values").push(property);
    if (!businessObject.extensionElements) {
      businessObject.extensionElements = bpmnFactory.create(
        "bpmn:ExtensionElements"
      );
      businessObject.extensionElements.get("values").push(camundaProps);
    } else {
      const extensionElementValues = businessObject.extensionElements.get(
        "values"
      );
      const camundaProperty = extensionElementValues.find(
        (e) => e.$type === "camunda:Properties"
      );
      if (camundaProperty.values) {
        camundaProperty.values.push(property);
      } else {
        camundaProperty.values = [property];
      }
    }
  };

  const updateValue = (name, value, optionLabel = "name") => {
    addProperty(name, value[optionLabel]);
    addProperty(`${name}Id`, value[id]);
  };

  const getSelectValue = (name) => {
    let id = getProperty(`${name}Id`);
    if (id) {
      return { id };
    } else {
      return null;
    }
  };

  useEffect(() => {
    const attributeValue = getProperty("attributeValue");
    const emailNotification = getProperty("emailNotification");
    const newMenu = getProperty("newMenu");
    const newUserMenu = getProperty("newUserMenu");
    const displayStatus = getProperty("displayStatus");
    const applyAllModels = getProperty("applyAllModels");
    setAttributeValue(attributeValue);
    setEmailNotification(emailNotification);
    setNewMenu(newMenu);
    setNewUserMenu(newUserMenu);
    setDisplayStatus(displayStatus);
    setApplyAllModels(applyAllModels);
  }, [getProperty]);

  return (
    <div className={classes.main}>
      <Checkbox
        element={element}
        entry={{
          id: "attributeValue",
          label: translate("Attribute value"),
          modelProperty: "attributeValue",
          get: function (element) {
            return {
              attributeValue: attributeValue,
            };
          },
          set: function (e, value) {
            setAttributeValue(!value.attributeValue);
            addProperty("attributeValue", !value.attributeValue);
          },
        }}
      />
      {attributeValue && (
        <TextField
          element={element}
          canRemove={true}
          entry={{
            id: "taskEmailTitle",
            name: "taskEmailTitle",
            label: translate("Task/email title"),
            modelProperty: "taskEmailTitle",
            get: function () {
              return {
                taskEmailTitle: getProperty("taskEmailTitle") || "",
              };
            },
            set: function (e, value) {
              addProperty("taskEmailTitle", value.taskEmailTitle);
            },
          }}
        />
      )}
      <TextField
        element={element}
        canRemove={true}
        entry={{
          id: "user",
          name: "user",
          label: translate("User"),
          modelProperty: "user",
          get: function () {
            return {
              user: getProperty("user") || "",
            };
          },
          set: function (e, value) {
            setUser(value.user);
            addProperty("user", value.user);
          },
        }}
      />
      <Checkbox
        element={element}
        entry={{
          id: "emailNotification",
          label: translate("Email notification"),
          modelProperty: "emailNotification",
          get: function (element) {
            return {
              emailNotification: emailNotification,
            };
          },
          set: function (e, value) {
            setEmailNotification(!value.emailNotification);
            addProperty("emailNotification", !value.emailNotification);
          },
        }}
      />
      <Checkbox
        element={element}
        entry={{
          id: "newMenu",
          label: translate("New menu"),
          modelProperty: "newMenu",
          get: function () {
            return {
              newMenu: newMenu,
            };
          },
          set: function (e, value) {
            setNewMenu(!value.newMenu);
            addProperty("newMenu", !value.newMenu);
          },
        }}
      />
      {newMenu && (
        <React.Fragment>
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "menuName",
              name: "menuName",
              modelProperty: "menuName",
              label: translate("Menu name"),
              get: function () {
                return {
                  newMenu: getProperty("menuName") || "",
                };
              },
              set: function (e, value) {
                addProperty("menuName", value.menuName);
              },
            }}
          />
          <Select
            fetchMethod={() => getParentMenus()}
            update={(value) => {
              updateValue("menuParent", value);
            }}
            name="menuParent"
            value={getSelectValue("menuParent")}
            optionLabel="name"
            label="Menu parent"
          />
          <h6>Position</h6>
          <Select
            update={(value) => updateValue("position", value)}
            name="position"
            value={getSelectValue("position")}
            optionLabel="name"
            label="Position"
            options={[
              { name: "After", value: "after" },
              { name: "Before", value: "before" },
            ]}
          />
          <Select
            fetchMethod={() => getSubMenus(getSelectValue("menuParent"))}
            update={(value) => updateValue("subMenu", value)}
            name="subMenu"
            value={getSelectValue("model")}
            optionLabel="name"
            label="Sub menu"
          />
        </React.Fragment>
      )}
      {user && user.toLowerCase() === "current user" && (
        <React.Fragment>
          <Checkbox
            element={element}
            entry={{
              id: "newUserMenu",
              label: translate("New user menu"),
              modelProperty: "newUserMenu",
              get: function (element) {
                return {
                  newUserMenu: newUserMenu,
                };
              },
              set: function (e, value) {
                setNewUserMenu(!value, newUserMenu);
                addProperty("newUserMenu", !value.newUserMenu);
              },
            }}
          />
          {newUserMenu && (
            <React.Fragment>
              <TextField
                element={element}
                canRemove={true}
                entry={{
                  id: "userMenuName",
                  name: "userMenuName",
                  label: translate("User menu name"),
                  modelProperty: "userMenuName",
                  get: function () {
                    return {
                      userMenuName: getProperty("userMenuName") || "",
                    };
                  },
                  set: function (e, value) {
                    addProperty("userMenuName", value.userMenuName);
                  },
                }}
              />
              <Select
                fetchMethod={() => getParentMenus()}
                update={(value) => updateValue("userParentMenu", value)}
                name="userParentMenu"
                value={getSelectValue("userParentMenu")}
                optionLabel="name"
                label="User Parent menu"
              />
              <h6>Position</h6>
              <Select
                name="userPosition"
                value={getSelectValue("userPosition")}
                optionLabel="name"
                label="Position"
                update={(value) => updateValue("userPosition", value)}
                options={[
                  { name: "After", value: "after" },
                  { name: "Before", value: "before" },
                ]}
              />
              <Select
                update={(value) => updateValue("userPositionSubMenu", value)}
                fetchMethod={() => getSubMenus(getSelectValue("userParentValue"))}
                name="userPositionSubMenu"
                value={getSelectValue("userPositionSubMenu")}
                optionLabel="name"
                label="Sub menu"
              />
              <h6>Model</h6>
              <Select
                fetchMethod={() => getMetaModels()}
                update={(value) => updateValue("metaModel", value)}
                name="metaModel"
                value={getSelectValue("metaModel")}
                optionLabel="name"
                label="Model"
              />
              <Select
                fetchMethod={() => getCustomModels()}
                update={(value) => updateValue("metaJsonModel", value)}
                name="metaJsonModel"
                value={getSelectValue("metaJsonModel")}
                optionLabel="name"
                label="Custom model"
              />
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      <Checkbox
        element={element}
        entry={{
          id: "displayStatus",
          label: translate("Display status"),
          modelProperty: "displayStatus",
          get: function (element) {
            return {
              displayStatus: displayStatus,
            };
          },
          set: function (e, value) {
            setDisplayStatus(!value.displayStatus);
            addProperty("displayStatus", !value.displayStatus);
          },
        }}
      />
      {displayStatus && (
        <React.Fragment>
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "statusTitle",
              name: "statusTitle",
              label: translate("Status title"),
              modelProperty: "statusTitle",
              get: function () {
                return {
                  statusTitle: getProperty("statusTitle") || "",
                };
              },
              set: function (e, value) {
                addProperty("statusTitle", value.statusTitle);
              },
            }}
          />
          <Checkbox
            element={element}
            entry={{
              id: "applyAllModels",
              label: translate("Apply all models"),
              modelProperty: "applyAllModels",
              get: function (element) {
                return {
                  applyAllModels: applyAllModels,
                };
              },
              set: function (e, value) {
                setApplyAllModels(!value.applyAllModels);
                addProperty("applyAllModels", !value.applyAllModels);
              },
            }}
          />
          <Select
            update={(value) => {
              console.log(value);
            }}
            name="models"
            value={getSelectValue("models")}
            multiple={true}
            label="Select model"
            optionLabel="name"
            fetchMethod={() => getAllModels()}
          />
        </React.Fragment>
      )}
    </div>
  );
}
