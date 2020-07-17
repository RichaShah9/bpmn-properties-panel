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
  CircularProgress,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Search } from "@material-ui/icons";

import Service from "../../services/Service";
import { getGridView } from "../../services/api";
import { pascalToKebabCase } from "../../utils";

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
  loader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});

export default function ProcessConfigDialog({
  open,
  onClose,
  onOk,
  openConfigRecords,
  selectedRecords = [],
  wkf,
}) {
  const classes = useStyles();
  const [rows, setRows] = useState(null);
  const [fields, setFields] = useState(null);
  const [model, setModel] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [isCustomModel, setCustomModel] = useState(false);

  useEffect(() => {
    const fetchProcessConfigs = async () => {
      setLoading(true);
      const { wkfProcessList } = wkf;
      let wkfProcessConfigListIds = [];
      wkfProcessList.forEach((process) => {
        const { wkfProcessConfigList } = process;
        const ids =
          wkfProcessConfigList &&
          wkfProcessConfigList.map((config) => config.id);
        wkfProcessConfigListIds = [...wkfProcessConfigListIds, ...(ids || [])];
      });
      const processConfigRes = await Service.search(
        "com.axelor.apps.bpm.db.WkfProcessConfig",
        {
          fields: [
            "id",
            "isStartModel",
            "metaJsonModel",
            "metaJsonModel.name",
            "metaModel",
            "model",
            "pathCondition",
            "processInstanceId",
            "processPath",
            "selected",
            "wkfProcess",
          ],
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
      const { model, metaModel } = processConfig;
      const modelArray = model && model.split(".");
      const name = modelArray[modelArray.length - 1];
      const isCustom =
        !metaModel && processConfig && processConfig["metaJsonModel.name"];
      const view = isCustom
        ? `custom-model-${processConfig["metaJsonModel.name"]}-grid`
        : `${pascalToKebabCase(name)}-grid`;
      const fields = await getGridView(view, isCustom);
      setFields(fields);
      setModel(model);
      setLoading(false);
      setCustomModel(isCustom);
    };
    fetchProcessConfigs();
  }, [wkf]);

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
      {isLoading ? (
        <div className={classes.loader}>
          <CircularProgress />
        </div>
      ) : (
        <DialogContent>
          <div style={{ textAlign: "right" }}>
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={() => openConfigRecords(fields, model, isCustomModel)}
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
                  {fields &&
                    fields.map((field) => (
                      <TableCell align="left" key={field.name}>
                        {field.title}
                      </TableCell>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows &&
                  rows.length > 0 &&
                  rows.map((row, index) => (
                    <TableRow key={index}>
                      {fields.map((field) => (
                        <TableCell component="th" scope="row" key={row.id}>
                          {row[field.name]
                            ? field.targetName
                              ? row[field.name][field.targetName]
                              : row[field.name]
                            : ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      )}
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
