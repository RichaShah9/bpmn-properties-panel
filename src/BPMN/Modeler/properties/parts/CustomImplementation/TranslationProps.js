import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Paper,
  IconButton,
  Button,
} from "@material-ui/core";
import { Close, Add } from "@material-ui/icons";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import {
  getTranslations,
  addTranslations,
  removeAllTranslations,
  getInfo,
} from "../../../../../services/api";
import { TextField, Checkbox } from "../../components";
import { translate, getBool } from "../../../../../utils";

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
  tableCell: {
    textAlign: "left",
  },
  tableHead: {
    fontWeight: 600,
    fontSize: 12,
    textAlign: "left",
  },
  iconButton: {
    margin: "5px 0px 5px 5px",
    borderRadius: 0,
    padding: 2,
    color: "black",
    width: "fit-content",
    border: "1px solid #ccc",
  },
  clear: {
    fontSize: "1rem",
  },
  table: {
    margin: "10px 0px",
    background: "#F8F8F8",
  },
  textRoot: {
    marginTop: 0,
  },
  confirm: {
    color: "#727272",
    width: "fit-content",
    border: "1px solid #ccc",
    height: 23,
    padding: 10,
    fontSize: 12,
    marginLeft: 5,
    borderRadius: 0,
    textTransform: "none",
  },
});

