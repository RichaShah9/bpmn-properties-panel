import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import Paper from "@material-ui/core/Paper";
import classNames from "classnames";
import moment from "moment";
import {
  Select,
  Button,
  Selection,
  DateTimePicker,
  NumberField,
  InputField,
} from "./component";
import {
  combinator,
  operators,
  operators_by_type,
  dateFormat,
  compare_operators,
} from "./data";
import { getData } from "./services/api";
import { isBPMQuery } from "./util";
import FieldEditor from "./field-editor";

const useStyles = makeStyles((theme) => ({
  Container: {
    display: "flex",
  },
  rulesGroupHeader: {
    display: "flex",
  },
  paper: {
    margin: theme.spacing(1, 0),
    padding: theme.spacing(3, 2),
  },
  rules: {
    display: "flex",
  },
  MuiAutocompleteRoot: {
    width: "250px",
    marginRight: "10px",
  },
  disabled: {
    pointerEvents: "none",
    opacity: 0.5,
  },
}));

function RenderRelationalWidget(props) {
  const { operator, editor, internalProps } = props;
  const { onChange, value, ...rest } = internalProps;
  const classes = useStyles();
  if (["like", "notLike"].includes(operator)) {
    return (
      <InputField
        name="fieldValue"
        onChange={(value) =>
          onChange({ name: "fieldValue", value: value }, editor)
        }
        margin="none"
        style={{ marginTop: "15px", width: "250px !important" }}
        value={value}
        {...rest}
      />
    );
  } else if (["in", "notIn"].includes(operator)) {
    const { field } = rest;
    const { targetName } = field;
    const fetchData = async ({ search }) => {
      const data = getData(field.target);
      return data;
    };
    return (
      <Selection
        name="fieldValue"
        title="Value"
        placeholder="Value"
        fetchAPI={fetchData}
        isMulti={true}
        optionLabelKey={targetName}
        onChange={(value) =>
          onChange({ name: "fieldValue", value: value }, editor)
        }
        value={value || []}
        classes={{ root: classes.MuiAutocompleteRoot }}
      />
    );
  } else {
    return null;
  }
}

function RenderSimpleWidget(props) {
  const { Component, operator, editor, internalProps } = props;
  const { onChange, value, value2, classes, style, ...rest } = internalProps;
  if (["=", "!=", ">", ">=", "<", "<=", "like", "notLike"].includes(operator)) {
    return (
      <Component
        name="fieldValue"
        onChange={(value) =>
          onChange({ name: "fieldValue", value: value }, editor)
        }
        value={value}
        style={style}
        {...rest}
      />
    );
  } else if (["between", "notBetween"].includes(operator)) {
    return (
      <React.Fragment>
        <Component
          name="fieldValue"
          style={{ marginRight: 8, ...style }}
          onChange={(value) => onChange({ name: "fieldValue", value }, editor)}
          value={value}
          {...rest}
        />

        <Component
          name="fieldValue2"
          onChange={(value) =>
            onChange({ name: "fieldValue2", value: value }, editor)
          }
          value={value2}
          style={style}
          {...rest}
        />
      </React.Fragment>
    );
  } else {
    return null;
  }
}

