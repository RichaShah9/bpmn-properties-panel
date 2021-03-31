import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";

import { Selection } from "../../expression-builder/component";
import { getSubMetaField } from "../../../../services/api";

const useStyles = makeStyles(() => ({
  MuiAutocompleteRoot: {
    width: "250px",
    marginRight: "10px",
  },
}));

export default function FieldEditor({
  initValue = "",
  getMetaFields,
  onChange,
  value,
  classNames,
  isParent = false,
}) {
  const { fieldName = "" } = value || {};
  const [fields, setFields] = useState([]);
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
    onChange(newFieldName === "" ? undefined : newFieldName, value);
  }
  const transformValue = fields && fields.find((f) => f.name === startValue);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      const data = await getMetaFields();
      if (isSubscribed) {
        setFields(data && data.filter(d => d.type.toLowerCase() === "many_to_one"));
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [getMetaFields]);

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
        <FieldEditor
          getMetaFields={() => {
            return getSubMetaField(relationModel, true, relationJsonModel);
          }}
          initValue={`${initValue}${startValue}${"."}`}
          value={{
            fieldName: values.slice(1).join("."),
          }}
          onChange={onChange}
          classNames={classNames}
          isParent={relationModel ? true : false}
        />
      )}
    </React.Fragment>
  );
}
