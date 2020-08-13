import React, { useState, useEffect } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Button,
  Grid,
  Checkbox,
  TextField,
  Card,
  CardContent,
  Typography,
  IconButton,
} from "@material-ui/core";
import { Add, Close } from "@material-ui/icons";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Select from "../../../components/Select";
import { getModels, getViews, getItems, getRoles } from "../../../services/api";
import { translate } from "../../../utils";

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
  button: {
    textTransform: "none",
  },
  addButton: {
    borderRadius: 0,
    marginLeft: 5,
    padding: 0,
    height: 23,
    border: "1px solid #ccc",
    color: "#727272",
    "&:hover": {
      border: "1px solid #727272",
    },
  },
  grid: {
    padding: "0px 5px 0px 0px",
  },
  card: {
    margin: "5px 0px 10px 0px",
    boxShadow: "none",
    width: "100%",
    border: "1px solid #ccc",
    background: "#f8f8f8",
    borderRadius: 0,
  },
  cardContent: {
    padding: "10px !important",
  },
  cardContainer: {
    display: "flex",
    alignItems: "flex-start",
  },
  tableCell: {
    padding: "6px !important",
    width: "33%",
  },
  tableHead: {
    padding: "6px !important",
    fontWeight: 600,
  },
  iconButton: {
    margin: "5px 0px 5px 5px",
    borderRadius: 0,
    border: "1px solid #ccc",
    padding: 2,
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
});

