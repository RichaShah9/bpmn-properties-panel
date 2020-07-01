import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Paper,
  Button,
  Grid,
  Checkbox,
  TextField,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  Typography,
  IconButton,
} from "@material-ui/core";
import { Add, Close } from "@material-ui/icons";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Select from "./components/Select";
import { getModels, getViews, getItems, getRoles } from "../services/api";

const Ids = require("ids").default;

const valueObj = {
  model: null,
  view: null,
  roles: [],
  items: [],
};

const itemsObj = {
  itemName: null,
  attributeName: null,
  attributeValue: null,
};

function nextId() {
  let ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("viewAttributes_");
}

function createData(values = []) {
  return {
    id: nextId(),
    values: [...values],
  };
}

const useStyles = makeStyles({
  table: {
    minWidth: 500,
  },
  button: {
    textTransform: "none",
  },
  grid: {
    padding: "0px 5px 0px 0px",
  },
  card: {
    margin: "5px 0px 10px 0px",
    boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.1)",
    width: "100%",
    minWidth: 500,
  },
  cardContent: {
    padding: "10px !important",
  },
  cardContainer: {
    display: "flex",
    alignItems: "flex-start",
  },
  title: {
    marginBottom: 12,
    fontWeight: 600,
    fontSize: 14,
  },
  tableCell: {
    padding: "6px !important",
    width: "33%",
  },
  tableHead: {
    fontWeight: 600,
  },
  iconButton: {
    padding: 5,
  },
});

