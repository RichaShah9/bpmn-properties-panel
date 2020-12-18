import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Paper,
  Dialog,
  DialogTitle,
  Checkbox,
  FormControlLabel,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import produce from "immer";
import { isEmpty } from "lodash";
import moment from "moment";

import ExpressionComponent from "./expression-builder";
import { Button, Select } from "./component";
import {
  combinators,
  map_operator,
  join_operator,
  dateFormat,
  map_combinator,
  map_bpm_combinator,
  compare_operators,
} from "./data";
import { getModels } from "../../../services/api";
import { isBPMQuery } from "./util";

const useStyles = makeStyles((theme) => ({
  paper: {
    margin: theme.spacing(1),
    padding: theme.spacing(3, 2),
  },
  expressionContainer: {
    display: "flex",
    alignItems: "center",
  },
  dialogPaper: {
    maxWidth: "100%",
  },
}));

function ExpressionBuilder({
  handleClose,
  open,
  element,
  setProperty,
  getExpression,
  type: parentType = "expressionBuilder",
}) {
  const expression = isBPMQuery(parentType) ? "BPM" : "GROOVY";
  const [combinator, setCombinator] = useState("and");
  const [expressionComponents, setExpressionComponents] = useState([
    { Component: ExpressionComponent },
  ]);
  const [singleResult, setSingleResult] = useState(false);
  const classes = useStyles();

  function onAddExpressionEditor() {
    setExpressionComponents(
      produce((draft) => {
        draft.push({ Component: ExpressionComponent.bind({}) });
      })
    );
  }

  function onRemoveExpressionEditor(index) {
    setExpressionComponents(
      produce((draft) => {
        draft.splice(index, 1);
      })
    );
  }

  function getRelationalCondition(rule, initValue = "", isParent) {
    const map_operators =
      map_operator[isBPMQuery(parentType) ? "BPM" : expression];
    const { fieldName, operator, allField } = rule;
    let { fieldValue, fieldValue2 } = rule;

    const values = fieldName
      .split(join_operator[expression])
      .filter((f) => f !== "");

    const fName = values[0];
    const field = allField.find((f) => f.name === fName);
    const type = field && field.type.toLowerCase();
    const nestedFields = values.splice(1);
    if (["many_to_many", "one_to_many"].includes(type)) {
      const findRelational = initValue.match(/\$\$/g);
      if (findRelational && findRelational.length > 0) {
        const str =
          nestedFields.length >= 1
            ? `${fName}.find{it.$$$$} != null`
            : `${fName}.find{it$$$$} != null`;
        initValue = initValue.replace(/\$\$/g, str);
      } else {
        const str =
          nestedFields.length >= 1
            ? `${fName}.find{it.$$} != null`
            : `${fName}.find{it$$} != null`;
        initValue += str;
      }
      const nestedFieldName = nestedFields.join(join_operator[expression]);
      return getRelationalCondition(
        {
          fieldName: nestedFieldName,
          operator,
          allField,
          fieldValue,
          fieldValue2,
        },
        initValue,
        nestedFields.length >= 1
      );
    } else if (["many_to_one", "one_to_one"].includes(type)) {
      const nestedFieldName = nestedFields.join(join_operator[expression]);
      const findRelational = initValue.match(/\$\$/g);
      const str =
        nestedFields.length >= 1
          ? `${fName}${join_operator[expression]}`
          : fName;
      if (findRelational && findRelational.length > 0) {
        initValue = initValue.replace(/\$\$/g, `${str}$$$$`);
      } else {
        initValue += `${str}$$`;
      }
      return getRelationalCondition(
        {
          fieldName: nestedFieldName,
          operator,
          allField,
          fieldValue,
          fieldValue2,
        },
        initValue,
        nestedFields.length >= 1
      );
    } else {
      const isNumber = ["long", "integer", "decimal", "boolean"].includes(type);
      const isDateTime = ["date", "time", "datetime"].includes(type);

      if (!isNumber) {
        fieldValue = `'${fieldValue}'`;
        fieldValue2 = `'${fieldValue2}'`;
      }

      if (isDateTime) {
        fieldValue = getDateTimeValue(type, fieldValue);
        fieldValue2 = getDateTimeValue(type, fieldValue2);
      }

      if (["in", "notIn"].includes(operator)) {
        const value = rule.fieldValue.map((i) => i.id).join(",");
        const name =
          isParent || nestedFields.length >= 1
            ? ""
            : fieldName + join_operator[expression] + "id";
        const str = `${name} ${map_operators[operator]} [${value}]`;
        if (operator === "notIn") {
          return `!(${initValue.replace(/\$\$/g, `${str}`)})`;
        }
        return initValue.replace(/\$\$/g, `${str}`);
      } else if (["between", "notBetween"].includes(operator)) {
        const temp = initValue.match(/it.\$\$/g);
        if (temp && temp.length) {
          const str = `(it.${fieldName} >= ${fieldValue} && it.${fieldName} <= ${fieldValue2})`;
          if ("notBetween" === operator) {
            return `${initValue.replace(/it.\$\$/g, `!${str}`)}`;
          }
          return initValue.replace(/it.\$\$/g, str);
        } else {
          const remplace = (correspondance, p1) => {
            const field = p1.replace(/\$\$/g, fieldName);
            if ("notBetween" === operator) {
              return `{!(${field} >= ${fieldValue} && ${field} <= ${fieldValue})}`;
            }
            return `{(${field} >= ${fieldValue} && ${field} <= ${fieldValue})}`;
          };
          const val = initValue.replace(/{(.*)}/g, remplace);
          return val;
        }
      } else if (["isNotNull", "isNull"].includes(operator)) {
        const str = `${fieldName} ${map_operators[operator]}`;
        return initValue.replace(/\$\$/g, isParent ? `${str}` : ` ${str}`);
      } else if (["isTrue", "isFalse"].includes(operator)) {
        const value = operator === "isTrue" ? true : false;
        const str = `${fieldName} ${map_operators[operator]} ${value}`;
        return initValue.replace(/\$\$/g, isParent ? `${str}` : ` ${str}`);
      } else {
        const str = `${fieldName} ${map_operators[operator]} ${fieldValue}`;
        return initValue.replace(/\$\$/g, isParent ? `${str}` : ` ${str}`);
      }
    }
  }

  function getDateTimeValue(type, fieldValue) {
    if (type === "date") {
      return `LocalDate.parse('${moment(fieldValue, dateFormat["date"]).format(
        "YYYY-MM-DD"
      )}')`;
    } else if (type === "datetime") {
      return `LocalDateTime.parse('${moment(
        fieldValue,
        dateFormat["datetime"]
      ).toISOString()} ')`;
    } else {
      return `LocalTime.parse('${moment(fieldValue, dateFormat["time"]).format(
        "hh:mm:ss"
      )}')`;
    }
  }

  function getCondition(rules, parentCombinator) {
    const map_operators =
      map_operator[isBPMQuery(parentType) ? "BPM" : expression];
    return rules.map((rule) => {
      const { fieldName, field, operator, allField } = rule;
      const type = field && field.type.toLowerCase();
      const isNumber = ["long", "integer", "decimal", "boolean"].includes(type);
      const isDateTime = ["date", "time", "datetime"].includes(type);
      let { fieldValue, fieldValue2 } = rule;
      const fValue = isNaN(fieldValue) ? fieldValue : `${fieldValue}`;

      if (!fieldName) {
        return null;
      }

      if (isEmpty(fValue)) {
        if (["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)) {
        } else {
          if (compare_operators.includes(parentCombinator)) {
            return fieldName;
          }
          return null;
        }
      }

      //check relational field
      const name = fieldName.split(join_operator[expression])[0];
      const f = allField.find((f) => f.name === name);
      const isRelational = [
        "many_to_many",
        "one_to_many",
        "many_to_one",
        "one_to_one",
      ].includes(f.type.toLowerCase());
      if (isRelational) {
        return getRelationalCondition(rule);
      }

      if (!isNumber) {
        fieldValue = `'${fieldValue}'`;
        fieldValue2 = `'${fieldValue2}'`;
      }

      if (isDateTime) {
        fieldValue = getDateTimeValue(type, fieldValue);
        fieldValue2 = getDateTimeValue(type, fieldValue2);
      }

      if (["in", "notIn"].includes(operator)) {
        const value = rule.fieldValue
          .map((f) => f.id)
          .filter((f) => f !== "")
          .join(",");
        return `${fieldName}id ${map_operators[operator]} [${value}]`;
      } else if (["between", "notBetween"].includes(operator)) {
        if (operator === "notBetween") {
          return `!(${fieldName} >= ${fieldValue} && ${fieldName} <= ${fieldValue2})`;
        }
        return `(${fieldName} >= ${fieldValue} && ${fieldName} <= ${fieldValue2})`;
      } else if (["isNotNull", "isNull"].includes(operator)) {
        return `${fieldName} ${map_operators[operator]}`;
      } else if (["isTrue", "isFalse"].includes(operator)) {
        const value = operator === "isTrue" ? true : false;
        return `${fieldName} ${map_operators[operator]} ${value}`;
      } else {
        return `${fieldName} ${map_operators[operator]} ${fieldValue}`;
      }
    });
  }

  function getBPMCriteria(rule, modalName, isChildren, parentCombinator) {
    const { rules, combinator, children } = rule[0];
    const condition = getCondition(rules, parentCombinator)
      .map((c) => (c === null ? "" : `self.${c}`))
      .filter((f) => f !== "");
    if (children.length > 0) {
      const conditions = getBPMCriteria(
        children,
        modalName,
        true,
        parentCombinator
      );
      condition.push(conditions);
    }

    const map_type = isBPMQuery(parentType)
      ? map_bpm_combinator
      : map_combinator;
    if (isChildren) {
      return " (" + condition.join(" " + map_type[combinator] + " ") + ") ";
    } else {
      return condition.join(" " + map_type[combinator] + " ");
    }
  }

  function getCriteria(rule, modalName, isChildren, parentCombinator) {
    const { rules, combinator, children } = rule[0];
    const condition = getCondition(rules, parentCombinator)
      .map((c) => (c === null ? "" : `${modalName}.${c}`))
      .filter((f) => f !== "");
    if (children.length > 0) {
      const conditions = getCriteria(
        children,
        modalName,
        true,
        parentCombinator
      );
      condition.push(conditions);
    }
    const map_type = isBPMQuery(parentType)
      ? map_bpm_combinator
      : map_combinator;

    if (isChildren) {
      return " (" + condition.join(" " + map_type[combinator] + " ") + ") ";
    } else {
      return condition.join(" " + map_type[combinator] + " ");
    }
  }

  function getListOfTree(list) {
    var map = {},
      node,
      roots = [];
    const rules = list.map((item, index) => {
      map[item.id] = index;
      return { ...item, children: [] };
    });
    for (let i = 0; i < rules.length; i += 1) {
      node = rules[i];
      if (node.parentId >= 0) {
        rules[map[node.parentId]].children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  const onChange = React.useCallback(function onChange(value, index) {
    setExpressionComponents(
      produce((draft) => {
        draft[index].value = value;
      })
    );
  }, []);

  function lowerCaseFirstLetter(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  function generateExpression(combinator, type) {
    const expressionValues = [];
    let model;
    const expressions =
      expressionComponents &&
      expressionComponents.map(({ value }, index) => {
        const { rules, metaModals } = value;
        const modalName = metaModals && metaModals.name;
        model = modalName;
        let str = "";
        const listOfTree = getListOfTree(rules);
        const criteria = isBPMQuery(type)
          ? getBPMCriteria(
              listOfTree,
              lowerCaseFirstLetter(modalName),
              undefined,
              combinator
            )
          : getCriteria(
              listOfTree,
              lowerCaseFirstLetter(modalName),
              undefined,
              combinator
            );
        if (metaModals) {
          str += criteria;
        } else {
          return "";
        }
        expressionValues.push({
          metaModalName: modalName,
          rules,
        });
        return `${str}`;
      });

    const map_type = isBPMQuery(parentType)
      ? map_bpm_combinator
      : map_combinator;

    const str = expressions
      .filter((e) => e !== "")
      .map((e) => (expressions.length > 1 ? `(${e})` : e))
      .join(" " + map_type[combinator] + " ");
    setProperty({
      expression: isBPMQuery(type)
        ? `return $ctx.createVariable($ctx.${
            singleResult ? "filterOne" : "filter"
          }("${model}","${str}")`
        : str,
      value: JSON.stringify(expressionValues),
      combinator: isBPMQuery(type) ? singleResult : combinator,
    });
    handleClose();
  }

  useEffect(() => {
    let isSubscribed = true;
    async function fetchValue() {
      const { values, combinator } = getExpression() || {};
      const expressionComponents = [];
      if (!values || values.length === 0) return;
      for (let i = 0; i < values.length; i++) {
        const element = values[i];
        const { metaModalName } = element;
        if (!metaModalName) return;
        const criteria = {
          criteria: [
            {
              fieldName: "name",
              operator: "=",
              value: metaModalName,
            },
          ],
          operator: "and",
        };
        const metaModels = await getModels(criteria);
        if (!metaModels) return;
        const value = {
          metaModals: metaModels && metaModels[0],
          rules: element.rules,
        };
        expressionComponents.push({
          Component: ExpressionComponent,
          value,
        });
      }
      if (isSubscribed) {
        setExpressionComponents(expressionComponents);
        if (isBPMQuery(parentType)) {
          setSingleResult(combinator);
        } else {
          setCombinator(combinator || "and");
        }
      }
    }
    fetchValue();
    return () => (isSubscribed = false);
  }, [getExpression, parentType]);

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="simple-dialog-title"
      open={open}
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle id="simple-dialog-title">Add Expression</DialogTitle>
      <div>
        <Paper variant="outlined" className={classes.paper}>
          {!isBPMQuery(parentType) && (
            <div>
              <Select
                name="expression"
                title="Expression"
                options={combinators}
                value={combinator}
                onChange={(value) => {
                  setCombinator(value);
                }}
              />
              <Button
                title="Expression"
                Icon={AddIcon}
                onClick={() => onAddExpressionEditor()}
              />
            </div>
          )}
          {isBPMQuery(parentType) && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={singleResult}
                  onChange={(e) => setSingleResult(e.target.checked)}
                  name="singleResult"
                  color="primary"
                />
              }
              label="Single Result"
            />
          )}
          {expressionComponents.map(({ Component, value }, index) => {
            return (
              <div className={classes.expressionContainer} key={index}>
                <Component
                  value={value}
                  index={index}
                  setValue={onChange}
                  element={element}
                  parentCombinator={combinator}
                  type={parentType}
                />
                {!isBPMQuery(parentType) && (
                  <Button
                    Icon={DeleteIcon}
                    onClick={() => onRemoveExpressionEditor(index)}
                  />
                )}
              </div>
            );
          })}
        </Paper>
        <Button
          title="Generate"
          onClick={() => generateExpression(combinator, parentType)}
        />
      </div>
    </Dialog>
  );
}

export default ExpressionBuilder;
