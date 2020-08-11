import React, { useState, useEffect } from "react";
import find from "lodash/find";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { makeStyles } from "@material-ui/core/styles";
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
  container: {
    marginTop: 10,
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  select: {
    margin: 0,
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
  const [user, setUser] = useState(null);
  const [menuName, setMenuName] = useState(null);
  const [taskEmailTitle, setTaskEmailTitle] = useState(null);
  const [menuParent, setMenuParent] = useState(null);
  const [position, setPosition] = useState(null);
  const [subMenu, setSubMenu] = useState(null);
  const [userMenuName, setUserMenuName] = useState(null);
  const [userParentMenu, setUserParentMenu] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [userPositionSubMenu, setUserPositionSubMenu] = useState(null);
  const [metaModel, setMetaModel] = useState(null);
  const [metaJsonModel, setMetaJsonModel] = useState(null);
  const [statusTitle, setStatusTitle] = useState(null);
  const [models, setModels] = useState([]);
  const [userSubMenuOptions, setUserSubMenuOptions] = useState([]);
  const [subMenuOptions, setSubMenuOptions] = useState([]);
  const [customModelOptions, setCustomModelOptions] = useState([]);
  const [metaModelOptions, setMetaModelOptions] = useState([]);
  const [parentMenuOptions, setParentMenuOptions] = useState([]);
  const [allModelsOptions, setAllModelsOptions] = useState([]);

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
      if (!camundaProperty) {
        businessObject.extensionElements.get("values").push(camundaProps);
      }
      const extensionCamundaProperty = extensionElementValues.find(
        (e) => e.$type === "camunda:Properties"
      );
      if (extensionCamundaProperty.values) {
        let prop = extensionCamundaProperty.values.find(
          (e) => (e && e.name) === name
        );
        if (prop) {
          prop.value = value;
        } else {
          extensionCamundaProperty.values.push(property);
        }
      } else {
        extensionCamundaProperty.values = [property];
      }
    }
  };

  const addModels = (values) => {
    const modelIds = [],
      modelNames = [];
    if (Array.isArray(values)) {
      values &&
        values.forEach((value) => {
          if (!value) {
            addProperty("modelIds", undefined);
            addProperty("modelNames", undefined);
            return;
          }
          modelIds.push(value.id);
          modelNames.push(value.name);
        });
    }
    if (modelIds.length > 0 && modelNames.length > 0) {
      addProperty("modelIds", modelIds.toString());
      addProperty("modelNames", modelNames.toString());
    }
  };

  const updateValue = (name, value, optionLabel = "name") => {
    if (!value) {
      addProperty(name, undefined);
      addProperty(`${name}Id`, undefined);
      return;
    }
    addProperty(name, value[optionLabel]);
    addProperty(`${name}Id`, value.id);
  };

  const getBool = (val) => {
    if (!val) return false;
    return !!JSON.parse(String(val).toLowerCase());
  };

  const getSelectValue = React.useCallback(
    (name) => {
      let id = getProperty(`${name}Id`);
      let newName = getProperty(name);
      if (id) {
        let value = { id: id, name: newName };
        return value;
      } else {
        return null;
      }
    },
    [getProperty]
  );

  useEffect(() => {
    async function fetchData() {
      if (newMenu || newUserMenu) {
        const parentMenuOptions = await getParentMenus();
        setParentMenuOptions(parentMenuOptions);
      }
    }
    fetchData();
  }, [newUserMenu, newMenu]);

  useEffect(() => {
    async function fetchData() {
      if (newUserMenu) {
        const customModelOptions = await getCustomModels();
        const metaModelOptions = await getMetaModels();
        setCustomModelOptions(customModelOptions);
        setMetaModelOptions(metaModelOptions);
      }
    }
    fetchData();
  }, [newUserMenu]);

  useEffect(() => {
    async function fetchUserSubMenus() {
      if (newUserMenu && userParentMenu) {
        const userSubMenuOptions = await getSubMenus(userParentMenu);
        setUserSubMenuOptions(userSubMenuOptions);
      }
    }
    fetchUserSubMenus();
  }, [userParentMenu, newUserMenu]);

  useEffect(() => {
    async function fetchSubMenus() {
      if (newMenu && menuParent) {
        const subMenuOptions = await getSubMenus(menuParent);
        setSubMenuOptions(subMenuOptions);
      }
    }
    fetchSubMenus();
  }, [menuParent, newMenu]);

  useEffect(() => {
    async function fetchSubMenus() {
      if (!displayStatus) {
        return;
      }
      const allModelsOptions = await getAllModels();
      setAllModelsOptions(allModelsOptions);
    }
    fetchSubMenus();
  }, [displayStatus]);

  useEffect(() => {
    const attributeValue = getProperty("attributeValue");
    const taskEmailTitle = getProperty("taskEmailTitle");
    const user = getProperty("user");
    const emailNotification = getProperty("emailNotification");
    const newMenu = getProperty("newMenu");
    const menuName = getProperty("menuName");
    const menuParent = getSelectValue("menuParent");
    const position = getSelectValue("position");
    const subMenu = getSelectValue("subMenu");
    const newUserMenu = getProperty("newUserMenu");
    const userMenuName = getProperty("userMenuName");
    const userParentMenu = getSelectValue("userParentMenu");
    const userPosition = getSelectValue("userPosition");
    const userPositionSubMenu = getSelectValue("userPositionSubMenu");
    const metaModel = getSelectValue("metaModel");
    const metaJsonModel = getSelectValue("metaJsonModel");
    const statusTitle = getProperty("statusTitle");
    const displayStatus = getProperty("displayStatus");
    const applyAllModels = getProperty("applyAllModels");
    const modelIds = getProperty("modelIds");
    const modelNames = getProperty("modelNames");
    const models = [];
    setAttributeValue(getBool(attributeValue));
    setEmailNotification(getBool(emailNotification));
    setNewMenu(getBool(newMenu));
    setNewUserMenu(getBool(newUserMenu));
    setDisplayStatus(getBool(displayStatus));
    setMenuName(menuName);
    setApplyAllModels(getBool(applyAllModels));
    setTaskEmailTitle(taskEmailTitle);
    setUser(user);
    setMenuParent(menuParent);
    setPosition(position);
    setSubMenu(subMenu);
    setUserMenuName(userMenuName);
    setUserParentMenu(userParentMenu);
    setUserPosition(userPosition);
    setUserPositionSubMenu(userPositionSubMenu);
    setMetaModel(metaModel);
    setMetaJsonModel(metaJsonModel);
    setStatusTitle(statusTitle);

    if (modelIds && modelNames) {
      const ids = modelIds.split(",");
      const names = modelNames.split(",");
      ids &&
        ids.forEach((id, index) => {
          models.push({
            id: id,
            name: names && names[index],
          });
        });
      setModels(models);
    }
  }, [getProperty, getSelectValue]);

  return (
    <div className={classes.main}>
      <div className={classes.container}>
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
              let attributeValue = !value.attributeValue;
              setAttributeValue(attributeValue);
              addProperty("attributeValue", attributeValue);
              if (attributeValue === false) {
                setTaskEmailTitle(undefined);
                addProperty("taskEmailTitle", undefined);
              }
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
                  taskEmailTitle: taskEmailTitle || "",
                };
              },
              set: function (e, value) {
                setTaskEmailTitle(value.taskEmailTitle);
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
                user: user || "",
              };
            },
            set: function (e, value) {
              setUser(value.user);
              addProperty("user", value.user);
              if ((user && user.toLowerCase()) !== "current user") {
                setNewUserMenu(false);
                addProperty("newUserMenu", false);
                setUserMenuName(undefined);
                addProperty("userMenuName", undefined);
                setUserParentMenu(undefined);
                updateValue("userParentMenu", undefined);
                setUserPosition(undefined);
                updateValue("userPosition", undefined);
                setUserPositionSubMenu(undefined);
                updateValue("userPositionSubMenu", undefined);
                setMetaModel(undefined);
                updateValue("metaModel", undefined);
                setMetaJsonModel(undefined);
                updateValue("metaJsonModel", undefined);
              }
            },
          }}
        />
      </div>
      <div className={classes.container}>
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
      </div>
      <div className={classes.container}>
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
              const newMenu = !value.newMenu;
              setNewMenu(newMenu);
              addProperty("newMenu", newMenu);
              if (newMenu === false) {
                setMenuName(undefined);
                addProperty("menuName", undefined);
                setMenuParent(undefined);
                updateValue("menuParent", undefined);
                setPosition(undefined);
                updateValue("position", undefined);
                setPosition(undefined);
                updateValue("position", undefined);
              }
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
                    menuName: menuName,
                  };
                },
                set: function (e, value) {
                  setMenuName(value.menuName);
                  addProperty("menuName", value.menuName);
                },
              }}
            />
            <label className={classes.label}>{translate("Menu parent")}</label>
            <Select
              className={classes.select}
              options={parentMenuOptions}
              update={(value) => {
                setMenuParent(value);
                updateValue("menuParent", value);
              }}
              name="menuParent"
              value={menuParent}
              optionLabel="name"
              isLabel={false}
              fetchMethod={() => getParentMenus()}
            />
            <label className={classes.label}>{translate("Position")}</label>
            <Select
              className={classes.select}
              update={(value) => {
                setPosition(value);
                updateValue("position", value);
              }}
              name="position"
              value={position}
              optionLabel="name"
              isLabel={false}
              options={[
                { name: "After", id: "after" },
                { name: "Before", id: "before" },
              ]}
            />
            <label className={classes.label}>{translate("Sub menu")}</label>
            <Select
              className={classes.select}
              options={subMenuOptions}
              update={(value) => {
                setPosition(value);
                updateValue("position", value);
              }}
              fetchMethod={() => getSubMenus(menuParent)}
              name="subMenu"
              value={subMenu}
              optionLabel="name"
              isLabel={false}
            />
          </React.Fragment>
        )}
      </div>
      {user && user.toLowerCase() === "current user" && (
        <div className={classes.container}>
          <Checkbox
            element={element}
            entry={{
              id: "newUserMenu",
              label: translate("New user menu"),
              modelProperty: "newUserMenu",
              get: function () {
                return {
                  newUserMenu: newUserMenu,
                };
              },
              set: function (e, value) {
                const newUserMenu = !value.newUserMenu;
                setNewUserMenu(newUserMenu);
                addProperty("newUserMenu", newUserMenu);
                if (newUserMenu === false) {
                  setUserMenuName(undefined);
                  addProperty("userMenuName", undefined);
                  setUserParentMenu(undefined);
                  updateValue("userParentMenu", undefined);
                  setUserPosition(undefined);
                  updateValue("userPosition", undefined);
                  setUserPositionSubMenu(undefined);
                  updateValue("userPositionSubMenu", undefined);
                  setMetaModel(undefined);
                  updateValue("metaModel", undefined);
                  setMetaJsonModel(undefined);
                  updateValue("metaJsonModel", undefined);
                }
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
                      userMenuName: userMenuName,
                    };
                  },
                  set: function (e, value) {
                    setUserMenuName(value.userMenuName);
                    addProperty("userMenuName", value.userMenuName);
                  },
                }}
              />
              <label className={classes.label}>
                {translate("User Parent menu")}
              </label>
              <Select
                className={classes.select}
                options={parentMenuOptions}
                update={(value) => {
                  setUserParentMenu(value);
                  updateValue("userParentMenu", value);
                }}
                fetchMethod={() => getParentMenus()}
                name="userParentMenu"
                value={userParentMenu}
                optionLabel="name"
                label="User Parent menu"
                isLabel={false}
              />
              <label className={classes.label}>{translate("Position")}</label>
              <Select
                className={classes.select}
                name="userPosition"
                value={userPosition}
                optionLabel="name"
                label="Position"
                update={(value) => {
                  setUserPosition(value);
                  updateValue("userPosition", value);
                }}
                isLabel={false}
                options={[
                  { name: "After", id: "after" },
                  { name: "Before", id: "before" },
                ]}
              />
              <label className={classes.label}>{translate("Sub menu")}</label>
              <Select
                className={classes.select}
                update={(value) => {
                  setUserPositionSubMenu(value);
                  updateValue("userPositionSubMenu", value);
                }}
                fetchMethod={() => getSubMenus(userParentMenu)}
                options={userSubMenuOptions}
                name="userPositionSubMenu"
                value={userPositionSubMenu}
                optionLabel="name"
                label="Sub menu"
                isLabel={false}
              />
              <label className={classes.label}>{translate("Model")}</label>
              <Select
                className={classes.select}
                options={metaModelOptions}
                fetchMethod={() => getCustomModels()}
                update={(value) => {
                  setMetaModel(value);
                  updateValue("metaModel", value);
                }}
                name="metaModel"
                value={metaModel}
                optionLabel="name"
                label="Model"
                isLabel={false}
              />
              <Select
                className={classes.select}
                options={customModelOptions}
                update={(value) => {
                  setMetaJsonModel(value);
                  updateValue("metaJsonModel", value);
                }}
                name="metaJsonModel"
                value={metaJsonModel}
                optionLabel="name"
                label="Custom model"
              />
            </React.Fragment>
          )}
        </div>
      )}
      <div className={classes.container}>
        <Checkbox
          element={element}
          entry={{
            id: "displayStatus",
            label: translate("Display status"),
            modelProperty: "displayStatus",
            get: function () {
              return {
                displayStatus: displayStatus,
              };
            },
            set: function (e, value) {
              const displayStatus = !value.displayStatus;
              setDisplayStatus(displayStatus);
              addProperty("displayStatus", displayStatus);
              if (displayStatus === false) {
                setStatusTitle(undefined);
                addProperty("statusTitle", undefined);
                setApplyAllModels(false);
                addProperty("applyAllModels", false);
                setModels([]);
                addModels([]);
              }
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
                    statusTitle: statusTitle || "",
                  };
                },
                set: function (e, value) {
                  setStatusTitle(value.statusTitle);
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
                get: function () {
                  return {
                    applyAllModels: applyAllModels || false,
                  };
                },
                set: function (e, value) {
                  setApplyAllModels(!value.applyAllModels);
                  addProperty("applyAllModels", !value.applyAllModels);
                },
              }}
            />
            <label className={classes.label}>{translate("Select model")}</label>
            <Select
              className={classes.select}
              update={(value) => {
                setModels(value);
                addModels(value);
              }}
              fetchMethod={() => getAllModels()}
              name="models"
              value={models || []}
              multiple={true}
              isLabel={false}
              optionLabel="name"
              options={allModelsOptions}
            />
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
