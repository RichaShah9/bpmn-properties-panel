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
  isField,
  setInitialField = () => {},
}) {
  const { fieldName = "", allField = [] } = value || {};
  const [fields, setFields] = useState([]);
  const classes = useStyles();
  const isContextValue = isField === "context" && isBPMQuery(type) && isBPM;
  const expression = isBPMQuery(type) ? "BPM" : parentExpression;
  const values =
    fieldName &&
    join_operator[expression] &&
    fieldName.split(isContextValue ? "?." : join_operator[expression]);
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

  const isM2MField =
    allField &&
    allField.length > 0 &&
    allField.find((f) => f.type === "MANY_TO_MANY");

  const getUpdatedValue = () => {
    let spiltedValues = initValue && initValue.split(join_operator[expression]);
    return (
      spiltedValues &&
      spiltedValues.length > 0 &&
      (spiltedValues.filter(Boolean) || []).join(join_operator[expression])
    );
  };

  function handleChange(value) {
    const isRelationalField =
      value && fields.some((x) => x.name === value.name && x.target);
    if (isBPM) {
      let allFields;
      let newFieldName = isParent
        ? value && value.name
          ? `${initValue}${value.name}`
          : `${getUpdatedValue()}`
        : value && value.name
        ? `${
            isRelationalField
              ? isContextValue
                ? "?."
                : join_operator[expression]
              : ""
          }${initValue}${value.name}`
        : "";
      if (value && allField.findIndex((f) => f.name === value.name) <= -1) {
        let fieldNames =
          (newFieldName || "").split(
            isContextValue ? "?." : join_operator[expression]
          ) || [];
        let filterFields =
          (allField && allField.filter((f) => fieldNames.includes(f.name))) ||
          [];
        allFields = [...filterFields, value];
      } else {
        let fields = [...(allField || [])];
        let fieldNames = (fieldName || "").split(
          isContextValue ? "?." : join_operator[expression]
        );
        fieldNames &&
          fieldNames.length > 0 &&
          fieldNames.forEach((fName) => {
            let index = fields.findIndex((f) => f.name === fName);
            if (index > -1) {
              fields.splice(index, 1);
            }
          });
        allFields = fields;
      }
      onChange(
        {
          name: "fieldName",
          value,
          fieldNameValue: newFieldName ? newFieldName : undefined,
          allField: allFields,
        },
        editor
      );
      return;
    }
    let newFieldName = isParent
      ? `${initValue}${value ? value.name : ""}`
      : value
      ? value.name
      : ""
      ? `${isRelationalField ? join_operator[expression] : ""}${initValue}${
          value ? value.name : ""
        }`
      : "";
    newFieldName = isBPMQuery(type)
      ? value && value.name
        ? newFieldName
        : newFieldName.slice(0, -1)
      : newFieldName;
    onChange(
      {
        name: "fieldName",
        value: newFieldName,
      },
      editor
    );
    onChange({ name: "fieldType", value: (value && value.type) || "" }, editor);
    onChange({ name: "field", value }, editor);
    if (value && allField.findIndex((f) => f.name === value.name) <= -1) {
      let fieldNames =
        (newFieldName || "").split(join_operator[expression]) || [];
      let allFields =
        (allField && allField.filter((f) => fieldNames.includes(f.name))) || [];
      onChange({ name: "allField", value: [...allFields, value] }, editor);
    } else {
      let fields = [...(allField || [])];
      let fieldNames = (fieldName || "").split(join_operator[expression]);
      let initValues = (initValue || "").split(join_operator[expression]);
      fieldNames &&
        fieldNames.length > 0 &&
        fieldNames.forEach((fName) => {
          let index = fields.findIndex((f) => f.name === fName);
          if (index > -1 && !(initValues || []).includes(fName)) {
            fields.splice(index, 1);
          }
        });
      onChange({ name: "allField", value: fields }, editor);
      if (fields && fields.length === 1) {
        const val = fields[0];
        onChange({ name: "fieldType", value: (val && val.type) || "" }, editor);
        onChange({ name: "field", value: val }, editor);
        setInitialField();
      } else {
        const val = fields[fields.length - 1];
        onChange({ name: "fieldType", value: (val && val.type) || "" }, editor);
        onChange({ name: "field", value: val }, editor);
        setInitialField();
      }
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
          getMetaFields={() => {
            return getSubMetaField(
              relationModel,
              !isBPMQuery(type)
                ? isM2MField &&
                    values &&
                    values.length > 0 &&
                    values.includes(isM2MField.name) &&
                    values[0] !== isM2MField.name
                : true,
              isBPMQuery(type),
              relationJsonModel
            );
          }}
          editor={editor}
          initValue={`${initValue}${startValue}${
            isContextValue ? "?." : join_operator[expression]
          }`}
          value={{
            fieldName: values
              .slice(1)
              .join(isContextValue ? "?." : join_operator[expression]),
            allField,
          }}
          onChange={onChange}
          classNames={classNames}
          expression={expression}
          type={type}
          isParent={relationModel ? true : false}
          isBPM={isBPM}
          setInitialField={setInitialField}
          isField={isField}
        />
      )}
    </React.Fragment>
  );
}
