import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Selection } from "./component";
import { getSubMetaField } from "./services/api";
import classnames from "classnames";
import { isBPMQuery, join_operator } from "./util";

const useStyles = makeStyles((theme) => ({
  MuiAutocompleteRoot: {
    width: "250px",
    marginRight: "10px",
  },
}));

export default function FieldEditor({
  initValue = "",
  getMetaFields,
  editor,
  onChange,
  value,
  classNames,
  expression: parentExpression = "GROOVY",
  type,
  isParent = false,
  isBPM,
}) {
  const { fieldName = "", allField = [] } = value || {};
  const [fields, setFields] = useState([]);
  const classes = useStyles();

  const expression = isBPMQuery(type) ? "BPM" : parentExpression;

  const values = fieldName && fieldName.split(join_operator[expression]);
  const [startValue] = values || [];
  const hasManyValues =
    fieldName && isParent && fields.some((x) => x.name === startValue);
  const relationModel =
    hasManyValues && (fields.find((x) => x.name === startValue) || {}).target;

  function handleChange(value) {
    const isRelationalField =
      value && fields.some((x) => x.name === value.name && x.target);
    if (isBPM) {
      let allFields;
      if (value && allField.findIndex((f) => f.name === value.name) <= -1) {
        allFields = [...allField, value];
      }
      onChange(
        {
          name: "fieldName",
          value,
          fieldNameValue: isParent
            ? `${initValue}${value && value.name}`
            : value && value.name
            ? `${
                isRelationalField ? join_operator[expression] : ""
              }${initValue}${value && value.name}`
            : "",
          allField: allFields,
        },
        editor
      );
      return;
    }
    onChange(
      {
        name: "fieldName",
        value: isParent
          ? `${
              initValue && value && value.name
                ? initValue
                : initValue.replace(join_operator[expression], "")
            }${value ? value.name : ""}`
          : value
          ? value.name
          : ""
          ? `${isRelationalField ? join_operator[expression] : ""}${initValue}${
              value ? value.name : ""
            }`
          : "",
      },
      editor
    );
    onChange({ name: "fieldType", value: (value && value.type) || "" }, editor);
    onChange({ name: "field", value }, editor);
    if (value && allField.findIndex((f) => f.name === value.name) <= -1) {
      onChange({ name: "allField", value: [...allField, value] }, editor);
    }
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
          getMetaFields={() => getSubMetaField(relationModel)}
          editor={editor}
          initValue={`${initValue}${startValue}${join_operator[expression]}`}
          value={{
            fieldName: values.slice(1).join(join_operator[expression]),
            allField,
          }}
          onChange={onChange}
          classNames={classNames}
          expression={expression}
          type={type}
          isParent={relationModel ? true : false}
          isBPM={isBPM}
        />
      )}
    </React.Fragment>
  );
}
