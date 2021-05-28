import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";

import Select from "../../../components/Select";
import { getCustomModels, getMetaModels } from "../../../services/api";
import { translate } from "../../../utils";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
  },
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
    borderTop: "1px dotted #ccc",
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
  metajsonModel: {
    marginTop: 10,
  },
});

export default function ModelProps({ element, label }) {
  const [isVisible, setVisible] = useState(false);
  const [metaModel, setMetaModel] = useState(null);
  const [metaJsonModel, setMetaJsonModel] = useState(null);

  const classes = useStyles();

  const setProperty = React.useCallback(
    (name, value) => {
      let bo = getBusinessObject(element);
      if ((element && element.type) === "bpmn:Participant") {
        bo = getBusinessObject(bo.processRef);
      }
      let propertyName = `camunda:${name}`;
      if (!bo) return;
      if (bo.$attrs) {
        bo.$attrs[propertyName] = value;
      } else {
        bo.$attrs = { [propertyName]: value };
      }
      if (value === undefined) {
        delete bo.$attrs[propertyName];
      }
    },
    [element]
  );

  const updateValue = (name, value, optionLabel = "name") => {
    if (!value) {
      setProperty(name, undefined);
      setProperty(`${name}ModelName`, undefined);
      return;
    }
    setProperty(name, value[optionLabel]);
    setProperty(`${name}ModelName`, value["fullName"] || value["name"]);
  };

  const updateSelectValue = (name, value, label, optionLabel = "name") => {
    updateValue(name, value, optionLabel);
    if (!value) {
      setProperty(`${name}Label`, undefined);
    }
    setProperty(`${name}Label`, label);
  };

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      let bo = getBusinessObject(element);
      return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  const getSelectValue = React.useCallback(
    (name) => {
      let label = getProperty(`${name}Label`);
      let newName = getProperty(name);
      if (newName) {
        let value = { name: newName };
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

  useEffect(() => {
    if (is(element, "dmn:Definitions")) {
      setVisible(true);
    }
  }, [element]);

  useEffect(() => {
    const metaModel = getSelectValue("metaModel");
    const metaJsonModel = getSelectValue("metaJsonModel");
    setMetaModel(metaModel);
    setMetaJsonModel(metaJsonModel);
  }, [getSelectValue]);

  return (
    isVisible && (
      <div className={classes.root}>
        <div className={classes.divider} />
        <div className={classes.groupLabel}>{label}</div>
        <label className={classes.label}>{translate("Model")}</label>
        {!metaJsonModel && (
          <Select
            className={classes.select}
            fetchMethod={() => getMetaModels()}
            update={(value, label) => {
              setMetaModel(value);
              updateSelectValue("metaModel", value, label);
            }}
            name="metaModel"
            value={metaModel}
            isLabel={false}
            placeholder={translate("Model")}
            optionLabel="name"
            optionLabelSecondary="title"
          />
        )}
        {!metaModel && (
          <Select
            className={classnames(classes.select, classes.metajsonModel)}
            fetchMethod={() => getCustomModels()}
            update={(value, label) => {
              setMetaJsonModel(value);
              updateSelectValue("metaJsonModel", value, label);
            }}
            name="metaJsonModel"
            value={metaJsonModel}
            placeholder={translate("Custom model")}
            isLabel={false}
            optionLabel="name"
            optionLabelSecondary="title"
          />
        )}
      </div>
    )
  );
}
