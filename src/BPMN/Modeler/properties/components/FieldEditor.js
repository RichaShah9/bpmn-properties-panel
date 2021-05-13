import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import { Close, ArrowForward } from "@material-ui/icons";
import { IconButton, Tooltip } from "@material-ui/core";

import { translate } from "../../../../utils";
import { Selection } from "../../expression-builder/component";
import { getSubMetaField } from "../../../../services/api";

const useStyles = makeStyles(() => ({
  MuiAutocompleteRoot: {
    width: "250px",
    marginRight: "10px",
  },
  iconButton: {
    marginRight: 10,
  },
  icon: {
    color: "#0275d8",
  },
}));

export default function FieldEditor({
  initValue = "",
  getMetaFields,
  onChange,
  value,
  classNames,
  isParent = false,
  isUserPath = false,
  startModel,
  isCollection = false,
}) {
  const { fieldName = "" } = value || {};
  const [fields, setFields] = useState([]);
  const [isShow, setShow] = useState(true);
  const [isButton, setButton] = useState(true);
  const classes = useStyles();
  const values = fieldName && fieldName.split(".");
  const [startValue] = values || [];
  const hasManyValues =
    fieldName &&
    isParent &&
    fields &&
    fields.some((x) => x.name === startValue);
  const relationModel =
    hasManyValues && (fields.find((x) => x.name === startValue) || {}).target;
  const relationJsonModel =
    hasManyValues &&
    (fields.find((x) => x.name === startValue) || {}).jsonTarget;

  function handleChange(value) {
    const isRelationalField =
      value && fields.some((x) => x.name === value.name && x.target);
    let newFieldName = isParent
      ? `${initValue}${value ? value.name : ""}`
      : value
      ? value.name
      : ""
      ? `${isRelationalField ? "." : ""}${initValue}${value ? value.name : ""}`
      : "";
    newFieldName =
      value && value.name ? newFieldName : newFieldName.slice(0, -1);
    onChange(newFieldName === "" ? undefined : newFieldName, value);
  }
  const transformValue = fields && fields.find((f) => f.name === startValue);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      const data = await getMetaFields();
      if (isSubscribed) {
        setFields(
          data &&
            data.filter((d) =>
              isCollection
                ? ["many_to_one", "one_to_many", "many_to_many"].includes(
                    d.type.toLowerCase()
                  )
                : ["many_to_one", "many-to-one"].includes(d.type.toLowerCase())
            )
        );
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [getMetaFields, isCollection]);

  useEffect(() => {
    const values = fieldName && fieldName.split(".");
    const transformValue =
      fields && fields.find((f) => f.name === (values && values[0]));

    const lastValue =
      values && values.length > 0 ? values[values.length - 1] : undefined;

    if (
      isUserPath &&
      transformValue &&
      lastValue &&
      transformValue.name === lastValue &&
      values.length === 1
    ) {
      if (transformValue.target === "com.axelor.auth.db.User") {
        setShow(false);
      } else {
        setShow(true);
      }
    } else if (
      isCollection &&
      transformValue &&
      lastValue &&
      transformValue.name === lastValue &&
      values.length === 1
    ) {
      if (["MANY_TO_MANY", "ONE_TO_MANY"].includes(transformValue.type)) {
        setShow(false);
        setButton(false);
      } else {
        setShow(true);
      }
    } else if (
      startModel &&
      transformValue &&
      lastValue &&
      transformValue.name === lastValue &&
      (startModel.fullName === transformValue.target ||
        startModel.name === transformValue.jsonTarget) &&
      values.length === 1
    ) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [isUserPath, startModel, fields, isCollection, fieldName]);

  return (
    <React.Fragment>
      <Selection
        name="fieldName"
        title="Field Name"
        placeholder="field name"
        options={fields}
        optionLabelKey="name"
        onChange={(value) => handleChange(value)}
        value={transformValue}
        classes={{
          root: classnames(
            classes.MuiAutocompleteRoot,
            classNames && classNames.root
          ),
        }}
      />
      {hasManyValues && relationModel && (
        <React.Fragment>
          {isShow && (
            <IconButton
              size="small"
              onClick={() => {
                setShow((isShow) => !isShow);
                if (fields && fields.length > 0 && startValue) {
                  const previousField = fields.find(
                    (f) => f.name === startValue
                  );
                  handleChange({
                    ...(previousField || {}),
                  });
                }
              }}
              className={classes.iconButton}
            >
              <Tooltip title={translate("Remove sub field")}>
                <Close className={classes.icon} fontSize="small" />
              </Tooltip>
            </IconButton>
          )}
          {isShow && (
            <FieldEditor
              getMetaFields={() => {
                return getSubMetaField(
                  relationModel,
                  relationJsonModel,
                  isCollection
                );
              }}
              initValue={`${initValue}${startValue}${"."}`}
              value={{
                fieldName: values.slice(1).join("."),
              }}
              onChange={onChange}
              classNames={classNames}
              isParent={relationModel ? true : false}
              isUserPath={isUserPath}
              startModel={startModel}
              isCollection={isCollection}
            />
          )}
          {!isShow && isButton && (
            <IconButton
              size="small"
              onClick={() => setShow((isShow) => !isShow)}
              className={classes.iconButton}
            >
              <Tooltip title={translate("Add sub field")}>
                <ArrowForward className={classes.icon} fontSize="small" />
              </Tooltip>
            </IconButton>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