export default function ViewAttributePanel({ id, handleAdd, element }) {
  const classes = useStyles();
  const [row, setRow] = useState(null);

  const addModelView = () => {
    setRow({
      ...row,
      values: [...row.values, { ...valueObj }],
    });
  };

  const updateErrorValue = (index, name) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    values[index] = {
      ...(values[index] || {}),
      [`${name}Error`]: true,
    };
    setRow({ ...cloneRow });
  };

  const updateValue = (value, name, label, index) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    values[index] = {
      ...(values[index] || {}),
      [name]: (value && value[label]) || value,
      [`${name}Error`]: false,
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

  const updateItemErrorValues = (index, itemIndex, name) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    let items = cloneRow.values[index].items;
    items[itemIndex] = {
      ...(items[itemIndex] || []),
      [`${name}Error`]: true,
    };
    values[index] = {
      ...(values[index] || {}),
      items,
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
      [`${name}Error`]: false,
    };
    if (name === "attributeName") {
      items[itemIndex].attributeValue = null;
    }
    values[index] = {
      ...(values[index] || {}),
      items,
    };
    setRow({ ...cloneRow });
  };

  const removeItem = (valueIndex, itemIndex) => {
    const cloneRow = { ...row };
    let values = cloneRow.values;
    let items = cloneRow.values[valueIndex].items;
    items.splice(itemIndex, 1);
    values[valueIndex] = {
      ...(values[valueIndex] || {}),
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
    let values, camundaProperty;
    if (extensionElements && extensionElements.values) {
      camundaProperty = extensionElements.values.find(
        (e) => e.$type === "camunda:Properties"
      );
      values = camundaProperty.values;
    }
    if (values) {
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
            "itemLabel",
          ].includes(val.name)
      );
      camundaProperty.values = [...elements];
    }
    let isValid = true;
    if (row.values.length > 0) {
      row.values &&
        row.values.forEach((value, index) => {
          const { model, items = [] } = value;
          if (!model) {
            isValid = false;
            updateErrorValue(index, "model");
            return;
          }
          if (items.length > 0) {
            items.forEach((item, itemIndex) => {
              let { itemName, attributeName, attributeValue } = item;
              if (!itemName) {
                isValid = false;
                updateItemErrorValues(index, itemIndex, "itemName");
                return;
              }
              if (!attributeName) {
                isValid = false;
                updateItemErrorValues(index, itemIndex, "attributeName");
                return;
              }
              if (!attributeValue) {
                if (
                  !["readonly", "hidden", "required"].includes(attributeName)
                ) {
                  isValid = false;
                  updateItemErrorValues(index, itemIndex, "attributeValue");
                  return;
                }
              }
            });
          }
        });
    }
    if (isValid) {
      handleAdd(row);
    }
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

  const getBool = (val) => {
    if (!val) return;
    return !!JSON.parse(String(val).toLowerCase());
  };

  useEffect(() => {
    if (!element) return;
    const businessObject = getBusinessObject(element);
    const extensionElements = businessObject.extensionElements;

    if (!extensionElements) {
      setRow(createData([]));
      return;
    }
    let extensionElementValues, camundaProperty;
    if (extensionElements && extensionElements.values) {
      camundaProperty = extensionElements.values.find(
        (e) => e.$type === "camunda:Properties"
      );
      extensionElementValues = camundaProperty.values;
    }
    if (extensionElementValues && extensionElementValues.length < 1) return;
    let models = getKeyData(extensionElementValues, "model");
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
              itemName: {
                name: item[0] && item[0].value,
                label: item[2] && item[2].value,
              },
              attributeName: item[1] && item[1].name,
              attributeValue: item[1] && item[1].value,
            });
          });
        values.push(value);
      });
    setRow(createData(values));
  }, [element]);

  return (
    <div>
      {row && (
        <div>
          <div>
            {row.values.map(
              (val, index) =>
                val && (
                  <div key={`card_${index}`} className={classes.cardContainer}>
                    <Card className={classes.card}>
                      <CardContent className={classes.cardContent}>
                        <Grid>
                          <Grid container>
                            <Grid item xs={6} className={classes.grid}>
                              <label className={classes.label}>
                                {translate("Model")}
                              </label>
                              <Select
                                fetchMethod={(data) => getModels(id, data)}
                                update={(value) =>
                                  updateValue(value, "model", undefined, index)
                                }
                                name="model"
                                value={val.model}
                                error={val.modelError}
                                optionLabel="name"
                                isLabel={false}
                              />
                            </Grid>
                            <Grid
                              item
                              xs={6}
                              style={{ justifyContent: "flex-end" }}
                              className={classes.grid}
                            >
                              {val.model && (
                                <div>
                                  <label className={classes.label}>
                                    {translate("View")}
                                  </label>
                                  <Select
                                    fetchMethod={(data) =>
                                      getViews(val.model, data)
                                    }
                                    update={(value) =>
                                      updateValue(value, "view", "name", index)
                                    }
                                    name="view"
                                    value={val.view || ""}
                                    isLabel={false}
                                  />
                                </div>
                              )}
                            </Grid>
                          </Grid>
                          {(val.model || val.view) && (
                            <div>
                              <label className={classes.label}>
                                {translate("Roles")}
                              </label>
                              <Select
                                fetchMethod={(data) => getRoles(data)}
                                update={(value) =>
                                  updateValue(value, "roles", undefined, index)
                                }
                                name="roles"
                                value={val.roles || []}
                                multiple={true}
                                isLabel={false}
                                optionLabel="name"
                              />
                            </div>
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
                                disabled={!val.model}
                                startIcon={<Add />}
                              >
                                New
                              </Button>
                            </Grid>
                          </Grid>
                          <Grid>
                            {val && val.items && val.items.length > 0 && (
                              <TableContainer>
                                <Table size="small" aria-label="a dense table">
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
                                      <TableCell
                                        className={classes.tableHead}
                                        align="center"
                                      ></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {(val.model || val.view) &&
                                      val.items &&
                                      val.items.map((item, key) => (
                                        <TableRow key={`item_${val.id}_${key}`}>
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
                                                  val.model,
                                                  data
                                                )
                                              }
                                              update={(value) =>
                                                handleItems(
                                                  value,
                                                  "itemName",
                                                  undefined,
                                                  index,
                                                  key
                                                )
                                              }
                                              name="itemName"
                                              value={item.itemName}
                                              error={item.itemNameError}
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
                                                item &&
                                                item.itemName &&
                                                item.itemName.type &&
                                                (item.itemName.type.includes(
                                                  "panel"
                                                ) ||
                                                  item.itemName.type ===
                                                    "button")
                                                  ? [
                                                      "readonly",
                                                      "readonlyIf",
                                                      "hidden",
                                                      "hideIf",
                                                      "title",
                                                    ]
                                                  : item &&
                                                    item.itemName &&
                                                    item.itemName.name ===
                                                      "self"
                                                  ? ["readonly", "readonlyIf"]
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
                                              error={item.attributeNameError}
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
                                                    getBool(
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
                                                  error={
                                                    item.attributeValueError
                                                  }
                                                  name="attributeValue"
                                                  size="small"
                                                  placeholder={`${item.attributeName} value`}
                                                />
                                              )}
                                          </TableCell>
                                          <TableCell
                                            align="center"
                                            className={classes.tableCell}
                                          >
                                            <IconButton
                                              className={classes.iconButton}
                                              onClick={() =>
                                                removeItem(index, key)
                                              }
                                            >
                                              <Close fontSize="small" />
                                            </IconButton>
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
                      <Close fontSize="small" />
                    </IconButton>
                  </div>
                )
            )}
          </div>
          <IconButton className={classes.iconButton} onClick={addModelView}>
            <Add fontSize="small" />
          </IconButton>
        </div>
      )}
      <Button
        className={classnames(classes.button, classes.addButton)}
        variant="outlined"
        onClick={handlePropertyAdd}
        color="primary"
      >
        Ok
      </Button>
    </div>
  );
}
