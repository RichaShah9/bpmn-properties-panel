import React, { useState, useEffect } from "react";
import classnames from "classnames";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Select from "../../../../../components/Select";
import { TextField, Checkbox, Table } from "../../components";
import {
  getParentMenus,
  getSubMenus,
  getViews,
  getTemplates,
} from "../../../../../services/api";
import { translate, getBool } from "../../../../../utils";

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
  lastChild: {
    marginBottom: 10,
  },
});

function getContextMap(element) {
  const bo = getBusinessObject(element);
  const extensionElements = bo.extensionElements;
  if (!extensionElements || !extensionElements.values) return null;
  const contextMap = extensionElements.values.find(
    (e) => e.$type === "camunda:ContextMap"
  );
  return contextMap;
}

function createContextMap(parent, bpmnFactory, properties) {
  return createElement("camunda:ContextMap", parent, bpmnFactory, properties);
}

function createParameter(type, parent, bpmnFactory, properties) {
  return createElement(type, parent, bpmnFactory, properties);
}

const addDefinition = (element, entryValue, bpmnFactory) => {
  const bo = element.businessObject;
  let newEntry = createElement(
    "camunda:Entry",
    bo.contextDefinition,
    bpmnFactory,
    entryValue
  );
  return newEntry;
};

const newElement = function (
  type,
  prop,
  element,
  extensionElements,
  bpmnFactory
) {
  const bo = getBusinessObject(element);
  if (!extensionElements) {
    extensionElements = elementHelper.createElement(
      "bpmn:ExtensionElements",
      { values: [] },
      bo,
      bpmnFactory
    );
    element.businessObject.extensionElements = extensionElements;
  }

  const createParameterTypeElem = function (type) {
    return createElement(type, bo, bpmnFactory, { entries: [] });
  };

  let contextMap = getContextMap(element);
  if (!contextMap) {
    let parent = element.businessObject.extensionElements;
    contextMap = createContextMap(parent, bpmnFactory, {
      contextMapParameters: [],
      contextUserMapParameters: [],
    });
    let newElem = createParameter(prop, contextMap, bpmnFactory, {});
    newElem.contextDefinition = createParameterTypeElem("camunda:Map");
    contextMap[type] = [newElem];
    element.businessObject.extensionElements.values.push(contextMap);
  }
};

function createElement(type, parent, factory, properties) {
  return elementHelper.createElement(type, properties, parent, factory);
}

