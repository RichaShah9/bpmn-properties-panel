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
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import EnhancedTableHead from "./EnhancedTableHead";
import EnhancedTableToolbar from "./EnhancedToolbar";
import Service from "../../services/Service";

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
}));

export default function ConfigRecordsDialog({ open, onClose, onOk, wkf }) {
  const classes = useStyles();
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rows, setRows] = useState([]);
  const [model, setModel] = useState(null);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.id);
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  const handleConfirm = () => {
    const selectedRows = rows.filter((row) => selected.includes(row.id));
    onOk(selectedRows, model);
  };

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

  useEffect(() => {
    const fetchProcessConfigs = async () => {
      const { wkfProcessList } = wkf;
      let wkfProcessConfigListIds = [];
      wkfProcessList.forEach((process) => {
        const { wkfProcessConfigList } = process;
        const ids = wkfProcessConfigList.map((config) => config.id);
        wkfProcessConfigListIds = [...wkfProcessConfigListIds, ...(ids || [])];
      });
      const processConfigRes = await Service.search(
        "com.axelor.apps.bpm.db.WkfProcessConfig",
        {
          data: {
            _domain: "self.isStartModel = true",
            criteria: [
              {
                fieldName: "id",
                operator: "IN",
                value: wkfProcessConfigListIds,
              },
            ],
          },
        }
      );
      const processConfig =
        (processConfigRes &&
          processConfigRes.data &&
          processConfigRes.data[0]) ||
        {};
      const { model } = processConfig;
      if (!model) return;
      setModel(model);
      const recordsRes = await Service.search(model, {
        data: {
          _domain: "self.processInstanceId is not null",
        },
      });
      const records = (recordsRes && recordsRes.data) || [];
      setRows(records);
    };
    fetchProcessConfigs();
  }, [wkf]);

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
        <strong>Configuration</strong>
      </DialogTitle>
      <DialogContent>
        <div className={classes.root}>
          <Paper className={classes.paper}>
            <EnhancedTableToolbar numSelected={selected.length} />
            <TableContainer>
              <Table
                className={classes.table}
                aria-labelledby="tableTitle"
                size={"small"}
                aria-label="enhanced table"
              >
                <EnhancedTableHead
                  classes={classes}
                  numSelected={selected.length}
                  onSelectAllClick={handleSelectAllClick}
                  rowCount={rows.length}
                />
                <TableBody>
                  {rows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
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
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isItemSelected}
                              inputProps={{ "aria-labelledby": labelId }}
                              color="primary"
                            />
                          </TableCell>
                          <TableCell
                            component="th"
                            id={labelId}
                            scope="row"
                            padding="none"
                          >
                            {row.fullName || row.name}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 33 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
            />
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
