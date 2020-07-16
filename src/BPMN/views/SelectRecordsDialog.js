import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Paper,
  DialogTitle,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Search } from "@material-ui/icons";

const useStyles = makeStyles({
  dialogPaper: {
    padding: 5,
    minWidth: 300,
    overflow: "auto",
  },
  button: {
    textTransform: "none",
    margin: "10px 0px",
  },
  tableCell: {
    padding: "0px 10px",
    textAlign: "left",
  },
  tableHead: {
    fontWeight: 600,
    fontSize: 12,
  },
  table: {
    minWidth: 450,
  },
});

export default function ProcessConfigDialog({
  open,
  onClose,
  onOk,
  openConfigRecords,
  selectedRecords = [],
}) {
  const classes = useStyles();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const rows = [...(selectedRecords || [])];
    setRows(rows);
  }, [selectedRecords]);

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
        <strong>Select record</strong>
      </DialogTitle>
      <DialogContent>
        <div style={{ textAlign: "right" }}>
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={openConfigRecords}
            color="primary"
            className={classes.button}
          >
            Select
          </Button>
        </div>
        <TableContainer component={Paper}>
          <Table
            className={classes.table}
            size="small"
            aria-label="a dense table"
          >
            <TableHead>
              <TableRow>
                <TableCell align="left">Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows &&
                rows.length > 0 &&
                rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">
                      {row.fullName || row.name}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => onOk(rows)}
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
