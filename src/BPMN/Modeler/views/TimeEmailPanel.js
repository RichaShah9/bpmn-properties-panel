import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Select from "../../../components/Select";
import { TextField, Checkbox } from "../properties/components";
import {
  getAllModels,
  getParentMenus,
  getSubMenus,
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
  allModels: {
    paddingBottom: 10,
  },
});

export default function TimeEmailPanel({ element }) {
  const [createUserAction, setCreateUserAction] = useState(false);
  const [deadlineFieldPath, setDeadlineFieldPath] = useState(null);
  const [emailNotification, setEmailNotification] = useState(false);
  const [newMenu, setNewMenu] = useState(false);
  const [newUserMenu, setNewUserMenu] = useState(false);
  const [displayStatus, setDisplayStatus] = useState(false);
  const [applyAllModels, setApplyAllModels] = useState(false);
  const [userFieldPath, setUserFieldPath] = useState(null);
  const [menuName, setMenuName] = useState(null);
  const [actionEmailTitle, setActionEmailTitle] = useState(null);
  const [menuParent, setMenuParent] = useState(null);
  const [position, setPosition] = useState(null);
  const [positionMenu, setPositionMenu] = useState(null);
  const [userMenuName, setUserMenuName] = useState(null);
  const [userParentMenu, setUserParentMenu] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [userPositionMenu, setUserPositionMenu] = useState(null);
  const [statusTitle, setStatusTitle] = useState(null);
  const [models, setModels] = useState([]);
  const [userSubMenuOptions, setUserSubMenuOptions] = useState([]);
  const [subMenuOptions, setSubMenuOptions] = useState([]);
  const [parentMenuOptions, setParentMenuOptions] = useState([]);
  const [allModelsOptions, setAllModelsOptions] = useState([]);

  const classes = useStyles();

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

  const addModels = (values) => {
    const modelIds = [],
      modelNames = [];
    if (Array.isArray(values)) {
      values &&
        values.forEach((value) => {
          if (!value) {
            setProperty("modelIds", undefined);
            setProperty("modelNames", undefined);
            return;
          }
          modelIds.push(value.id);
          modelNames.push(value.name);
        });
    }
    if (modelIds.length > 0 && modelNames.length > 0) {
      setProperty("modelIds", modelIds.toString());
      setProperty("modelNames", modelNames.toString());
    }
  };

  const updateValue = (name, value, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      setProperty(`${name}Id`, undefined);
      return;
    }
    setProperty(name, value[optionLabel]);
    setProperty(`${name}Id`, value.id);
  };

  const updateMenuValue = (name, value, label, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
    }
    setProperty(`${name}Label`, label);
  };

  const getBool = (val) => {
    if (!val) return false;
    return !!JSON.parse(String(val).toLowerCase());
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
      let id = getProperty(`${name}Id`);
      let label = getProperty(`${name}Label`);
      let newName = getProperty(name);
      if (id) {
        let value = { id: id, name: newName };
        if (label) {
          value.title = label;
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
    const userPosition = getSelectValue("userPosition");
    const userPositionMenu = getSelectValue("userPositionMenu");
    const statusTitle = getProperty("statusTitle");
    const displayStatus = getProperty("displayStatus");
    const applyAllModels = getProperty("applyAllModels");
    const modelIds = getProperty("modelIds");
    const modelNames = getProperty("modelNames");
    const deadlineFieldPath = getProperty("deadlineFieldPath");
    const models = [];
    setCreateUserAction(getBool(createUserAction));
    setEmailNotification(getBool(emailNotification));
    setNewMenu(getBool(newMenu));
    setNewUserMenu(getBool(newUserMenu));
    setDisplayStatus(getBool(displayStatus));
    setMenuName(menuName);
    setApplyAllModels(getBool(applyAllModels));
    setActionEmailTitle(actionEmailTitle);
    setUserFieldPath(userFieldPath);
    setMenuParent(menuParent);
    setPosition(position);
    setPositionMenu(positionMenu);
    setUserMenuName(userMenuName);
    setUserParentMenu(userParentMenu);
    setUserPosition(userPosition);
    setUserPositionMenu(userPositionMenu);
    setStatusTitle(statusTitle);
    setDeadlineFieldPath(deadlineFieldPath);

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
          "menuParentId",
          "menuParentLabel",
          "position",
          "positionId",
          "positionMenu",
          "positionMenuId",
          "positionMenuLabel",
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
          "userParentMenuId",
          "userParentMenuLabel",
          "userPosition",
          "userPositionId",
          "userPositionMenu",
          "userPositionMenuId",
          "userPositionMenuLabel",
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
                setActionEmailTitle(undefined);
                setProperty("actionEmailTitle", undefined);
              }
            },
          }}
        />
        {createUserAction && (
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
      </div>
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
                setUserMenuName(undefined);
                setProperty("userMenuName", undefined);
                setUserParentMenu(undefined);
                updateMenuValue("userParentMenu", undefined);
                setUserPosition(undefined);
                updateValue("userPosition", undefined);
                setUserPositionMenu(undefined);
                updateMenuValue("userPositionMenu", undefined);
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
              name="userPosition"
              value={userPosition}
              optionLabel="name"
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
          </React.Fragment>
        )}
      </div>

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
              setProperty("displayStatus", displayStatus);
              if (displayStatus === false) {
                setStatusTitle(undefined);
                setProperty("statusTitle", undefined);
                setApplyAllModels(false);
                setProperty("applyAllModels", false);
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
                  setProperty("statusTitle", value.statusTitle);
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
                  setProperty("applyAllModels", !value.applyAllModels);
                },
              }}
            />
            <div className={classes.allModels}>
              <label className={classes.label}>
                {translate("Select model")}
              </label>
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
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
