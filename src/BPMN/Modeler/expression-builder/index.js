import React, { useEffect, useState } from "react";
import jsStringEscape from "js-string-escape";
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
  combinator as combinators,
  map_operator,
  join_operator,
  dateFormat,
  map_combinator,
  map_bpm_combinator,
  positive_operators,
} from "./data";
import { getModels } from "../../../services/api";
import { isBPMQuery, lowerCaseFirstLetter, getJsonExpression } from "./util";

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

let isValid = false;
function ExpressionBuilder({
  handleClose,
  open,
  element,
  setProperty,
  getExpression,
  type: parentType = "expressionBuilder",
  title = "Add Expression",
  openAlertDialog,
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

  function getRelationalCondition(
    rule,
    initValue = "",
    isParent = false,
    prefix
  ) {
    const map_operators =
      map_operator[isBPMQuery(parentType) ? "BPM" : expression];
    const { fieldName: propFieldName, operator, allField } = rule;
    let {
      fieldValue,
      fieldValue2,
      isRelationalValue,
      relatedValueFieldName,
      relatedValueModal,
      relatedElseValueFieldName,
      relatedElseValueModal,
      parent,
      nameField,
    } = rule;
    let fieldName = propFieldName;
    const values = fieldName
      .split(join_operator[isBPMQuery(parentType) ? "BPM" : expression])
      .filter((f) => f !== "");

    const fName = values[0];
    const field = allField.find((f) => f.name === fName);
    const { targetName, selectionList, nameField: nameColumn } = field || {};
    const type =
      field && field.type && field.type.toLowerCase().replaceAll("-", "_");
    const typeName = field && field.typeName;
    const nestedFields = values.splice(1) || [];
    if (
      [
        "many_to_many",
        "one_to_many",
        "json_many_to_many",
        "json_one_to_many",
      ].includes(type)
    ) {
      const findRelational = initValue.match(/\$\$/g);
      if (findRelational && findRelational.length > 0) {
        const str =
          nestedFields.length >= 1
            ? `${fName}.find{it->it.$$$$}${
                positive_operators.includes(operator) ? " != null" : " == null"
              }`
            : `${fName}.${
                nestedFields.length > 0 ? "find" : "collect"
              }{it->it$$$$}${
                nestedFields.length > 0
                  ? positive_operators.includes(operator)
                    ? " != null"
                    : " == null"
                  : ""
              }`;
        initValue = initValue.replace(/\$\$/g, str);
      } else {
        const str =
          nestedFields.length >= 1
            ? `${fName}.find{it->it.$$}${
                positive_operators.includes(operator) ? " != null" : " == null"
              }`
            : `${fName}.${
                nestedFields.length > 0 ? "find" : "collect"
              }{it->it$$}${
                nestedFields.length > 0
                  ? positive_operators.includes(operator)
                    ? " != null"
                    : " == null"
                  : ""
              }`;
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
          isRelationalValue,
          relatedValueFieldName,
          relatedValueModal,
          relatedElseValueFieldName,
          relatedElseValueModal,
          parent: values && values[0],
          nameField: nameColumn || nameField,
        },
        initValue,
        nestedFields.length > 1,
        prefix
      );
    } else if (
      [
        "json_many_to_one",
        "json_one_to_one",
        "many_to_one",
        "one_to_one",
      ].includes(type)
    ) {
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
          isRelationalValue,
          relatedValueFieldName,
          relatedValueModal,
          relatedElseValueFieldName,
          relatedElseValueModal,
          nameField: nameColumn || nameField,
          parent: values && values[0],
        },
        initValue,
        nestedFields.length > 1,
        prefix
      );
    } else {
      const isNumber = ["long", "integer", "decimal", "boolean"].includes(type);
      const isDateTime = ["date", "time", "datetime"].includes(type);

      if (!isRelationalValue && !isNumber && typeof fieldValue !== "object") {
        fieldValue = `'${jsStringEscape(fieldValue)}'`;
        fieldValue2 = `'${jsStringEscape(fieldValue2)}'`;
      }

      if (isDateTime) {
        if (!isRelationalValue) {
          fieldValue = getDateTimeValue(type, fieldValue);
          fieldValue2 = getDateTimeValue(type, fieldValue2);
        }
        fieldName = typeName ? `${fieldName}?.toLocalDateTime()` : fieldName;
      }
      if (["in", "notIn"].includes(operator)) {
        const isManyToManyField = initValue && initValue.includes("{it->it$$}");
        const field = allField.find((f) => f.name === parent) || {};
        const value =
          typeof rule.fieldValue === "string"
            ? rule.fieldValue
            : rule.fieldValue
                .map((i) =>
                  isNumber
                    ? `${
                        i["nameField"] ||
                        i["targetName"] ||
                        i["fullName"] ||
                        i["name"] ||
                        i["id"]
                      }`
                    : i["nameField"] ||
                      i["targetName"] ||
                      i["fullName"] ||
                      i["name"]
                    ? `'${
                        i["nameField"] ||
                        i["targetName"] ||
                        i["fullName"] ||
                        i["name"]
                      }'`
                    : i["id"]
                )
                .join(",");
        const name =
          isParent || nestedFields.length >= 1
            ? ""
            : `${fieldName}${
                selectionList
                  ? ""
                  : `${join_operator[expression]}${
                      nameField ||
                      (field && field.targetName) ||
                      targetName ||
                      "fullName"
                    }`
              }`;
        const str = `${operator === "notIn" ? "!" : ""}${`[${value}]`}${
          join_operator[expression]
        }${map_operators[operator]}${isManyToManyField ? "All" : ""}(${prefix}${
          join_operator[expression]
        }${initValue.replace(/\$\$/g, name)})`;
        return str;
      } else if (["contains", "notContains"].includes(operator)) {
        const isManyToManyField = initValue && initValue.includes("{it->it$$}");
        const field = allField.find((f) => f.name === parent) || {};
        const value =
          typeof rule.fieldValue === "string"
            ? rule.fieldValue
            : rule.fieldValue
                .map((i) =>
                  isNumber
                    ? `${
                        i["nameField"] ||
                        i["targetName"] ||
                        i["fullName"] ||
                        i["name"] ||
                        i["id"]
                      }`
                    : i["nameField"] ||
                      i["targetName"] ||
                      i["fullName"] ||
                      i["name"]
                    ? `'${
                        i["nameField"] ||
                        i["targetName"] ||
                        i["fullName"] ||
                        i["name"]
                      }'`
                    : i["id"]
                )
                .join(",");
        const name =
          isParent || nestedFields.length >= 1
            ? ""
            : `${fieldName}${
                selectionList
                  ? ""
                  : `${join_operator[expression]}${
                      nameField ||
                      (field && field.targetName) ||
                      targetName ||
                      "fullName"
                    }`
              }`;
        const str = `${operator === "notContains" ? "!" : ""}(${prefix}${
          join_operator[expression]
        }${initValue.replace(/\$\$/g, name)})${join_operator[expression]}${
          map_operators[operator]
        }${isManyToManyField ? "All" : ""}(${`[${value}]`})`;
        return str;
      } else if (["between", "notBetween"].includes(operator)) {
        const temp = initValue.match(/it.\$\$/g);
        if (temp && temp.length) {
          const str = `(it.${prefix}${join_operator[expression]}${fieldName} >= ${fieldValue} && it.${prefix}${join_operator[expression]}${fieldName} <= ${fieldValue2})`;
          if ("notBetween" === operator) {
            return `${initValue.replace(/it.\$\$/g, `!${str}`)}`;
          }
          return initValue.replace(/it.\$\$/g, str);
        } else {
          const replace = (p1) => {
            const field = (p1 && p1.replace(/\$\$/g, fieldName)) || fieldName;
            if ("notBetween" === operator) {
              return `!(${prefix}${join_operator[expression]}${field} >= ${fieldValue} && ${prefix}${join_operator[expression]}${field} <= ${fieldValue2})`;
            }
            return `(${prefix}${join_operator[expression]}${field} >= ${fieldValue} && ${prefix}${join_operator[expression]}${field} <= ${fieldValue2})`;
          };
          return replace(initValue);
        }
      } else if (["isNotNull", "isNull"].includes(operator)) {
        const str = `${fieldName} ${map_operators[operator]}`;
        const field = allField.find((f) => f.name === parent) || {};
        const isManyToManyField = initValue && initValue.includes("{it->it$$}");
        if (isManyToManyField) {
          const name =
            isParent || nestedFields.length >= 1
              ? ""
              : `${fieldName}${
                  selectionList
                    ? ""
                    : `${join_operator[expression]}${
                        (field && field.targetName) || targetName || "fullName"
                      }`
                }`;
          return `${prefix}${join_operator[expression]}${initValue.replace(
            /\$\$/g,
            `${name} ${str}`
          )}`;
        }
        return `${prefix}${join_operator[expression]}${initValue.replace(
          /\$\$/g,
          str
        )}`;
      } else if (["isTrue", "isFalse"].includes(operator)) {
        const value = operator === "isTrue" ? true : false;
        const str = `${fieldName} ${map_operators[operator]} ${value}`;
        return `${prefix}${join_operator[expression]}${initValue.replace(
          /\$\$/g,
          str
        )}`;
      } else if (["like", "notLike"].includes(operator)) {
        const str = `${fieldName}${join_operator[expression]}${map_operators[operator]}(${fieldValue})`;
        return `${operator === "notLike" ? "!" : ""}${prefix}${
          join_operator[expression]
        }${initValue.replace(/\$\$/g, str)}`;
      } else {
        let fieldNew = field || allField.find((f) => f.name === parent) || {};
        let value =
          typeof fieldValue === "object" && fieldValue
            ? `'${jsStringEscape(
                fieldValue[nameField] ||
                  fieldValue[targetName] ||
                  fieldValue["fullName"] ||
                  fieldValue["name"] ||
                  fieldValue["id"] ||
                  ""
              )}'`
              ? `'${jsStringEscape(
                  fieldValue[nameField] ||
                    fieldValue[targetName] ||
                    fieldValue["fullName"] ||
                    fieldValue["name"] ||
                    fieldValue["id"] ||
                    ""
                )}'`
              : fieldValue["name"]
            : fieldValue;
        const str = `${
          typeof fieldValue === "object" && fieldValue
            ? `${fieldName}${join_operator[expression]}${
                nameField || fieldNew.targetName || "fullName"
              }`
            : fieldName
        } ${map_operators[operator]} ${value}`;
        return `${prefix}${join_operator[expression]}${initValue.replace(
          /\$\$/g,
          str
        )}`;
      }
    }
  }

  function getDateTimeValue(type, fieldValue, isJsonField = false) {
    if (type === "date") {
      let date = `"${moment(fieldValue, dateFormat["date"]).format(
        "YYYY-MM-DD"
      )}"`;
      if (isJsonField) {
        return date;
      }
      return `LocalDate.parse(${date})`;
    } else if (type === "datetime") {
      if (isJsonField) {
        return `"${moment(fieldValue, dateFormat["datetime"]).toISOString()}"`;
      }
      return `LocalDateTime.of(${moment(fieldValue, dateFormat["datetime"])
        .format("YYYY-M-D-H-m-s")
        .split("-")})`;
    } else {
      let time = `"${moment(fieldValue, dateFormat["time"]).format(
        "HH:mm:ss"
      )}"`;
      if (isJsonField) {
        return time;
      }
      return `LocalTime.parse(${time})`;
    }
  }

  function getCondition(rules, modalName) {
    const isBPM = isBPMQuery(parentType);
    const prefix = isBPM ? "self" : modalName;
    const map_operators = map_operator[isBPM ? "BPM" : expression];
    return (
      rules &&
      rules.map((rule) => {
        const {
          fieldName: propFieldName,
          field = {},
          operator,
          allField,
        } = rule;
        const { targetName, selectionList } = field || {};
        const type = field && field.type && field.type.toLowerCase();
        const typeName = field && field.typeName;
        const isNumber = ["long", "integer", "decimal", "boolean"].includes(
          type
        );
        const isDateTime = ["date", "time", "datetime"].includes(type);
        let { fieldValue, fieldValue2, isRelationalValue } = rule;
        let fieldName = propFieldName;
        const fValue = isNaN(fieldValue) ? fieldValue : `${fieldValue}`;
        if (
          (!fieldValue ||
            (fieldValue && fieldValue.length <= 0) ||
            ((!fieldValue2 || (fieldValue2 && fieldValue2.length <= 0)) &&
              ["between", "notBetween"].includes(operator))) &&
          !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)
        ) {
          isValid = false;
          openAlertDialog();
          return null;
        }
        isValid = true;
        if (!fieldName) {
          return null;
        }

        if (isEmpty(fValue)) {
          if (["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)) {
          } else {
            return null;
          }
        }

        //check relational field
        const name = fieldName.split(join_operator[expression])[0];
        const f = allField && allField.find((f) => f.name === name);
        const isRelational = [
          "many_to_many",
          "one_to_many",
          "many_to_one",
          "one_to_one",
          "json_many_to_many",
          "json_one_to_many",
          "json_many_to_one",
          "json_one_to_one",
        ].includes(
          f &&
            f.type &&
            f.type.toLowerCase() &&
            f.type.toLowerCase().replaceAll("-", "_")
        );
        if (isRelational) {
          return getRelationalCondition(rule, undefined, false, prefix);
        }

        if (!isRelationalValue && !isNumber && typeof fieldValue !== "object") {
          fieldValue = `'${jsStringEscape(fieldValue)}'`;
          fieldValue2 = `'${jsStringEscape(fieldValue2)}'`;
        }
        if (isDateTime) {
          if (!isRelationalValue) {
            fieldValue = getDateTimeValue(type, fieldValue);
            fieldValue2 = getDateTimeValue(type, fieldValue2);
          }
          fieldName = typeName ? `${fieldName}?.toLocalDateTime()` : fieldName;
        }
        const map_type = isBPM ? map_bpm_combinator : map_combinator;
        if (["in", "notIn"].includes(operator)) {
          const value = rule.fieldValue
            .map((f) =>
              isNumber
                ? `${f["targetName"] || f["fullName"] || f["name"]}`
                : `'${f["targetName"] || f["fullName"] || f["name"]}'`
            )
            .filter((f) => f !== "")
            .join(",");
          return `${operator === "notIn" ? "!" : ""}${`[${value}]`}${
            join_operator[expression]
          }${map_operators[operator]}(${prefix}${
            join_operator[expression]
          }${fieldName}${
            selectionList
              ? " "
              : `${join_operator[expression]} ${targetName || "fullName"}`
          })`;
        } else if (["between", "notBetween"].includes(operator)) {
          if (operator === "notBetween") {
            return `!(${prefix}${join_operator[expression]}${fieldName} >= ${fieldValue} ${map_type["and"]} ${prefix}${join_operator[expression]}${fieldName} <= ${fieldValue2})`;
          }
          return `(${prefix}${join_operator[expression]}${fieldName} >= ${fieldValue} ${map_type["and"]} ${prefix}${join_operator[expression]}${fieldName} <= ${fieldValue2})`;
        } else if (["isNotNull", "isNull"].includes(operator)) {
          return `${prefix}${join_operator[expression]}${fieldName} ${map_operators[operator]}`;
        } else if (["isTrue", "isFalse"].includes(operator)) {
          const value = operator === "isTrue" ? true : false;
          return `${prefix}${join_operator[expression]}${fieldName} ${map_operators[operator]} ${value}`;
        } else if (["like", "notLike"].includes(operator)) {
          return `${operator === "notLike" ? "!" : ""}${prefix}${
            join_operator[expression]
          }${fieldName}${join_operator[expression]}${
            map_operators[operator]
          }(${fieldValue})`;
        } else {
          let value =
            typeof fieldValue === "object" && fieldValue
              ? `'${jsStringEscape(
                  fieldValue[targetName] ||
                    fieldValue["fullName"] ||
                    fieldValue["name"] ||
                    ""
                )}'`
                ? `'${jsStringEscape(
                    fieldValue[targetName] ||
                      fieldValue["fullName"] ||
                      fieldValue["name"] ||
                      ""
                  )}'`
                : fieldValue["name"]
              : fieldValue;
          return `${prefix}${join_operator[expression]}${
            type === "many_to_one" || type === "json_many_to_one"
              ? `${fieldName}${join_operator[expression]}${
                  field.targetName || "fullName"
                }`
              : fieldName
          } ${map_operators[operator]} ${value}`;
        }
      })
    );
  }

  function getBPMCondition(rules, modalName, parentCount = 0) {
    const isBPM = isBPMQuery(parentType);
    const prefix = isBPM ? "self" : modalName;
    const map_operators = map_operator[isBPM ? "BPM" : expression];
    let count = parentCount;
    return rules.map((rule) => {
      const { fieldName, field = {}, operator } = rule;
      const { targetName, selectionList, model, target } = field || {};
      const type = field && field.type.toLowerCase();
      const isNumber = ["long", "integer", "decimal", "boolean"].includes(type);
      const isDateTime = ["date", "time", "datetime"].includes(type);
      const isJsonField =
        model === "com.axelor.meta.db.MetaJsonRecord" ||
        target === "com.axelor.meta.db.MetaJsonRecord";
      const jsonFieldName = isJsonField
        ? `${getJsonExpression(field, prefix, fieldName)}`
        : undefined;
      let {
        fieldValue,
        fieldValue2,
        isRelationalValue,
        relatedValueModal = {},
        relatedElseValueModal = {},
      } = rule || {};
      const relatedValueModalName = lowerCaseFirstLetter(
        relatedValueModal && relatedValueModal.name
      );
      const relatedElseValueModalName = lowerCaseFirstLetter(
        relatedElseValueModal && relatedElseValueModal.name
      );
      const fValue = isNaN(fieldValue) ? fieldValue : `${fieldValue}`;
      if (
        (!fieldValue ||
          (fieldValue && fieldValue.length <= 0) ||
          ((!fieldValue2 || (fieldValue2 && fieldValue2.length <= 0)) &&
            ["between", "notBetween"].includes(operator))) &&
        !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)
      ) {
        isValid = false;
        openAlertDialog();
        return null;
      }
      isValid = true;
      const isRelatedModalSame = relatedValueModalName === modalName;
      const isRelatedElseModalSame = relatedElseValueModalName === modalName;
      if (!["isNotNull", "isNull"].includes(operator) && !isRelatedModalSame) {
        ++count;
      }
      if (!fieldName) {
        return null;
      }

      if (isEmpty(fValue)) {
        if (["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator)) {
        } else {
          return null;
        }
      }

      if (!isRelationalValue && !isNumber && typeof fieldValue !== "object") {
        fieldValue = `'${jsStringEscape(fieldValue)}'`;
        fieldValue2 = `'${jsStringEscape(fieldValue2)}'`;
      }

      if (isDateTime) {
        if (!isRelationalValue) {
          fieldValue = getDateTimeValue(type, fieldValue, isJsonField);
          fieldValue2 = getDateTimeValue(type, fieldValue2, isJsonField);
        }
      }

      const map_type = isBPM ? map_bpm_combinator : map_combinator;
      if (["in", "notIn"].includes(operator)) {
        const value = rule.fieldValue
          .map((f) =>
            isNumber
              ? `${f["targetName"] || f["fullName"] || f["name"]}`
              : `'${f["targetName"] || f["fullName"] || f["name"]}'`
          )
          .filter((f) => f !== "");
        return {
          condition: `${
            jsonFieldName
              ? jsonFieldName
              : `${prefix}.${fieldName}${
                  selectionList ? "" : `.${targetName || "fullName"}`
                }`
          } ${map_operators[operator]} ${
            isRelatedModalSame ? fieldValue : `?${count}`
          }`,
          values: isRelatedModalSame ? undefined : [[value]],
        };
      } else if (["between", "notBetween"].includes(operator)) {
        let values =
          isRelatedModalSame && isRelatedElseModalSame
            ? undefined
            : isRelatedModalSame
            ? [fieldValue2]
            : isRelatedElseModalSame
            ? [fieldValue]
            : [fieldValue, fieldValue2];
        if (isDateTime && isBPM) {
          if (operator === "notBetween") {
            return {
              condition: `${
                jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
              } NOT BETWEEN ${isRelatedModalSame ? fieldValue : `?${count}`} ${
                map_type["and"]
              } ${isRelatedElseModalSame ? fieldValue2 : `?${++count}`}`,
              values,
            };
          }
          return {
            condition: `${
              jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
            } BETWEEN ${isRelatedModalSame ? fieldValue : `?${count}`} ${
              map_type["and"]
            } ${isRelatedElseModalSame ? fieldValue2 : `?${++count}`}`,
            values,
          };
        } else {
          if (operator === "notBetween") {
            return {
              condition: `NOT (${
                jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
              } >= ${isRelatedModalSame ? fieldValue : `?${count}`} ${
                map_type["and"]
              } ${
                jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
              } <= ${isRelatedElseModalSame ? fieldValue2 : `?${++count}`})`,
              values,
            };
          }
          return {
            condition: `(${
              jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
            } >= ${isRelatedModalSame ? fieldValue : `?${count}`} ${
              map_type["and"]
            } ${jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`} <= ${
              isRelatedElseModalSame ? fieldValue2 : `?${++count}`
            })`,
            values,
          };
        }
      } else if (["isNotNull", "isNull"].includes(operator)) {
        return {
          condition: `${
            jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
          } ${map_operators[operator]}`,
        };
      } else if (["isTrue", "isFalse"].includes(operator)) {
        const value = operator === "isTrue" ? true : false;
        return {
          condition: `${
            jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`
          } ${map_operators[operator]} ${
            isRelatedModalSame ? fieldValue : `?${count}`
          }`,
          values: isRelatedModalSame ? undefined : [value],
        };
      } else if (["contains", "notContains"].includes(operator)) {
        let value =
          typeof fieldValue === "object" && fieldValue
            ? `'${jsStringEscape(fieldValue[field.targetName] || "")}'`
              ? `'${jsStringEscape(fieldValue[field.targetName] || "")}'`
              : fieldValue["name"]
            : fieldValue;

        return {
          condition: `${isRelatedModalSame ? fieldValue : `?${count}`} ${
            map_operators[operator]
          } ${jsonFieldName ? jsonFieldName : `${prefix}.${fieldName}`}`,
          values: isRelatedModalSame ? undefined : [value],
        };
      } else {
        let value =
          typeof fieldValue === "object" && fieldValue
            ? `'${jsStringEscape(fieldValue[field.targetName] || "")}'`
              ? `'${jsStringEscape(fieldValue[field.targetName] || "")}'`
              : fieldValue["name"]
            : fieldValue;

        return {
          condition: `${
            jsonFieldName
              ? jsonFieldName
              : `${prefix}.${
                  [
                    "many_to_one",
                    "json_many_to_one",
                    "one_to_one",
                    "json_one_to_one",
                  ].includes(type) && !isRelationalValue
                    ? `${fieldName}.${field.targetName || "fullName"}`
                    : fieldName
                }`
          } ${map_operators[operator]} ${
            isRelatedModalSame
              ? ["like", "notLike"].includes(operator)
                ? `CONCAT('%',${fieldValue},'%')`
                : fieldValue
              : ["like", "notLike"].includes(operator)
              ? `CONCAT('%',?${count},'%')`
              : `?${count}`
          }`,
          values: isRelatedModalSame ? undefined : [value],
        };
      }
    });
  }

  function getBPMCriteria(rule, modalName, isChildren, count = 0) {
    const { rules, combinator, children } = rule[0];
    const condition = getBPMCondition(rules, modalName, count).filter(
      (f) => f !== ""
    );
    if (children.length > 0) {
      const parentValues =
        (condition &&
          condition.map((co) => co && co.values).filter((f) => f)) ||
        [];
      const { condition: conditions, values } = getBPMCriteria(
        children,
        modalName,
        true,
        parentValues && parentValues.length
      );
      condition.push({ condition: conditions, values });
    }
    const map_type = isBPMQuery(parentType)
      ? map_bpm_combinator
      : map_combinator;
    const c = condition.map((co) => co && co.condition);
    if (isChildren) {
      return {
        condition: " (" + c.join(" " + map_type[combinator] + " ") + ") ",
        values:
          condition &&
          condition
            .map((co) => co && co.values && co.values[0])
            .filter((f) => f),
      };
    } else {
      return {
        condition: c.join(" " + map_type[combinator] + " "),
        values:
          condition && condition.map((co) => co && co.values).filter((f) => f),
      };
    }
  }

  function getCriteria(rule, modalName, isChildren) {
    const { rules, combinator, children } = rule[0];
    const condition = getCondition(rules, modalName).filter((f) => f !== "");
    if (children.length > 0) {
      const conditions = getCriteria(children, modalName, true);
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
        rules[map[node.parentId]] &&
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

  function generateExpression(combinator, type) {
    const expressionValues = [];
    let model;
    let vals = [];
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
              undefined
            )
          : getCriteria(listOfTree, lowerCaseFirstLetter(modalName), undefined);
        vals.push(
          ...(criteria &&
            ((criteria.values || []).filter((f) => Array.isArray(f)) || []))
        );
        if (metaModals) {
          str += isBPMQuery(type) ? criteria && criteria.condition : criteria;
        } else {
          return "";
        }
        expressionValues.push({
          metaModalName: modalName,
          metaModalType: metaModals.type,
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

    let expr = str;
    if (isBPMQuery(type)) {
      let parametes = "";
      vals &&
        vals.forEach((v) => {
          if (v && Array.isArray(v[0])) {
            parametes = parametes + `, [${v[0]}]`;
          } else {
            parametes = parametes + ", " + v;
          }
        });

      expr = str
        ? `return $ctx.createVariable($ctx.${
            singleResult ? "filterOne" : "filter"
          }("${model}"," ${str} "${
            vals && vals.length > 0 ? `${parametes}` : ``
          }))`
        : undefined;
    }

    if (isValid) {
      setProperty({
        expression: expr,
        value: JSON.stringify(expressionValues),
        combinator: isBPMQuery(type) ? singleResult : combinator,
      });
      handleClose();
    }
  }

  useEffect(() => {
    let isSubscribed = true;
    async function fetchValue() {
      const { values, combinator } = getExpression() || {};
      const expressionComponents = [];
      if (!values || values.length === 0) return;
      for (let i = 0; i < values.length; i++) {
        const element = values[i];
        const { metaModalName, metaModalType } = element;
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
        const metaModels = await getModels(criteria, metaModalType);
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
      <DialogTitle id="simple-dialog-title">{title}</DialogTitle>
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