function RenderWidget({
  type,
  operator,
  onChange,
  value,
  classes,
  editor,
  ...rest
}) {
  const props = {
    value: value.fieldValue,
    value2: value.fieldValue2,
    onChange,
    ...rest,
  };

  let options = [],
    widgetProps = {};
  switch (type) {
    case "one_to_one":
    case "many_to_one":
    case "many_to_many":
    case "one_to_many":
      return (
        <RenderRelationalWidget
          operator={operator}
          editor={editor}
          internalProps={{ ...props }}
        />
      );
    case "date":
    case "time":
    case "datetime":
      const stringToDate = (value) =>
        value ? moment(value, dateFormat[type]) : null;
      return (
        <RenderSimpleWidget
          Component={DateTimePicker}
          operator={operator}
          editor={editor}
          internalProps={{
            type,
            value: stringToDate(value.fieldValue),
            value2: stringToDate(value.fieldValue2),
            onChange: ({ name, value }, index) =>
              onChange(
                { name, value: value && value.format(dateFormat[type]) },
                index
              ),
            ...rest,
            margin: "none",
            classes,
            style: { marginTop: "15px", width: "250px !important" },
          }}
        />
      );
    case "integer":
    case "long":
    case "decimal":
      options =
        rest.field.selectionList &&
        rest.field.selectionList.map(({ title, value, data }) => ({
          name: (data && data.value) || value,
          title: title,
        }));

      widgetProps = {
        Component: options ? Select : NumberField,
        operator,
        editor,
        internalProps: {
          ...(options
            ? { options, classes, ...props }
            : {
                type,
                ...props,
                margin: "none",
                classes,
                style: { marginTop: "15px", width: "250px !important" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
    case "enum":
      options = rest.field.selectionList.map(({ title, value, data }) => ({
        name: (data && data.value) || value,
        title: title,
      }));
      return (
        <RenderSimpleWidget
          Component={Select}
          operator={operator}
          editor={editor}
          internalProps={{
            options,
            classes,
            ...props,
          }}
        />
      );
    default:
      options =
        rest.field.selectionList &&
        rest.field.selectionList.map(({ title, value, data }) => ({
          name: (data && data.value) || value,
          title: title,
        }));
      widgetProps = {
        Component: options ? Select : InputField,
        operator,
        editor,
        internalProps: {
          ...(options
            ? { options, classes, ...props }
            : {
                classes,
                ...props,
                margin: "none",
                style: { marginTop: "15px", width: "250px !important" },
              }),
        },
      };
      return <RenderSimpleWidget {...widgetProps} />;
  }
}

function Rule(props) {
  const {
    getMetaFields,
    onChange,
    onRemoveRule,
    editor,
    value,
    expression,
    parentCombinator,
    parentType,
  } = props;
  const {
    fieldType = "",
    field,
    operator,
    fieldValue,
    fieldValue2 = "",
  } = value;
  const classes = useStyles();
  const type = fieldType.toLowerCase();

  const addOperatorByType = (keys, value) => {
    keys.map((key) => (operators_by_type[key] = value));
  };

  addOperatorByType(
    ["long", "decimal", "date", "time", "datetime"],
    operators_by_type.integer
  );
  addOperatorByType(["one_to_many"], operators_by_type.text);
  addOperatorByType(
    ["one_to_one", "many_to_one", "many_to_many"],
    ["in", "notIn", "isNull"] //'like', 'notLike',
  );

  let operatorsOptions = operators.filter((item) =>
    (operators_by_type[type] || []).includes(item.name)
  );

  return (
    <div className={classes.rules}>
      <FieldEditor
        getMetaFields={getMetaFields}
        editor={editor}
        onChange={onChange}
        value={value}
        expression={expression}
        type={parentType}
      />
      {!compare_operators.includes(parentCombinator) && (
        <Select
          name="operator"
          title="Operator"
          options={operatorsOptions}
          onChange={(value) => {
            onChange({ name: "operator", value }, editor);
          }}
          value={operator}
        />
      )}
      {!compare_operators.includes(parentCombinator) && operator && (
        <RenderWidget
          type={type}
          operator={operator}
          onChange={onChange}
          value={{ fieldValue, fieldValue2 }}
          classes={classes}
          editor={editor}
          field={field}
        />
      )}
      <Button Icon={DeleteIcon} onClick={onRemoveRule} />
    </div>
  );
}

export default function Editor({
  onAddGroup,
  isRemoveGroup,
  onRemoveGroup,
  onAddRule,
  onRemoveRule,
  editor = {},
  getChildEditors,
  onChange,
  getMetaFields,
  isDisable,
  expression,
  parentCombinator,
  type,
}) {
  const classes = useStyles();
  const [isBPM, setBPM] = useState(false);
  const { id, rules = [] } = editor;
  const childEditors = getChildEditors(editor.id);

  useEffect(() => {
    const isBPM = isBPMQuery(type);
    setBPM(isBPM);
  }, [type]);

  return (
    <Paper
      variant="outlined"
      className={classNames(classes.paper, isDisable && classes.disabled)}
    >
      {!compare_operators.includes(parentCombinator) && (
        <div className={classNames(classes.rulesGroupHeader)}>
          <Select
            name="combinator"
            title="Combinator"
            options={combinator}
            value={editor.combinator}
            onChange={(value) =>
              onChange({ name: "combinator", value }, editor)
            }
          />
          <Button title="Rules" Icon={AddIcon} onClick={() => onAddRule(id)} />
          {!isBPM && (
            <Button
              title="Group"
              Icon={AddIcon}
              onClick={() => onAddGroup(id)}
            />
          )}
          {isRemoveGroup && (
            <Button
              title="Group"
              Icon={DeleteIcon}
              onClick={() => onRemoveGroup(id)}
            />
          )}
        </div>
      )}
      {rules.map((rule, i) => (
        <React.Fragment key={i}>
          <Rule
            getMetaFields={getMetaFields}
            onRemoveRule={() => onRemoveRule(editor.id, i)}
            onChange={(e, editor) => onChange(e, editor, i)}
            editor={editor}
            value={rule}
            expression={expression}
            parentCombinator={parentCombinator}
            parentType={type}
          />
        </React.Fragment>
      ))}
      {childEditors.map((editor, i) => (
        <React.Fragment key={editor.id}>
          <Editor
            isRemoveGroup={true}
            onAddGroup={onAddGroup}
            onRemoveGroup={onRemoveGroup}
            onAddRule={onAddRule}
            onRemoveRule={onRemoveRule}
            getChildEditors={getChildEditors}
            getMetaFields={getMetaFields}
            onChange={(e, editor, i) => onChange(e, editor, i)}
            editor={editor}
            parentCombinator={parentCombinator}
            type={type}
          />
        </React.Fragment>
      ))}
    </Paper>
  );
}
