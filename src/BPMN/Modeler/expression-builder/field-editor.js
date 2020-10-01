import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Selection } from "./component";
import { getSubMetaField } from "./services/api";
import classnames from "classnames";

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
  expression = "GROOVY",
}) {
  const { fieldName = "", allField = [] } = value;
  const [fields, setFields] = React.useState([]);
  const classes = useStyles();

  React.useEffect(() => {
    (async () => {
      const data = await getMetaFields();
      setFields(data);
    })();
  }, [getMetaFields]);

  const join_operator = {
    JS: ".",
    GROOVY: "?.",
  };

  const values = fieldName.split(join_operator[expression]);
  const [startValue] = values;
  const hasManyValues =
    fieldName && values.length > 1 && fields.some((x) => x.name === startValue);
  const relationModel =
    hasManyValues && (fields.find((x) => x.name === startValue) || {}).target;

  function handleChange(value) {
    const isRelationalField =
      value && fields.some((x) => x.name === value.name && x.target);
    onChange(
      {
        name: "fieldName",
        value: `${initValue}${value && value.name}${
          isRelationalField ? join_operator[expression] : ""
        }`,
      },
      editor
    );
    onChange({ name: "fieldType", value: (value && value.type) || "" }, editor);
    onChange({ name: "field", value }, editor);
    if (value && allField.findIndex((f) => f.name === value.name) <= -1) {
      onChange({ name: "allField", value: [...allField, value] }, editor);
    }
  }
  const transformValue = fields && fields.find((f) => f.name === startValue);
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
        />
      )}
    </React.Fragment>
  );
}
