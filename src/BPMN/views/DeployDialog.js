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
    minWidth: 450,
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
  migrationPlan: {
    marginBottom: 34,
  },
});

export default function DeployDialog({ open, onClose, ids, onOk }) {
  const { oldElements, currentElements } = ids || {};
  const [oldSelectedElements, setOldElements] = useState(null);
  const [wkfMigrationMap, setWkfMigrationMap] = useState([]);
  const [migrationPlan, setMigrationPlan] = useState({
    label: "Selected",
    value: "selected",
  });

  const classes = useStyles();

  const handleAdd = (oldEle, newEle) => {
    const newElement = currentElements.find((ele) => ele.name === (newEle && newEle.name));
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
        if(!ele.oldNode || !ele.oldNode.id) return null
        cloneWkfMigrationMap[ele.oldNode.id] = ele.currentNode && ele.currentNode.id;
        return ele;
      });

    let excludeElements = _(oldElements)
      .differenceBy(oldSelectedElements, "id", "name")
      .map(_.partial(_.pick, _, "id", "name"))
      .value();

    excludeElements &&
      excludeElements.forEach((ele) => {
        const currentNode = currentElements.find(
          (current) => (current && current.id) === ele.id
        );

        if (ele && ele.id && currentNode && currentNode.id) {
          cloneWkfMigrationMap[ele.id] = currentNode && currentNode.id;
        }
      });
    onOk(cloneWkfMigrationMap, migrationPlan);
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
        <Select
          isLabel={true}
          options={[
            {
              label: "New",
              value: "new",
            },
            {
              label: "All",
              value: "all",
            },
            {
              label: "Selected",
              value: "selected",
            },
          ]}
          update={(value) => setMigrationPlan(value)}
          optionLabel="label"
          value={migrationPlan}
          label="Migration Plan"
          className={classes.migrationPlan}
          isTranslated={false}
        />
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
              {oldElements &&
                oldElements.map((oldEle, index) => (
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
                        options={
                          currentElements &&
                          currentElements.filter(
                            (element) => element.type === oldEle.type
                          )
                        }
                        defaultValue={
                          currentElements &&
                          oldEle &&
                          currentElements.find(
                            (current) => (current && current.id) === oldEle.id
                          )
                        }
                        update={(value) => handleAdd(oldEle, value)}
                        isTranslated={false}
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