export default function DialogView({
  id,
  handleAdd,
  handleClose,
  open,
  element,
}) {
  const classes = useStyles();
  const [row, setRow] = useState(null);

  const addModelView = () => {
    setRow({
      ...row,
      values: [...row.values, { ...valueObj }],
    });
  };

  const updateValue = (value, name, label, index) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    values[index] = {
      ...(values[index] || {}),
      [name]: (value && value[label]) || value,
    };
    setRow({ ...cloneRow });
  };

  const addItems = (index) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    values[index] = {
      ...(values[index] || {}),
      items: [
        { id: `item_${cloneRow.id}_${index}`, ...itemsObj },
        ...(values[index].items || []),
      ],
    };
    setRow({ ...cloneRow });
  };

  const handleItems = (value, name, label, index, itemIndex) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    let items = cloneRow.values[index].items;
    items[itemIndex] = {
      ...(items[itemIndex] || []),
      [name]: value && (value[label] || value),
      type: value && value.type,
    };

    values[index] = {
      ...(values[index] || {}),
      items,
    };
    setRow({ ...cloneRow });
  };

  const removeCard = (index) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    values.splice(index, 1);
    setRow({ ...cloneRow });
  };

  const handlePropertyAdd = () => {
    const businessObject = getBusinessObject(element);
    const extensionElements = businessObject.extensionElements;
    if (
      extensionElements &&
      extensionElements.values[0] &&
      extensionElements.values[0].values &&
      extensionElements.values[0].values.length > 0
    ) {
      let { values } = extensionElements.values[0];
      let elements = values.filter(
        (val) =>
          ![
            "model",
            "modelName",
            "modelType",
            "view",
            "item",
            "roles",
            "readonly",
            "readonlyIf",
            "hidden",
            "hideIf",
            "required",
            "requiredIf",
            "title",
            "domain",
          ].includes(val.name)
      );
      businessObject.extensionElements.get("values")[0].values = [...elements];
    }
    handleAdd(row);
  };

  function getKeyData(data, key) {
    return (
      data &&
      data.reduce((arrs, item) => {
        if (item.name === key) {
          arrs.push([]);
        }
        arrs[arrs.length - 1] && arrs[arrs.length - 1].push(item);
        return arrs;
      }, [])
    );
  }

  useEffect(() => {
    if (!element) return;
    const businessObject = getBusinessObject(element);
    const extensionElements = businessObject.extensionElements;

    if (!extensionElements) {
      setRow(createData([]));
      return;
    }
    if (
      extensionElements &&
      extensionElements.values[0] &&
      extensionElements.values[0].values &&
      extensionElements.values[0].values.length > 0
    ) {
    }
    const elements = extensionElements.values[0].values;
    if (elements && elements.length < 1) return;
    let models = getKeyData(elements, "model");
    let values = [];
    models &&
      models.forEach((modelArr) => {
        let value = { items: [] };
        let items = getKeyData(modelArr, "item");
        modelArr.forEach((ele) => {
          if (ele.name === "model") {
            value.model = { model: ele.value };
          }
          if (ele.name === "modelName") {
            value.model = { ...value.model, name: ele.value };
          }
          if (ele.name === "modelType") {
            value.model = { ...value.model, type: ele.value };
          }
          if (ele.name === "view") {
            value.view = ele.value;
          }
          if (ele.name === "roles") {
            if (!ele.value) return;
            const roles = ele.value.split(",");
            let valueRoles = [];
            roles.forEach((role) => {
              valueRoles.push({ name: role });
            });
            value.roles = valueRoles;
          }
        });

        items &&
          items.forEach((item) => {
            value.items.push({
              itemName: item[0].value,
              attributeName: item[1] && item[1].name,
              attributeValue: item[1] && item[1].value,
            });
          });
        values.push(value);
      });
    setRow(createData(values));
  }, [element]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">View attributes</DialogTitle>
      <DialogContent>
        <DialogContentText>Add attributes</DialogContentText>
        <Typography className={classes.title}>{row && row.id}</Typography>
        {row && (
          <div>
            <div>
              {row.values.map(
                (val, index) =>
                  val && (
                    <div
                      key={`card_${index}`}
                      className={classes.cardContainer}
                    >
                      <Card className={classes.card}>
                        <CardContent className={classes.cardContent}>
                          <Grid>
                            <Grid container>
                              <Grid item xs={6} className={classes.grid}>
                                <Select
                                  fetchMethod={(data) => getModels(id, data)}
                                  update={(value) =>
                                    updateValue(
                                      value,
                                      "model",
                                      undefined,
                                      index
                                    )
                                  }
                                  name="model"
                                  value={val.model}
                                  optionLabel="name"
                                  label="Model"
                                />
                              </Grid>
                              <Grid
                                item
                                xs={6}
                                style={{ justifyContent: "flex-end" }}
                                className={classes.grid}
                              >
                                {val.model && (
                                  <Select
                                    fetchMethod={(data) =>
                                      getViews(val.model, data)
                                    }
                                    update={(value) =>
                                      updateValue(value, "view", "name", index)
                                    }
                                    name="view"
                                    value={val.view}
                                    label="View"
                                  />
                                )}
                              </Grid>
                            </Grid>
                            {val.model && val.view && (
                              <Select
                                fetchMethod={(data) => getRoles(data)}
                                update={(value) =>
                                  updateValue(value, "roles", undefined, index)
                                }
                                name="roles"
                                value={val.roles || []}
                                multiple={true}
                                label="Roles"
                                optionLabel="name"
                              />
                            )}
                            <Grid container alignItems="center">
                              <Grid item xs={6}>
                                <Typography style={{ fontWeight: 600 }}>
                                  Attributes
                                </Typography>
                              </Grid>
                              <Grid item xs={6} style={{ textAlign: "right" }}>
                                <Button
                                  className={classes.button}
                                  onClick={() => addItems(index)}
                                  disabled={!val.view}
                                  startIcon={<Add />}
                                >
                                  New
                                </Button>
                              </Grid>
                            </Grid>
                            <Grid>
                              {val && val.items && val.items.length > 0 && (
                                <TableContainer component={Paper}>
                                  <Table
                                    className={classes.table}
                                    size="small"
                                    aria-label="a dense table"
                                  >
                                    <TableHead>
                                      <TableRow>
                                        <TableCell
                                          className={classes.tableHead}
                                          align="center"
                                        >
                                          Item
                                        </TableCell>
                                        <TableCell
                                          className={classes.tableHead}
                                          align="center"
                                        >
                                          Name
                                        </TableCell>
                                        <TableCell
                                          className={classes.tableHead}
                                          align="center"
                                        >
                                          Value
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {val.model &&
                                        val.view &&
                                        val.items &&
                                        val.items.map((item, key) => (
                                          <TableRow
                                            key={`item_${val.id}_${key}`}
                                          >
                                            <TableCell
                                              component="th"
                                              scope="row"
                                              align="center"
                                              className={classes.tableCell}
                                            >
                                              <Select
                                                isLabel={false}
                                                fetchMethod={(data) =>
                                                  getItems(
                                                    val.view,
                                                    val.model.model,
                                                    data
                                                  )
                                                }
                                                update={(value) =>
                                                  handleItems(
                                                    value,
                                                    "itemName",
                                                    "name",
                                                    index,
                                                    key
                                                  )
                                                }
                                                name="itemName"
                                                value={item.itemName}
                                                optionLabel="name"
                                                label="Item"
                                              />
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className={classes.tableCell}
                                            >
                                              <Select
                                                isLabel={false}
                                                options={
                                                  item.type &&
                                                  (item.type.includes(
                                                    "panel"
                                                  ) ||
                                                    item.type === "button")
                                                    ? [
                                                        "readonly",
                                                        "readonlyIf",
                                                        "hidden",
                                                        "hideIf",
                                                      ]
                                                    : [
                                                        "readonly",
                                                        "readonlyIf",
                                                        "hidden",
                                                        "hideIf",
                                                        "required",
                                                        "requiredIf",
                                                        "title",
                                                        "domain",
                                                      ]
                                                }
                                                update={(value) =>
                                                  handleItems(
                                                    value,
                                                    "attributeName",
                                                    undefined,
                                                    index,
                                                    key
                                                  )
                                                }
                                                name="attributeName"
                                                value={item.attributeName}
                                                label="Attribute"
                                              />
                                            </TableCell>
                                            <TableCell
                                              align="center"
                                              className={classes.tableCell}
                                            >
                                              {item.attributeName &&
                                                [
                                                  "readonly",
                                                  "hidden",
                                                  "required",
                                                ].includes(
                                                  item.attributeName
                                                ) && (
                                                  <Checkbox
                                                    checked={
                                                      Boolean(
                                                        item.attributeValue
                                                      ) || false
                                                    }
                                                    onChange={(e) => {
                                                      handleItems(
                                                        e.target.checked,
                                                        "attributeValue",
                                                        undefined,
                                                        index,
                                                        key
                                                      );
                                                    }}
                                                    name="attributeValue"
                                                    color="primary"
                                                  />
                                                )}
                                              {item.attributeName &&
                                                [
                                                  "readonlyIf",
                                                  "hideIf",
                                                  "requiredIf",
                                                  "title",
                                                  "domain",
                                                ].includes(
                                                  item.attributeName
                                                ) && (
                                                  <TextField
                                                    value={
                                                      item.attributeValue || ""
                                                    }
                                                    onChange={(e) => {
                                                      handleItems(
                                                        e.target.value,
                                                        "attributeValue",
                                                        undefined,
                                                        index,
                                                        key
                                                      );
                                                    }}
                                                    name="attributeValue"
                                                    size="small"
                                                    placeholder={`${item.attributeName} value`}
                                                  />
                                                )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                      <IconButton
                        className={classes.iconButton}
                        onClick={() => removeCard(index)}
                      >
                        <Close />
                      </IconButton>
                    </div>
                  )
              )}
            </div>
            <IconButton className={classes.iconButton} onClick={addModelView}>
              <Add />
            </IconButton>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          className={classes.button}
          variant="outlined"
          onClick={handlePropertyAdd}
          color="primary"
        >
          Add
        </Button>
        <Button
          className={classes.button}
          variant="outlined"
          onClick={handleClose}
          color="primary"
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
