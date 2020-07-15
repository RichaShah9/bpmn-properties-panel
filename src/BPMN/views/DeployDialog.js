import React, { useState } from "react";
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
import _ from "lodash";

import Select from "../components/Select";

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
  select: {
    minWidth: 250,
    marginLeft: 10,
  },
  tableCell: {
    padding: "0px 10px",
    textAlign: "left",
  },
  tableHead: {
    fontWeight: 600,
    fontSize: 12,
  },
});

export default function DeployDialog({ open, onClose, ids, onOk }) {
  const { oldIds, currentIds } = ids || {};
  const [oldSelectedElements, setOldElements] = useState(null);
  const [wkfMigrationMap, setWkfMigrationMap] = useState([]);

  const classes = useStyles();

  const handleAdd = (oldEle, newEle) => {
    const newElement = currentIds.find((ele) => ele.name === newEle.name);
    const elementIndex = wkfMigrationMap.findIndex(
      (wkf) => (wkf.oldNode && wkf.oldNode.id) === oldEle.id
    );
    if (elementIndex > -1) {
      const cloneWkfMigrationMap = [...wkfMigrationMap];
      cloneWkfMigrationMap[elementIndex] = {
        oldNode: oldEle,
        currentNode: newElement,
      };
      setWkfMigrationMap([...cloneWkfMigrationMap]);
    } else {
      setWkfMigrationMap([
        ...wkfMigrationMap,
        { oldNode: oldEle, currentNode: newElement },
      ]);
    }
    setOldElements([...(oldSelectedElements || []), { ...oldEle }]);
  };

  const onConfirm = () => {
    let cloneWkfMigrationMap = {};
    wkfMigrationMap &&
      wkfMigrationMap.map((ele) => {
        cloneWkfMigrationMap[ele.oldNode.id] = ele.currentNode.id;
        return ele;
      });

    let excludeElements = _(oldIds)
      .differenceBy(oldSelectedElements, "id", "name")
      .map(_.partial(_.pick, _, "id", "name"))
      .value();

    excludeElements &&
      excludeElements.forEach((ele) => {
        const currentNode = currentIds.find(
          (current) => (current && current.id) === ele.id
        );

        if (ele && ele.id) {
          cloneWkfMigrationMap[ele.id] =
            (currentNode && currentNode.id) || null;
        }
      });
    onOk(cloneWkfMigrationMap);
  };

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
        <strong>Node Mapping</strong>
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper}>
          <Table size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableHead} align="center">
                  Old Node
                </TableCell>
                <TableCell className={classes.tableHead} align="center">
                  Current Node
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {oldIds.map((oldEle, index) => (
                <TableRow key={index}>
                  <TableCell
                    component="th"
                    scope="row"
                    align="center"
                    className={classes.tableCell}
                  >
                    {oldEle.name}
                  </TableCell>
                  <TableCell
                    component="th"
                    scope="row"
                    align="center"
                    className={classes.tableCell}
                  >
                    <Select
                      className={classes.select}
                      isLabel={false}
                      options={currentIds}
                      defaultValue={
                        currentIds &&
                        oldEle &&
                        currentIds.find(
                          (current) => (current && current.id) === oldEle.id
                        )
                      }
                      update={(value) => handleAdd(oldEle, value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
