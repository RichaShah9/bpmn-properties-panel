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
  const { fieldName = "", allField = [] } = value || {};
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
    let allFieldValues, fieldType, field;
    if (value && allField.findIndex((f) => f.name === value.name) <= -1) {
      let fieldNames = (newFieldName || "").split(".") || [];
      let allFields =
        (allField && allField.filter((f) => fieldNames.includes(f.name))) || [];
      allFieldValues = [...allFields, value];
    } else {
      let fields = [...(allField || [])];
      let fieldNames = (fieldName || "").split(".");
      let initValues = `${initValue}${"."}${startValue}`.split(".");
      fieldNames &&
        fieldNames.length > 0 &&
        fieldNames.forEach((fName) => {
          let index = fields.findIndex((f) => f.name === fName);
          if (index > -1 && !(initValues || []).includes(fName)) {
            fields.splice(index, 1);
          }
        });
      allFieldValues = fields;
      if (fields && fields.length === 1) {
        const val = fields[0];
        fieldType = (val && val.type) || "";
        field = val;
      } else {
        const val = fields[fields.length - 1];
        fieldType = (val && val.type) || "";
        field = val;
      }
    }
    onChange({
      fieldName: newFieldName,
      fieldType: fieldType || (value && value.type),
      field: field || value,
      allField: allFieldValues,
    });
  }
  const transformValue =
    (fields && fields.find((f) => f.name === startValue)) ||
    (allField && allField.find((f) => f.name === startValue));

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      const data = await getMetaFields();
      if (isSubscribed) {
        setFields(data);
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
            allField,
          }}
          onChange={onChange}
          classNames={classNames}
          isParent={relationModel ? true : false}
        />
      )}
    </React.Fragment>
  );
}
