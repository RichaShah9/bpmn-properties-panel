import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
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
} from "@material-ui/core";
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
  attributes: [],
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
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  card: {
    margin: "5px 0px 10px 0px",
  },
  cardContent: {
    padding: "10px !important",
  },
  tableHead: {
    cursor: "pointer",
    padding: 8,
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
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const addColumn = () => {
    setRows([...rows, createData()]);
  };

  const updateRows = (row) => {
    const cloneRows = [...rows];
    const rowIndex = cloneRows.findIndex((r) => r.id === row.id);
    cloneRows[rowIndex] = {
      ...row,
    };
    setRows([...cloneRows]);
  };

  const addModelView = () => {
    setSelectedRow({
      ...selectedRow,
      values: [{ ...valueObj }, ...selectedRow.values],
    });
  };

  const updateValue = (value, name, label, index) => {
    const row = { ...selectedRow };
    let values = row.values;
    values[index] = {
      ...(values[index] || {}),
      [name]: (value && value[label]) || value,
    };
    setSelectedRow({ ...row });
    updateRows(row);
  };

  const addItems = (index) => {
    const row = { ...selectedRow };
    let values = row.values;
    values[index] = {
      ...(values[index] || {}),
      items: [
        { ...itemsObj, id: `item_${selectedRow.id}_${index}` },
        ...(values[index].items || []),
      ],
    };
    setSelectedRow({ ...row });
    updateRows(row);
  };

  const addAttributes = (itemIndex, valueIndex) => {
    const row = { ...selectedRow };
    let values = row.values;
    let items = row.values[valueIndex].items;
    items[itemIndex] = {
      ...(items[itemIndex] || []),
      attributes: [
        { id: `attribute_${selectedRow.id}_${valueIndex}` },
        ...(items[itemIndex].attributes || []),
      ],
    };

    values[valueIndex] = {
      ...(values[valueIndex] || {}),
      items,
    };
    setSelectedRow({ ...row });
    updateRows(row);
  };

  const handleItems = (value, name, label, index, itemIndex) => {
    const row = { ...selectedRow };
    let values = row.values;
    let items = row.values[index].items;
    items[itemIndex] = {
      ...(items[itemIndex] || []),
      [name]: value && value[label],
      type: value && value.type,
    };

    values[index] = {
      ...(values[index] || {}),
      items,
    };
    setSelectedRow({ ...row });
    updateRows(row);
  };

  const handleAttribute = (value, name, index, itemIndex, attributeIndex) => {
    const row = { ...selectedRow };
    let values = row.values;
    let items = values[index].items;
    let attributes = items[itemIndex].attributes;

    attributes[attributeIndex] = {
      ...(attributes[attributeIndex] || []),
      [name]: value,
    };

    items[itemIndex] = {
      ...(items[index] || {}),
      attributes,
    };

    values[index] = {
      ...(values[index] || {}),
      items,
    };
    setSelectedRow({ ...row });
    updateRows(row);
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
    handleAdd(rows);
  };

  function getKeyData(data, key) {
    return data.reduce((arrs, item) => {
      if (item.name === key) {
        arrs.push([]);
      }
      arrs[arrs.length - 1] && arrs[arrs.length - 1].push(item);
      return arrs;
    }, []);
  }

  useEffect(() => {
    if (!element) return;
    const businessObject = getBusinessObject(element);
    const extensionElements = businessObject.extensionElements;
    if (
      extensionElements &&
      extensionElements.values[0] &&
      extensionElements.values[0].values &&
      extensionElements.values[0].values.length > 0
    ) {
    }
    const elements = extensionElements.values[0].values;
    if (elements.length < 1) return;
    let models = getKeyData(elements, "model");
    let values = [];
    models.forEach((modelArr) => {
      let value = { items: [] };
      let items = getKeyData(modelArr, "item");
      modelArr.forEach((ele) => {
        if (ele.name === "model") {
          value.model = ele.value;
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
          let itemName = item[0].value;
          let attributes = [];
          for (let i = 1; i < item.length; i++) {
            attributes.push({
              attributeName: item[i].name,
              attributeValue: item[i].value,
            });
          }
          value.items.push({
            itemName,
            attributes,
          });
        });
      values.push(value);
    });
    setRows([createData(values)]);
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
        <Button
          className={classes.button}
          variant="outlined"
          onClick={addColumn}
          style={{
            margin: "10px 0px",
          }}
        >
          Add
        </Button>
        <TableContainer component={Paper}>
          <Table className={classes.table} aria-label="custom pagination table">
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => setSelectedRow(row)}
                  style={{
                    background:
                      selectedRow && selectedRow.id === row.id
                        ? "#F8F8F8"
                        : "white",
                  }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    className={classes.tableHead}
                  >
                    {row.id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {selectedRow && (
          <div>
            <Button
              className={classes.button}
              variant="outlined"
              onClick={addModelView}
              style={{
                margin: "10px 0px",
              }}
            >
              Add model/view
            </Button>
            <div>
              {selectedRow.values.map(
                (val, index) =>
                  val && (
                    <Card key={`card_${index}`} className={classes.card}>
                      <CardContent className={classes.cardContent}>
                        <Grid>
                          <Select
                            fetchMethod={(data) => getModels(id, data)}
                            update={(value) =>
                              updateValue(value, "model", "model", index)
                            }
                            name="model"
                            value={val.model}
                            optionLabel="model"
                            label="Model"
                          />
                          {val.model && (
                            <div className={classes.container}>
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
                              <Button
                                className={classes.button}
                                variant="outlined"
                                onClick={() => addItems(index)}
                                disabled={!val.view}
                              >
                                Add Items
                              </Button>
                            </div>
                          )}
                          {val.model && val.view && (
                            <Select
                              fetchMethod={(data) => getRoles(data)}
                              update={(value) =>
                                updateValue(value, "roles", undefined, index)
                              }
                              name="roles"
                              value={val.roles}
                              multiple={true}
                              label="Roles"
                              optionLabel="name"
                            />
                          )}
                          {val.model &&
                            val.view &&
                            val.items &&
                            val.items.map((item, key) => (
                              <div key={`item_${val.id}_${key}`}>
                                <div className={classes.container}>
                                  <Select
                                    fetchMethod={(data) =>
                                      getItems(val.view, val.model, data)
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
                                  <Button
                                    className={classes.button}
                                    variant="outlined"
                                    onClick={() => addAttributes(key, index)}
                                    disabled={!item || !item.itemName}
                                  >
                                    Add Attributes
                                  </Button>
                                </div>
                                {item &&
                                  item.itemName &&
                                  item.attributes &&
                                  item.attributes.map(
                                    (attribute, attributeKey) => (
                                      <div
                                        key={`attribute_${val.id}_${key}_${attributeKey}`}
                                      >
                                        <Select
                                          options={
                                            item.type &&
                                            (item.type.includes("panel") ||
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
                                          update={(value) => {
                                            handleAttribute(
                                              value,
                                              "attributeName",
                                              index,
                                              key,
                                              attributeKey
                                            );
                                          }}
                                          name="attributeName"
                                          value={attribute.attributeName}
                                          label="Attribute"
                                        />
                                        {attribute.attributeName &&
                                          [
                                            "readonly",
                                            "hidden",
                                            "required",
                                          ].includes(
                                            attribute.attributeName
                                          ) && (
                                            <FormControlLabel
                                              style={{ marginLeft: "5%" }}
                                              control={
                                                <Checkbox
                                                  checked={
                                                    Boolean(
                                                      attribute.attributeValue
                                                    ) || false
                                                  }
                                                  onChange={(e) => {
                                                    handleAttribute(
                                                      e.target.checked,
                                                      "attributeValue",
                                                      index,
                                                      key,
                                                      attributeKey
                                                    );
                                                  }}
                                                  name="attributeValue"
                                                />
                                              }
                                              label={attribute.attributeName}
                                            />
                                          )}
                                        {attribute.attributeName &&
                                          [
                                            "readonlyIf",
                                            "hideIf",
                                            "requiredIf",
                                            "title",
                                            "domain",
                                          ].includes(
                                            attribute.attributeName
                                          ) && (
                                            <TextField
                                              value={
                                                attribute.attributeValue || ""
                                              }
                                              onChange={(e) => {
                                                handleAttribute(
                                                  e.target.value,
                                                  "attributeValue",
                                                  index,
                                                  key,
                                                  attributeKey
                                                );
                                              }}
                                              name="attributeValue"
                                              style={{
                                                width: "90%",
                                                marginLeft: "5%",
                                              }}
                                              variant="outlined"
                                              size="small"
                                              placeholder={`${attribute.attributeName} value`}
                                            />
                                          )}
                                      </div>
                                    )
                                  )}
                              </div>
                            ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  )
              )}
            </div>
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
