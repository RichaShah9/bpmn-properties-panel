import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
  Paper,
  Button,
  IconButton,
  Grid,
  Divider,
  Checkbox,
  TextField,
  FormControlLabel,
} from "@material-ui/core";
import FirstPageIcon from "@material-ui/icons/FirstPage";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import LastPageIcon from "@material-ui/icons/LastPage";

import Select from "./components/Select";
import { getModels, getViews, getItems, getRoles } from "../services/api";

const Ids = require("ids").default;

function nextId() {
  let ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed("viewAttributes_");
}

const useStyles1 = makeStyles((theme) => ({
  root: {
    flexShrink: 0,
    marginLeft: theme.spacing(2.5),
  },
}));

function TablePaginationActions(props) {
  const classes = useStyles1();
  const theme = useTheme();
  const { count, page, rowsPerPage, onChangePage } = props;

  const handleFirstPageButtonClick = (event) => {
    onChangePage(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onChangePage(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onChangePage(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <div className={classes.root}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </div>
  );
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};

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

function createData(name) {
  return {
    id: nextId(),
    values: [],
  };
}

const useStyles2 = makeStyles({
  table: {
    minWidth: 500,
  },
});

export default function CustomPaginationActionsTable({ id }) {
  const classes = useStyles2();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
      values: [
        { ...valueObj, parentId: selectedRow.id },
        ...selectedRow.values,
      ],
    });
  };

  const updateValue = (value, name, label, index) => {
    const row = { ...selectedRow };
    let values = row.values;
    values[index] = {
      ...(values[index] || {}),
      [name]: value[label] || value,
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

  useEffect(() => {
    setRows([createData()]);
  }, []);

  return (
    <>
      <Button onClick={addColumn}>Add</Button>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="custom pagination table">
          <TableBody>
            {(rowsPerPage > 0
              ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : rows
            ).map((row) => (
              <TableRow
                key={row.id}
                onClick={() => setSelectedRow(row)}
                style={{
                  background:
                    selectedRow && selectedRow.id === row.id
                      ? "lightblue"
                      : "white",
                }}
              >
                <TableCell component="th" scope="row">
                  {row.id}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={3}
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                SelectProps={{
                  inputProps: { "aria-label": "rows per page" },
                  native: true,
                }}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      {selectedRow && (
        <div>
          <Button onClick={addModelView}>Add model/view</Button>
          <div>
            {selectedRow.values.map(
              (val, index) =>
                val &&
                val.parentId && (
                  <Grid key={`${val.parentId}_${index}`}>
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
                      <Select
                        fetchMethod={(data) => getViews(val.model, data)}
                        update={(value) =>
                          updateValue(value, "view", "name", index)
                        }
                        name="view"
                        value={val.view}
                        label="View"
                      />
                    )}
                    {val.view && (
                      <>
                        <Select
                          fetchMethod={(data) => getRoles(data)}
                          update={(value) =>
                            updateValue(value, "roles", undefined, index)
                          }
                          name="roles"
                          value={val.roles}
                          multiple={true}
                          label="Roles"
                        />
                        <Button onClick={() => addItems(index)}>
                          Add Items
                        </Button>
                      </>
                    )}
                    {val.view &&
                      val.items &&
                      val.items.map((item, key) => (
                        <div key={`item_${val.id}_${key}`}>
                          <Select
                            fetchMethod={(data) =>
                              getItems(val.view, val.model, data)
                            }
                            update={(value) =>
                              handleItems(
                                value,
                                "itemName",
                                "title",
                                index,
                                key
                              )
                            }
                            name="itemName"
                            value={item.itemName}
                            optionLabel="title"
                            label="Item"
                          />
                          {val.items.length > 0 && (
                            <Button onClick={() => addAttributes(key, index)}>
                              Add Attributes
                            </Button>
                          )}
                          {item &&
                            item.attributes &&
                            item.attributes.map((attribute, attributeKey) => (
                              <div
                                key={`attribute_${val.id}_${key}_${attributeKey}`}
                              >
                                <Select
                                  options={[
                                    "readonly",
                                    "readonlyIf",
                                    "hidden",
                                    "required",
                                    "requiredIf",
                                    "title",
                                    "domain",
                                  ]}
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
                                  ["readonly", "hidden", "required"].includes(
                                    attribute.attributeName
                                  ) && (
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={
                                            attribute.attributeValue || false
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
                                  ].includes(attribute.attributeName) && (
                                    <TextField
                                      value={attribute.attributeValue || ""}
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
                                      fullWidth
                                      variant="outlined"
                                      size="small"
                                      placeholder={`${attribute.attributeName} value`}
                                    />
                                  )}
                              </div>
                            ))}
                        </div>
                      ))}
                    <Divider />
                  </Grid>
                )
            )}
          </div>
        </div>
      )}
    </>
  );
}
