import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Table,
  TableContainer,
  TableCell,
  TableRow,
  TableBody,
  Paper,
  DialogTitle,
  TablePagination,
  Checkbox,
  CircularProgress,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import EnhancedTableHead from "./EnhancedTableHead";
import EnhancedTableToolbar from "./EnhancedToolbar";
import TablePaginationActions from "./TablePaginationActions";
import Service from "../../../services/Service";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    padding: 5,
    minWidth: 300,
    overflow: "auto",
  },
  button: {
    textTransform: "none",
    margin: "10px 0px",
  },
  root: {
    width: "100%",
  },
  paper: {
    width: "100%",
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 450,
  },
  loader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  selected: {
    backgroundColor: "#D3D3D3 !important",
  },
  tableContainer:{
    maxHeight: 450
  }
}));

const rowsPerPage = 20;
export default function MigrateRecordsDialog({
  open,
  onClose,
  onOk,
  model,
  fields: tableFields,
  isCustomModel,
  metaJsonModel,
}) {
  const classes = useStyles();
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [fields, setFields] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [data, setData] = useState({
    total: null,
    offset: 0,
    limit: 20,
  });

  const handleSelectAllClick = (event) => {
    setIsSelectAll(prevChecked => !prevChecked);
    if (event.target.checked) {
      let cloneRows = [...(rows || [])];
      cloneRows = cloneRows.splice(rowsPerPage * page, rowsPerPage + 1);
      const newSelecteds = cloneRows.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (e, newPage, isBack) => {
    let { limit, offset, total } = data;
    setSelected([]);
    if (isBack) {
      setPage(newPage);
      setData({
        ...data,
        offset: offset - limit,
      });
    } else {
      setPage(newPage);
      if (searchCriteria && searchCriteria.length > 0) {
        setData({
          ...data,
          offset: offset + limit < total ? offset + limit : total,
        });
        return;
      }
      getRecords(model, limit, offset + limit < total ? offset + limit : total);
    }
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleConfirm = () => {
    const selectedRows = rows.filter((row) => selected.includes(row.id));
    onOk(selectedRows, model);
  };

  const searchRecords = (e, field) => {
    const cloneSearchCriteria = [...(searchCriteria || [])];
    if (e.keyCode === 13) {
      const index = cloneSearchCriteria.findIndex(
        (c) =>
          c.fieldName ===
          (isCustomModel ? `attrs.${e.target.name}` : e.target.name)
      );

      let query = {
        fieldName: isCustomModel ? `attrs.${e.target.name}` : e.target.name,
        operator:
          isCustomModel && field
            ? field.type === "decimal" || field.type === "data"
              ? "="
              : "like"
            : isNaN(e.target.value)
            ? "like"
            : "=",
        value: e.target.value,
      };
      if (index > -1) {
        if (e.target.value === "" || !e.target.value) {
          cloneSearchCriteria.splice(index, 1);
        } else {
          cloneSearchCriteria[index] = query;
        }
      } else {
        cloneSearchCriteria.push(query);
      }
      setSearchCriteria(cloneSearchCriteria);
      getRecords(model, 20, 0, cloneSearchCriteria, true);
    }
  };

  const getRecords = React.useCallback(
    async function getRecords(
      model,
      limit = 20,
      offset = 0,
      criteria,
      isSearch
    ) {
      setLoading(true);
      let requestPayload = {
        data: {
          _domain: isCustomModel && metaJsonModel
            ? `self.processInstanceId is not null AND self.jsonModel = '${metaJsonModel}'`
            : "self.processInstanceId is not null",
        },
      };

      if (criteria && criteria.length > 0) {
        requestPayload.data.criteria = criteria;
        requestPayload.data.operator = "and";
      }

      if (!isSearch) {
        requestPayload.limit = limit;
        requestPayload.offset = offset;
      }
      const recordsRes = await Service.search(model, requestPayload);
      const records = (recordsRes && recordsRes.data) || [];
      let renderRecords = [];
      setLoading(false);
      if (isCustomModel) {
        records.length > 0 &&
          records.forEach((record) => {
            const { attrs } = record;
            const recs = JSON.parse(attrs);
            renderRecords.push({
              ...(record || {}),
              ...(recs || {}),
            });
          });
      } else {
        renderRecords = [...(records || [])];
      }
      if (isSearch) {
        setPage(0);
        setRows([...renderRecords]);
      } else {
        setRows((rows) => [...rows, ...renderRecords]);
      }
      if (!recordsRes) return;
      setData({
        limit: 20,
        offset: recordsRes.offset,
        total: recordsRes.total,
      });
    },
    [isCustomModel, metaJsonModel]
  );

  useEffect(() => {
    setFields(tableFields);
  }, [tableFields]);

  useEffect(() => {
    const fetchProcessConfigs = async () => {
      if (!model) return;
      getRecords(model);
    };
    fetchProcessConfigs();
  }, [model, getRecords]);

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
        <strong>Records to migrate</strong>
      </DialogTitle>

      <DialogContent>
        <div className={classes.root}>
          <Paper className={classes.paper}>
            <EnhancedTableToolbar numSelected={selected.length} />
            {fields && fields.length > 0 && (
              <TableContainer className={classes.tableContainer}>
                <Table
                  className={classes.table}
                  aria-labelledby="tableTitle"
                  size={"small"}
                  aria-label="enhanced table"
                  stickyHeader
                >
                  <EnhancedTableHead
                    classes={classes}
                    numSelected={selected.length}
                    onSelectAllClick={handleSelectAllClick}
                    isSelectAll={isSelectAll}
                    fields={fields}
                    setSelectedField={setSelectedField}
                    selectedField={selectedField}
                    searchRecords={searchRecords}
                  />
                  <TableBody>
                    {isLoading ? (
                      <div className={classes.loader}>
                        <CircularProgress />
                      </div>
                    ) : (
                      rows
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((row, index) => {
                          const isItemSelected = isSelected(row.id);
                          const labelId = `enhanced-table-checkbox-${index}`;
                          return (
                            <TableRow
                              hover
                              onClick={(event) => handleClick(event, row.id)}
                              role="checkbox"
                              aria-checked={isItemSelected}
                              tabIndex={-1}
                              key={row.id}
                              selected={isItemSelected}
                              classes={{
                                selected: classes.selected,
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={isItemSelected}
                                  inputProps={{ "aria-labelledby": labelId }}
                                  color="primary"
                                />
                              </TableCell>
                              {fields &&
                                fields.map((field, index) => (
                                  <TableCell
                                    key={`${field.title}_${index}`}
                                    component="th"
                                    id={labelId}
                                    scope="row"
                                    align="left"
                                  >
                                    {row[field.name]
                                      ? field.targetName
                                        ? row[field.name][field.targetName]
                                        : row[field.name]
                                      : ""}
                                  </TableCell>
                                ))}
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {rows.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[]}
                labelRowsPerPage={""}
                component="div"
                count={data.total || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={handleChangePage}
                ActionsComponent={TablePaginationActions}
              />
            )}
          </Paper>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleConfirm}
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
