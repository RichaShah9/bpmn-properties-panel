import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  DialogTitle,
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Paper,
  IconButton,
  CircularProgress,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Close, Add } from "@material-ui/icons";

import {
  getTranslations,
  addTranslations,
  removeAllTranslations,
  getInfo,
} from "../../../services/api";
import { TextField, Textbox } from "../properties/components";
import { translate } from "../../../utils";

const useStyles = makeStyles({
  dialogPaper: {
    padding: 5,
    minWidth: 450,
    overflow: "auto",
  },
  button: {
    textTransform: "none",
    margin: "10px 0px",
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
  },
  clear: {
    fontSize: "1rem",
  },
  table: {
    margin: "10px 0px",
  },
  textRoot: {
    marginTop: 0,
  },
  circularProgress: {
    color: "#0A73FA",
  },
});

export default function TranslationDialog({
  open,
  onClose,
  element,
  onSave,
  bpmnModeler,
}) {
  const classes = useStyles();
  const [value, setValue] = useState(null);
  const [translations, setTranslations] = useState(null);
  const [removeTranslations, setRemoveTranslations] = useState(null);
  const [isLoading, setLoading] = useState(false);

  const setDiagramValue = (val) => {
    if (!element) return;
    element.businessObject.name = val;
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
        const name = bo.name;
        const key = bo.$attrs["camunda:key"];
        if (translations && translations.length === 0) {
          setDiagramValue(key || name);
        }
      }
    }
    if (translations && translations.length > 0) {
      const info = await getInfo();
      const language = info && info["user.lang"];
      if (language) {
        const selectedTranslation = translations.find(
          (t) => t.language === language
        );
        const value = selectedTranslation && selectedTranslation.message;
        const bo = element && element.businessObject;
        const name = bo.name;
        const key = bo.$attrs["camunda:key"];
        element.businessObject.$attrs["camunda:key"] = key || name;
        const diagramValue = value || key || name;
        if (diagramValue) {
          setDiagramValue(diagramValue);
        }
      }
    }
    onSave();
    onClose();
  };

  const addTranslation = () => {
    if (!value) return;
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
      setLoading(true);
      const bo = element.businessObject;
      const name = bo.name;
      const key = bo.$attrs["camunda:key"];
      const value = key || name;
      setValue(value);
      const translations = await getTranslations(value);
      setTranslations(translations);
      setLoading(false);
    }
    getAllTranslations();
  }, [element]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle>
        <strong>Translations</strong>
      </DialogTitle>
      <DialogContent>
        <Textbox
          element={element}
          readOnly={true}
          entry={{
            id: "value",
            label: translate("Value"),
            modelProperty: "name",
            get: function () {
              return {
                name: value,
              };
            },
            set: function (e, values) {
              setValue(values.name);
            },
          }}
        />
        {isLoading ? (
          <CircularProgress className={classes.circularProgress} size={15} />
        ) : (
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
        )}
        <IconButton className={classes.iconButton} onClick={addTranslation}>
          <Add fontSize="small" />
        </IconButton>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onConfirm}
          className={classes.button}
          color="primary"
          variant="outlined"
        >
          Ok
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          className={classes.button}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