export default function MenuActionPanel({ element, bpmnFactory }) {
  const [createUserAction, setCreateUserAction] = useState(false);
  const [deadlineFieldPath, setDeadlineFieldPath] = useState(null);
  const [emailNotification, setEmailNotification] = useState(false);
  const [newMenu, setNewMenu] = useState(false);
  const [newUserMenu, setNewUserMenu] = useState(false);
  const [userFieldPath, setUserFieldPath] = useState(null);
  const [menuName, setMenuName] = useState(null);
  const [actionEmailTitle, setActionEmailTitle] = useState(null);
  const [menuParent, setMenuParent] = useState(null);
  const [position, setPosition] = useState(null);
  const [positionMenu, setPositionMenu] = useState(null);
  const [userMenuName, setUserMenuName] = useState(null);
  const [userParentMenu, setUserParentMenu] = useState(null);
  const [userMenuPosition, setUserMenuPosition] = useState(null);
  const [userPositionMenu, setUserPositionMenu] = useState(null);
  const [userSubMenuOptions, setUserSubMenuOptions] = useState([]);
  const [subMenuOptions, setSubMenuOptions] = useState([]);
  const [parentMenuOptions, setParentMenuOptions] = useState([]);
  const [tagCount, setTagCount] = useState(false);
  const [userTagCount, setUserTagCount] = useState(false);
  const [model, setModel] = useState(null);
  const [formView, setFormView] = useState(null);
  const [gridView, setGridView] = useState(null);
  const [userFormView, setUserFormView] = useState(null);
  const [userGridView, setUserGridView] = useState(null);
  const [template, setTemplate] = useState(null);
  const classes = useStyles();

  const getContextMapEntries = (field) => {
    const contextMap = getContextMap(element);
    const contextEntries =
      contextMap &&
      contextMap[field] &&
      contextMap[field][0] &&
      contextMap[field][0].contextDefinition &&
      contextMap[field][0].contextDefinition.entries;
    return contextEntries;
  };

  const setProperty = (name, value) => {
    const bo = getBusinessObject(element);
    let propertyName = `camunda:${name}`;
    if (!bo) return;
    if (bo.$attrs) {
      bo.$attrs[propertyName] = value;
    } else {
      bo.$attrs = { [propertyName]: value };
    }
    if (!value) {
      delete bo.$attrs[propertyName];
    }
  };

  const updateValue = (name, value, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      return;
    }
    setProperty(name, value[optionLabel]);
  };

  const updateMenuValue = (name, value, label, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
    }
    setProperty(`${name}Label`, label);
  };

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const getSelectValue = React.useCallback(
    (name) => {
      let label = getProperty(`${name}Label`);
      let fullName = getProperty(`${name}ModelName`);
      let newName = getProperty(name);
      if (newName) {
        let value = { name: newName };
        if (label) {
          value.title = label;
        }
        if (fullName) {
          value.fullName = fullName;
        }
        return value;
      } else {
        return null;
      }
    },
    [getProperty]
  );

  const removeProperty = React.useCallback(
    (arr = []) => {
      let bo = getBusinessObject(element);
      arr.forEach((element) => {
        delete bo.$attrs[`camunda:${element}`];
      });
    },
    [element]
  );

  const getElements = (type) => {
    const entries = getContextMapEntries(type);
    if (entries) {
      return entries;
    }
    return [];
  };

  const updateElement = (value, label, optionIndex, type) => {
    let entries = getContextMapEntries(type);
    if (!entries) return;
    const entry = entries[optionIndex];
    entry[label] = value;
  };

  const addElement = (entryValue, parameterType, type) => {
    const bo = getBusinessObject(element);
    const extensionElements = bo.extensionElements;
    if (extensionElements && extensionElements.values) {
      const contextMap = extensionElements.values.find(
        (e) => e.$type === "camunda:ContextMap"
      );
      if (!contextMap) {
        newElement(
          parameterType,
          type,
          element,
          bo.extensionElements,
          bpmnFactory
        );
      } else {
        if (
          !contextMap[parameterType] ||
          contextMap[parameterType].length === 0
        ) {
          let newElem = createParameter(type, contextMap, bpmnFactory, {});
          newElem.contextDefinition = createElement(
            "camunda:Map",
            bo,
            bpmnFactory,
            { entries: [] }
          );
          contextMap[parameterType] = [newElem];
        }
      }
    } else {
      newElement(
        parameterType,
        type,
        element,
        bo.extensionElements,
        bpmnFactory
      );
    }
    let entry = addDefinition(element, entryValue, bpmnFactory);
    const entries = getContextMapEntries(parameterType);
    if (!entries) return;
    entries.push(entry);
  };

  const removeElement = (optionIndex, entryType, userType) => {
    let userEntries = getContextMapEntries(userType);
    let entries = getContextMapEntries(entryType);
    if (!entries || optionIndex < 0) return;
    entries.splice(optionIndex, 1);
    if (entries.length === 0) {
      const contextMap = getContextMap(element);
      contextMap[entryType] = [];
    }
    if (entries.length === 0 && userEntries && userEntries.length === 0) {
      const bo = getBusinessObject(element);
      const extensionElements = bo.extensionElements;
      if (!extensionElements || !extensionElements.values) return null;
      const contextMapIndex = extensionElements.values.findIndex(
        (e) => e.$type === "camunda:ContextMap"
      );
      if (contextMapIndex < 0) return;
      if (extensionElements && extensionElements.values) {
        extensionElements.values.splice(contextMapIndex, 1);
        if (extensionElements.values.length === 0) {
          bo.extensionElements = undefined;
        }
      }
    }
  };

  function getProcessConfig() {
    let bo =
      element && element.businessObject && element.businessObject.$parent;
    if (element.type === "bpmn:Process") {
      bo = element.businessObject;
    }
    if (
      (element && element.businessObject && element.businessObject.$type) ===
      "bpmn:Participant"
    ) {
      bo =
        element && element.businessObject && element.businessObject.processRef;
    }
    const noOptions = {
      criteria: [
        {
          fieldName: "metaModel.name",
          operator: "IN",
          value: [],
        },
        {
          fieldName: "metaJsonModel.name",
          operator: "IN",
          value: [],
        },
      ],
    };
    const extensionElements = bo && bo.extensionElements;
    if (!extensionElements || !extensionElements.values) return noOptions;
    const processConfigurations = extensionElements.values.find(
      (e) => e.$type === "camunda:ProcessConfiguration"
    );
    const metaModels = [],
      metaJsonModels = [];
    if (
      !processConfigurations &&
      !processConfigurations.processConfigurationParameters
    )
      return noOptions;
    processConfigurations.processConfigurationParameters.forEach((config) => {
      if (config.metaModel) {
        metaModels.push(config.metaModel);
      } else if (config.metaJsonModel) {
        metaJsonModels.push(config.metaJsonModel);
      }
    });

    const criteria = [];
    if (metaModels.length > 0) {
      criteria.push({
        fieldName: "metaModel.name",
        operator: "IN",
        value: metaModels,
      });
    }
    if (metaJsonModels.length > 0) {
      criteria.push({
        fieldName: "metaJsonModel.name",
        operator: "IN",
        value: metaJsonModels,
      });
    }
    const data = {
      criteria: criteria,
      operator: "or",
    };
    return data;
  }

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
    const createUserAction = getProperty("createUserAction");
    const actionEmailTitle = getProperty("actionEmailTitle");
    const userFieldPath = getProperty("userFieldPath");
    const emailNotification = getProperty("emailNotification");
    const newMenu = getProperty("newMenu");
    const menuName = getProperty("menuName");
    const menuParent = getSelectValue("menuParent");
    const position = getSelectValue("position");
    const positionMenu = getSelectValue("positionMenu");
    const newUserMenu = getProperty("newUserMenu");
    const userMenuName = getProperty("userMenuName");
    const userParentMenu = getSelectValue("userParentMenu");
    const userMenuPosition = getSelectValue("userMenuPosition");
    const userPositionMenu = getSelectValue("userPositionMenu");
    const deadlineFieldPath = getProperty("deadlineFieldPath");
    const tagCount = getProperty("tagCount");
    const userTagCount = getProperty("userTagCount");
    const formView = getSelectValue("formView");
    const gridView = getSelectValue("gridView");
    const userFormView = getSelectValue("userFormView");
    const userGridView = getSelectValue("userGridView");
    const template = getSelectValue("template");

    setCreateUserAction(getBool(createUserAction));
    setEmailNotification(getBool(emailNotification));
    setNewMenu(getBool(newMenu));
    setNewUserMenu(getBool(newUserMenu));
    setMenuName(menuName);
    setActionEmailTitle(actionEmailTitle);
    setUserFieldPath(userFieldPath);
    setMenuParent(menuParent);
    setPosition(position);
    setPositionMenu(positionMenu);
    setUserMenuName(userMenuName);
    setUserParentMenu(userParentMenu);
    setUserMenuPosition(userMenuPosition);
    setUserPositionMenu(userPositionMenu);
    setDeadlineFieldPath(deadlineFieldPath);
    setTagCount(getBool(tagCount));
    setUserTagCount(getBool(userTagCount));
    setFormView(formView);
    setGridView(gridView);
    setUserFormView(userFormView);
    setUserGridView(userGridView);
    setTemplate(template);
  }, [getProperty, getSelectValue]);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaJsonModel = getSelectValue("metaJsonModel");
    if (metaModel) {
      setModel({
        ...metaModel,
        type: "metaModel",
      });
    } else if (metaJsonModel) {
      setModel({
        ...metaJsonModel,
        type: "metaJsonModel",
      });
    }
  }, [getSelectValue]);

  useEffect(() => {
    return () => {
      const bo = getBusinessObject(element);
      if (!bo || !bo.$attrs) return;
      if (
        bo.$attrs["camunda:newMenu"] === true &&
        (!bo.$attrs["camunda:menuName"] || !bo.$attrs["camunda:menuParent"])
      ) {
        removeProperty([
          "newMenu",
          "menuName",
          "menuParent",
          "menuParentLabel",
          "position",
          "positionMenu",
          "positionMenuLabel",
          "tagCount",
          "formView",
          "gridView",
        ]);
      }

      if (
        bo.$attrs["camunda:newUserMenu"] === true &&
        (!bo.$attrs["camunda:userMenuName"] ||
          !bo.$attrs["camunda:userParentMenu"])
      ) {
        removeProperty([
          "newUserMenu",
          "userMenuName",
          "userParentMenu",
          "userParentMenuLabel",
          "userMenuPosition",
          "userPositionMenu",
          "userPositionMenuLabel",
          "userTagCount",
          "userFormView",
          "userGridView",
        ]);
      }
    };
  }, [element, removeProperty]);

  return (
    <div className={classes.main}>
      <div className={classes.container}>
        <Checkbox
          element={element}
          entry={{
            id: "createUserAction",
            label: translate("Create user action"),
            modelProperty: "createUserAction",
            get: function () {
              return {
                createUserAction: createUserAction,
              };
            },
            set: function (e, value) {
              let createUserAction = !value.createUserAction;
              setCreateUserAction(createUserAction);
              setProperty("createUserAction", createUserAction);
              if (createUserAction === false) {
                setDeadlineFieldPath(undefined);
                setProperty("deadlineFieldPath", undefined);
                if (emailNotification === false) {
                  setActionEmailTitle(undefined);
                  setProperty("actionEmailTitle", undefined);
                  if (newUserMenu === false) {
                    setUserFieldPath(undefined);
                    setProperty("userFieldPath", undefined);
                  }
                }
              }
            },
          }}
        />
        <div className={classes.container}>
          <Checkbox
            element={element}
            entry={{
              id: "emailNotification",
              label: translate("Email notification"),
              modelProperty: "emailNotification",
              get: function () {
                return {
                  emailNotification: emailNotification,
                };
              },
              set: function (e, value) {
                setEmailNotification(!value.emailNotification);
                setProperty("emailNotification", !value.emailNotification);
                if (emailNotification === false) {
                  setTemplate(undefined);
                  setProperty("template", undefined);
                  if (createUserAction === false) {
                    setActionEmailTitle(undefined);
                    setProperty("actionEmailTitle", undefined);
                    if (newUserMenu === false) {
                      setUserFieldPath(undefined);
                      setProperty("userFieldPath", undefined);
                    }
                  }
                }
              },
            }}
          />
        </div>
        {emailNotification && (
          <React.Fragment>
            <label className={classes.label}>{translate("Template")}</label>
            <Select
              className={classes.select}
              update={(value) => {
                setTemplate(value);
                updateValue("template", value, "name");
              }}
              name="template"
              value={template}
              optionLabel="name"
              isLabel={false}
              fetchMethod={() => getTemplates(getProcessConfig())}
            />
          </React.Fragment>
        )}
        {(createUserAction || emailNotification) && (
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "actionEmailTitle",
              name: "actionEmailTitle",
              label: translate("Action/Email Title"),
              modelProperty: "actionEmailTitle",
              get: function () {
                return {
                  actionEmailTitle: actionEmailTitle || "",
                };
              },
              set: function (e, value) {
                setActionEmailTitle(value.actionEmailTitle);
                setProperty("actionEmailTitle", value.actionEmailTitle);
              },
              validate: function (e, values) {
                if (!values.actionEmailTitle) {
                  return { actionEmailTitle: "Must provide a value" };
                }
              },
            }}
          />
        )}
        {(createUserAction || emailNotification || newUserMenu) && (
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "userFieldPath",
              name: "userFieldPath",
              label: translate("User field path"),
              modelProperty: "userFieldPath",
              get: function () {
                return {
                  userFieldPath: userFieldPath || "",
                };
              },
              set: function (e, value) {
                setUserFieldPath(value.userFieldPath);
                setProperty("userFieldPath", value.userFieldPath);
              },
            }}
          />
        )}
        {createUserAction && (
          <TextField
            element={element}
            canRemove={true}
            entry={{
              id: "deadlineFieldPath",
              name: "deadlineFieldPath",
              label: translate("Deadline field path"),
              modelProperty: "deadlineFieldPath",
              get: function () {
                return {
                  deadlineFieldPath: deadlineFieldPath || "",
                };
              },
              set: function (e, value) {
                setDeadlineFieldPath(value.deadlineFieldPath);
                setProperty("deadlineFieldPath", value.deadlineFieldPath);
              },
            }}
          />
        )}
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
              setProperty("newMenu", newMenu);
              if (newMenu === false) {
                setMenuName(undefined);
                setProperty("menuName", undefined);
                setMenuParent(undefined);
                updateMenuValue("menuParent", undefined);
                setPosition(undefined);
                updateValue("position", undefined);
                setPositionMenu(undefined);
                updateMenuValue("positionMenu", undefined);
                setTagCount(undefined);
                setProperty("tagCount", undefined);
                setFormView(undefined);
                updateMenuValue("formView", undefined);
                setGridView(undefined);
                updateMenuValue("gridView", undefined);
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
                  setProperty("menuName", value.menuName);
                },
                validate: function (e, values) {
                  if (!values.menuName) {
                    return { menuName: "Must provide a value" };
                  }
                },
              }}
            />
            <label className={classes.label}>{translate("Menu parent")}</label>
            <Select
              className={classes.select}
              options={parentMenuOptions}
              update={(value, label) => {
                setMenuParent(value);
                updateMenuValue("menuParent", value, label);
              }}
              name="menuParent"
              value={menuParent}
              optionLabel="title"
              isLabel={false}
              fetchMethod={() => getParentMenus()}
              validate={(values) => {
                if (!values.menuParent) {
                  return { menuParent: "Must provide a value" };
                }
              }}
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
            <label className={classes.label}>
              {translate("Position menu")}
            </label>
            <Select
              className={classes.select}
              options={subMenuOptions}
              update={(value, label) => {
                setPositionMenu(value);
                updateMenuValue("positionMenu", value, label);
              }}
              fetchMethod={() => getSubMenus(menuParent)}
              name="positionMenu"
              value={positionMenu}
              optionLabel="title"
              isLabel={false}
            />
            <Checkbox
              element={element}
              entry={{
                id: "tagCount",
                label: translate("Display tag count ?"),
                modelProperty: "tagCount",
                get: function () {
                  return {
                    tagCount: tagCount,
                  };
                },
                set: function (e, value) {
                  const tagCount = !value.tagCount;
                  setTagCount(tagCount);
                  setProperty("tagCount", tagCount);
                },
              }}
            />
            {model && (
              <React.Fragment>
                <label className={classes.label}>
                  {translate("Grid view")}
                </label>
                <Select
                  className={classes.select}
                  update={(value) => {
                    setGridView(value);
                    updateValue("gridView", value);
                  }}
                  fetchMethod={(criteria) => getViews(model, criteria, "grid")}
                  name="gridView"
                  value={gridView}
                  optionLabel="name"
                  label={translate("Grid view")}
                  isLabel={false}
                />
                <label className={classes.label}>
                  {translate("Form view")}
                </label>
                <Select
                  className={classes.select}
                  update={(value) => {
                    setFormView(value);
                    updateValue("formView", value);
                  }}
                  fetchMethod={(criteria) => getViews(model, criteria)}
                  name="formView"
                  value={formView}
                  optionLabel="name"
                  label={translate("Form view")}
                  isLabel={false}
                />
              </React.Fragment>
            )}
            <Table
              entry={{
                id: "menu-context",
                labels: [translate("Key"), translate("Value")],
                modelProperties: ["key", "value"],
                addLabel: "Add context menu",
                getElements: function () {
                  return getElements("contextMapParameters");
                },
                updateElement: function (value, label, optionIndex) {
                  updateElement(
                    value,
                    label,
                    optionIndex,
                    "contextMapParameters"
                  );
                },
                addElement: function (entryValue) {
                  addElement(
                    entryValue,
                    "contextMapParameters",
                    "camunda:ContextMapParameter"
                  );
                },
                removeElement: function (optionIndex) {
                  removeElement(
                    optionIndex,
                    "contextMapParameters",
                    "contextUserMapParameters"
                  );
                },
              }}
            />
          </React.Fragment>
        )}
      </div>
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
              setProperty("newUserMenu", newUserMenu);
              if (newUserMenu === false) {
                if (createUserAction === false && emailNotification === false) {
                  setUserFieldPath(undefined);
                  setProperty("userFieldPath", undefined);
                }
                setUserMenuName(undefined);
                setProperty("userMenuName", undefined);
                setUserParentMenu(undefined);
                updateMenuValue("userParentMenu", undefined);
                setUserMenuPosition(undefined);
                updateValue("userMenuPosition", undefined);
                setUserPositionMenu(undefined);
                updateMenuValue("userPositionMenu", undefined);
                setUserTagCount(undefined);
                setProperty("userTagCount", undefined);
                setUserFormView(undefined);
                updateMenuValue("userFormView", undefined);
                setUserGridView(undefined);
                updateMenuValue("userGridView", undefined);
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
                  setProperty("userMenuName", value.userMenuName);
                },
                validate: function (e, values) {
                  if (!values.userMenuName) {
                    return { userMenuName: "Must provide a value" };
                  }
                },
              }}
            />
            <label className={classes.label}>
              {translate("User Parent menu")}
            </label>
            <Select
              className={classes.select}
              options={parentMenuOptions}
              update={(value, label) => {
                setUserParentMenu(value);
                updateMenuValue("userParentMenu", value, label);
              }}
              fetchMethod={() => getParentMenus()}
              name="userParentMenu"
              value={userParentMenu}
              optionLabel="title"
              label="User Parent menu"
              isLabel={false}
              validate={(values) => {
                if (!values.userParentMenu) {
                  return { userParentMenu: "Must provide a value" };
                }
              }}
            />
            <label className={classes.label}>{translate("Position")}</label>
            <Select
              className={classes.select}
              name="userMenuPosition"
              value={userMenuPosition}
              optionLabel="name"
              update={(value) => {
                setUserMenuPosition(value);
                updateValue("userMenuPosition", value);
              }}
              isLabel={false}
              options={[
                { name: "After", id: "after" },
                { name: "Before", id: "before" },
              ]}
            />
            <label className={classes.label}>
              {translate("Position menu")}
            </label>
            <Select
              className={classes.select}
              update={(value, label) => {
                setUserPositionMenu(value);
                updateMenuValue("userPositionMenu", value, label);
              }}
              fetchMethod={() => getSubMenus(userParentMenu)}
              options={userSubMenuOptions}
              name="userPositionMenu"
              value={userPositionMenu}
              optionLabel="title"
              isLabel={false}
            />
            <Checkbox
              element={element}
              entry={{
                id: "userTagCount",
                label: translate("Display tag count ?"),
                modelProperty: "userTagCount",
                get: function () {
                  return {
                    userTagCount: userTagCount,
                  };
                },
                set: function (e, value) {
                  const userTagCount = !value.userTagCount;
                  setUserTagCount(userTagCount);
                  setProperty("userTagCount", userTagCount);
                },
              }}
            />
            {model && (
              <React.Fragment>
                <label className={classes.label}>
                  {translate("Grid view")}
                </label>
                <Select
                  className={classes.select}
                  update={(value) => {
                    setUserGridView(value);
                    updateValue("userGridView", value);
                  }}
                  fetchMethod={(criteria) => getViews(model, criteria, "grid")}
                  name="userGridView"
                  value={userGridView}
                  optionLabel="name"
                  label={translate("Grid view")}
                  isLabel={false}
                />
                <label className={classes.label}>
                  {translate("Form view")}
                </label>
                <Select
                  className={classnames(classes.select, classes.lastChild)}
                  update={(value) => {
                    setUserFormView(value);
                    updateValue("userFormView", value);
                  }}
                  fetchMethod={(criteria) => getViews(model, criteria)}
                  name="userFormView"
                  value={userFormView}
                  optionLabel="name"
                  label={translate("Form view")}
                  isLabel={false}
                />
              </React.Fragment>
            )}
            <Table
              entry={{
                id: "menu-user-context",
                labels: [translate("Key"), translate("Value")],
                modelProperties: ["key", "value"],
                addLabel: "Add context menu",
                getElements: function () {
                  return getElements("contextUserMapParameters");
                },
                updateElement: function (value, label, optionIndex) {
                  updateElement(
                    value,
                    label,
                    optionIndex,
                    "contextUserMapParameters"
                  );
                },
                addElement: function (entryValue) {
                  addElement(
                    entryValue,
                    "contextUserMapParameters",
                    "camunda:ContextUserMapParameter"
                  );
                },
                removeElement: function (optionIndex) {
                  removeElement(
                    optionIndex,
                    "contextUserMapParameters",
                    "contextMapParameters"
                  );
                },
              }}
            />
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