export default function TranslationProps({
  element,
  onSave,
  bpmnModeler,
  index,
  label,
}) {
  const [isTranslations, setIsTranslations] = useState(false);
  const [value, setValue] = useState(null);
  const [translations, setTranslations] = useState(null);
  const [removeTranslations, setRemoveTranslations] = useState(null);
  const [isVisible, setVisible] = useState(false);
  const [info, setInfo] = useState(null);
  const classes = useStyles();

  const setDiagramValue = (val, isCheckbox = false) => {
    if (!element) return;
    const bo = getBusinessObject(element);
    const isTranslation =
      (bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
    if (!getBool(isTranslation) && !isCheckbox) return;
    const elementType = element && element.type;
    let modelProperty =
      elementType === "bpmn:TextAnnotation"
        ? "text"
        : elementType === "bpmn:Group"
        ? "categoryValue"
        : "name";
    element.businessObject[modelProperty] = val;
    let elementRegistry = bpmnModeler.get("elementRegistry");
    let modeling = bpmnModeler.get("modeling");
    let shape = elementRegistry.get(element.id);
    if (!shape) return;
    modeling &&
      modeling.updateProperties(shape, {
        name: val,
      });
  };

  const onConfirm = async () => {
    const res = await addTranslations(translations);
    setTranslations(res);
    if (removeTranslations && removeTranslations.length > 0) {
      const res = await removeAllTranslations(removeTranslations);
      if (res) {
        setRemoveTranslations(null);
        const bo = element && element.businessObject;
        const elementType = element && element.type;
        let modelProperty =
          elementType === "bpmn:TextAnnotation"
            ? "text"
            : elementType === "bpmn:Group"
            ? "categoryValue"
            : "name";

        const name = bo[modelProperty];
        const key = bo.$attrs["camunda:key"];
        if (translations && translations.length === 0) {
          setDiagramValue(key || name);
        }
      }
    }
    if (translations && translations.length > 0) {
      const language = info && info["user.lang"];
      if (language) {
        const selectedTranslation = translations.find(
          (t) => t.language === language
        );
        const value = selectedTranslation && selectedTranslation.message;
        const bo = element && element.businessObject;
        const elementType = element && element.type;
        let modelProperty =
          elementType === "bpmn:TextAnnotation"
            ? "text"
            : elementType === "bpmn:Group"
            ? "categoryValue"
            : "name";
        const name = bo[modelProperty];
        const key = bo.$attrs["camunda:key"];
        element.businessObject.$attrs["camunda:key"] = key || name;
        const diagramValue = value || key || name;
        if (diagramValue) {
          setDiagramValue(diagramValue);
        }
      }
    }
    onSave();
  };

  const addTranslation = () => {
    setTranslations([
      ...(translations || []),
      {
        message: "",
        language: "",
        key: `value:${value}`,
      },
    ]);
  };

  const removeTranslation = (index) => {
    const cloneTranslations = [...(translations || [])];
    const removeTranslation = cloneTranslations[index];
    cloneTranslations.splice(index, 1);
    const removedTranslations = [
      ...(removeTranslations || []),
      removeTranslation,
    ];
    setRemoveTranslations(removedTranslations);
    setTranslations(cloneTranslations);
  };

  const setProperty = (index, label, value) => {
    const cloneTranslations = [...(translations || [])];
    cloneTranslations[index] = {
      ...cloneTranslations[index],
      [label]: value,
    };
    setTranslations(cloneTranslations);
  };

  useEffect(() => {
    async function getAllTranslations() {
      if (!element) return;
      const bo = element.businessObject;
      const elementType = element && element.type;
      let modelProperty =
        elementType === "bpmn:TextAnnotation"
          ? "text"
          : elementType === "bpmn:Group"
          ? "categoryValue"
          : "name";
      const name = bo[modelProperty];
      const key = bo.$attrs["camunda:key"];
      const value = key || name;
      setValue(value);
      const translations = await getTranslations(value);
      setTranslations(translations);
    }
    getAllTranslations();
  }, [element]);

  useEffect(() => {
    async function getUserInfo() {
      const info = await getInfo();
      setInfo(info);
    }
    getUserInfo();
  }, []);

  useEffect(() => {
    const bo = getBusinessObject(element);
    const isTranslation =
      (bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
    setIsTranslations(getBool(isTranslation));
  }, [element]);

  useEffect(() => {
    if (["h", "v", "Shape", "Label"].includes(element.constructor.name)) {
      setVisible(true);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Checkbox
            element={element}
            entry={{
              id: "isTranslations",
              label: translate("Add translations"),
              modelProperty: "isTranslations",
              get: function () {
                return {
                  isTranslations: isTranslations,
                };
              },
              set: function (e, value) {
                const isTranslations = !value.isTranslations;
                setIsTranslations(isTranslations);
                const bo = getBusinessObject(element);
                if (!bo) return;
                if (bo.$attrs) {
                  bo.$attrs["camunda:isTranslations"] = isTranslations;
                } else {
                  bo.$attrs = { "camunda:isTranslations": isTranslations };
                }

                const language = info && info["user.lang"];
                const selectedTranslation =
                  translations &&
                  translations.find((t) => t.language === language);
                if (!language || !selectedTranslation) return;
                const message =
                  selectedTranslation && selectedTranslation.message;
                const modelProperty =
                  element && element.type === "bpmn:TextAnnotation"
                    ? "text"
                    : "name";
                const name = bo[modelProperty];
                const key = bo.$attrs["camunda:key"];
                element.businessObject.$attrs["camunda:key"] = key || name;
                const diagramValue = !isTranslations
                  ? key || name
                  : message || key || name;
                if (diagramValue) {
                  setDiagramValue(diagramValue, true);
                }
              },
            }}
          />
          {isTranslations && (
            <IconButton className={classes.iconButton} onClick={addTranslation}>
              <Add fontSize="small" />
            </IconButton>
          )}
        </div>
        {isTranslations && translations && translations.length > 0 && (
          <React.Fragment>
            <TableContainer component={Paper} className={classes.table}>
              <Table size="small" aria-label="a dense table">
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.tableHead} align="center">
                      Translation
                    </TableCell>
                    <TableCell className={classes.tableHead} align="center">
                      Language (Hint: en, fr)
                    </TableCell>
                    <TableCell
                      className={classes.tableHead}
                      align="center"
                    ></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {translations &&
                    translations.length > 0 &&
                    translations.map((translateKey, index) => (
                      <TableRow key={index}>
                        <TableCell
                          component="th"
                          scope="row"
                          align="center"
                          className={classes.tableCell}
                        >
                          <TextField
                            rootClass={classes.textRoot}
                            element={element}
                            entry={{
                              id: "message",
                              modelProperty: "message",
                              get: function () {
                                return {
                                  message: translateKey.message,
                                };
                              },
                              set: function (e, values) {
                                setProperty(index, "message", values.message);
                              },
                            }}
                            isLabel={false}
                          />
                        </TableCell>
                        <TableCell
                          component="th"
                          scope="row"
                          align="center"
                          className={classes.tableCell}
                        >
                          <TextField
                            element={element}
                            rootClass={classes.textRoot}
                            entry={{
                              id: "language",
                              modelProperty: "language",
                              get: function () {
                                return {
                                  language: translateKey.language,
                                };
                              },
                              set: function (e, values) {
                                setProperty(index, "language", values.language);
                              },
                            }}
                            isLabel={false}
                          />
                        </TableCell>
                        <TableCell
                          component="th"
                          scope="row"
                          align="center"
                          className={classes.tableCell}
                        >
                          <IconButton
                            className={classes.iconButton}
                            onClick={() => removeTranslation(index)}
                          >
                            <Close className={classes.clear} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </React.Fragment>
        )}
        {isTranslations && (
          <Button
            variant="outlined"
            onClick={onConfirm}
            color="primary"
            className={classes.confirm}
          >
            Save translations
          </Button>
        )}
      </div>
    )
  );
}
