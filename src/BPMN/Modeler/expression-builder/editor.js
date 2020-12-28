import React, { useEffect, useState } from "react";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import Paper from "@material-ui/core/Paper";
import classNames from "classnames";
import moment from "moment";
import { Checkbox, FormControlLabel } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { getModels } from "../../../services/api";

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
import { getData, getMetaFields as getMetaFieldsAPI } from "./services/api";
import { isBPMQuery, lowerCaseFirstLetter, getProcessConfig } from "./util";
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

async function fetchField(metaModals) {
  const fields =
    metaModals &&
    metaModals.metaFields &&
    metaModals.metaFields.map((f) => f.name);
  const allFields = (await getMetaFieldsAPI(fields, metaModals)) || [];
  return allFields.filter(
    (a) => !["button", "separator", "panel"].includes(a.type)
  );
}

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
      const data = await getData(field.target);
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
    isBPM,
    parentMetaModal,
    element,
  } = props;
  const {
    fieldType = "",
    field,
    operator,
    fieldValue,
    allField = [],
    fieldValue2 = "",
    isRelationalValue,
    relatedValueModal,
    relatedValueFieldName,
    relatedElseValueModal,
    relatedElseValueFieldName,
  } = value;
  const classes = useStyles();
  const type = fieldType.toLowerCase();
  const [isField, setField] = useState(isRelationalValue || false);
  const [metaModal, setMetaModal] = useState(relatedValueModal || null);
  const [elseMetaModal, setElseMetaModal] = useState(
    relatedElseValueModal || null
  );

  const getValue = (val) => {
    if (val) {
      let values = val.split(".");
      if (values && values.length > 1) {
        return values.slice(1).join(".");
      } else {
        return val;
      }
    }
  };

  const [elseNameValue, setElseNameValue] = useState({
    allField: allField,
    field: relatedElseValueFieldName,
    fieldName: getValue(fieldValue2),
    fieldType: relatedElseValueFieldName && relatedElseValueFieldName.type,
    fieldValue: "",
    fieldValue2: "",
    operator: "",
    isRelationalValue: isField,
    relatedValueFieldName: relatedValueFieldName,
    relatedValueModal: relatedValueModal,
    relatedElseValueFieldName: relatedElseValueFieldName,
    relatedElseValueModal: relatedElseValueModal,
  });
  const [nameValue, setNameValue] = useState({
    allField: allField,
    field: relatedValueFieldName,
    fieldName: getValue(fieldValue),
    fieldType: relatedValueFieldName && relatedValueFieldName.type,
    fieldValue: "",
    fieldValue2: "",
    operator: "",
    isRelationalValue: isField,
    relatedValueFieldName: relatedValueFieldName,
    relatedValueModal: relatedValueModal,
  });

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

  const handleChange = (name, value) => {
    onChange({ name, value }, editor);
  };

  return (
    <div className={classes.rules}>
      <FieldEditor
        getMetaFields={getMetaFields}
        editor={editor}
        onChange={onChange}
        value={value}
        expression={expression}
        type={parentType}
        isParent={true}
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
      {isBPM && (
        <FormControlLabel
          control={
            <Checkbox
              checked={isField}
              onChange={(e) => {
                setField(e.target.checked);
                handleChange("isRelationalValue", e.target.checked);
                handleChange("fieldValue", null);
                if (!e.target.checked) {
                  handleChange("relatedValueFieldName", null);
                  handleChange("relatedValueModal", null);
                }
              }}
              name="isField"
              color="primary"
            />
          }
          label="Value from context?"
        />
      )}
      {isField ? (
        <React.Fragment>
          <Selection
            name="metaModal"
            title="Meta Modal"
            placeholder="meta modal"
            fetchAPI={() => getModels(getProcessConfig(element))}
            optionLabelKey="name"
            onChange={(e) => {
              setMetaModal(e);
            }}
            value={metaModal}
            classes={{ root: classes.MuiAutocompleteRoot }}
          />
          <FieldEditor
            getMetaFields={() => fetchField(metaModal)}
            editor={editor}
            isField={isField}
            onChange={({ value, fieldNameValue, allField }, editor) => {
              if (!value) return;
              setNameValue({
                allField: allField,
                field: value,
                fieldName: fieldNameValue,
                fieldType: value.type,
                fieldValue: "",
                fieldValue2: "",
                operator: "",
                isRelationalValue: isField,
                relatedValueFieldName: null,
                relatedValueModal: null,
              });
              handleChange("isRelationalValue", isField);
              handleChange("relatedValueFieldName", value);
              handleChange("relatedValueModal", metaModal);
              handleChange("allField", allField);
              handleChange(
                "fieldValue",
                (parentMetaModal && parentMetaModal.id) ===
                  (metaModal && metaModal.id)
                  ? `self.${fieldNameValue}`
                  : `${lowerCaseFirstLetter(
                      metaModal && metaModal.name
                    )}.${fieldNameValue}`
              );
            }}
            value={nameValue}
            expression={expression}
            type={parentType}
            isParent={true}
            isBPM={true}
          />
          {["between", "notBetween"].includes(operator) && (
            <React.Fragment>
              <Selection
                name="metaModal"
                title="Meta Modal Else"
                placeholder="meta modal"
                fetchAPI={() => getModels(getProcessConfig(element))}
                optionLabelKey="name"
                onChange={(e) => {
                  setElseMetaModal(e);
                }}
                value={elseMetaModal}
                classes={{ root: classes.MuiAutocompleteRoot }}
              />
              <FieldEditor
                getMetaFields={() => fetchField(elseMetaModal)}
                editor={editor}
                isField={isField}
                onChange={({ value, fieldNameValue, allField }, editor) => {
                  if (!value) return;
                  setElseNameValue({
                    allField: allField,
                    field: value,
                    fieldName: fieldNameValue,
                    fieldType: value.type,
                    fieldValue: "",
                    fieldValue2: "",
                    operator: "",
                    isRelationalValue: isField,
                    relatedValueFieldName: relatedValueFieldName,
                    relatedValueModal: relatedElseValueModal,
                    relatedElseValueFieldName: relatedElseValueFieldName,
                    relatedElseValueModal: relatedElseValueModal,
                  });
                  handleChange("relatedElseValueFieldName", value);
                  handleChange("relatedElseValueModal", elseMetaModal);
                  handleChange(
                    "fieldValue2",
                    (parentMetaModal && parentMetaModal.id) ===
                      (elseMetaModal && elseMetaModal.id)
                      ? `self.${fieldNameValue}`
                      : `${lowerCaseFirstLetter(
                          elseMetaModal && elseMetaModal.name
                        )}.${fieldNameValue}`
                  );
                }}
                value={elseNameValue}
                expression={expression}
                type={parentType}
                isParent={true}
                isBPM={true}
              />
            </React.Fragment>
          )}
        </React.Fragment>
      ) : (
        !compare_operators.includes(parentCombinator) &&
        operator && (
          <RenderWidget
            type={type}
            operator={operator}
            onChange={(e, editor) => {
              onChange(e, editor);
              handleChange("isRelationalValue", false);
              handleChange("relatedValueFieldName", null);
              handleChange("relatedValueModal", null);
            }}
            value={{ fieldValue, fieldValue2 }}
            classes={classes}
            editor={editor}
            field={field}
          />
        )
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
  parentMetaModal,
  element,
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
            isBPM={isBPM}
            parentMetaModal={parentMetaModal}
            element={element}
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
            element={element}
          />
        </React.Fragment>
      ))}
    </Paper>
  );
}
