import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  dialogPaper: {
    padding: 5,
    minWidth: 300,
    overflow: "auto",
  },
});

export default function AlertDialog({ openAlert, alertClose, message, title }) {
  const classes = useStyles();
  return (
    <Dialog
      open={openAlert}
      onClose={alertClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={alertClose} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
}
