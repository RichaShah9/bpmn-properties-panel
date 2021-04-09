import React from "react";
import {
  Grid,
  Button,
  IconButton,
  Typography,
  CardActions,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import classNames from "classnames";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  popover: {
    maxHeight: "90%",
  },
  cardContent: {
    overflow: "auto",
    maxHeight: "80%",
    minWidth: 250,
  },
  cardContentItemText: {
    fontSize: 12,
    lineHeight: 0.5,
    paddingBottom: 8,
  },
  cardContentItemTitle: {
    fontSize: 16,
  },
  cardActionView: {
    justifyContent: "flex-end",
  },
  noFields: {
    textAlign: "center",
    color: "gray",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    textTransform: "none",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
}));

function FieldPopoverComponent({
  data,
  icon,
  title,
  iconButton = false,
  buttonClassName,
  buttonTitle,
  onSubmit,
  iconButtonClassName,
  contentHeight = 600,
}) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState([]);
  const fields = Object.values(data).filter((e) => e.isRemoved !== false);
  const handleOpen = React.useCallback((e) => {
    e.stopPropagation();
    setOpen(true);
  }, []);

  const handleClose = React.useCallback((e) => {
    e.stopPropagation();
    setOpen(false);
    setSelected([]);
  }, []);

  const handleSubmit = React.useCallback(
    (e) => {
      e.stopPropagation();
      const list = fields.filter(
        (d, index) => selected.indexOf(`${index}`) !== -1
      );
      onSubmit && onSubmit(list);
      handleClose(e);
    },
    [onSubmit, selected, handleClose, fields]
  );

  const handleCheckbox = React.useCallback((e) => {
    e.stopPropagation();
    const { value } = e.target;
    setSelected((selected) => {
      if (selected.indexOf(value) !== -1) {
        return [...selected.filter((v) => v !== value)];
      } else {
        return [...selected, value];
      }
    });
  }, []);
  return (
    <React.Fragment>
      {iconButton ? (
        <IconButton
          color="primary"
          onClick={handleOpen}
          className={classNames(iconButtonClassName)}
        >
          {icon}
        </IconButton>
      ) : (
        <Button
          id="addField"
          variant="contained"
          color="default"
          startIcon={icon}
          className={buttonClassName}
          onClick={handleOpen}
        >
          {buttonTitle}
        </Button>
      )}
      <Dialog
        fullWidth={true}
        scroll="paper"
        open={open}
        onClose={handleClose}
        aria-labelledby="scroll-dialog-title"
      >
        <DialogTitle id="scroll-dialog-title">Select Fields</DialogTitle>

        <DialogContent dividers={true} classes={{ root: classes.cardContent }}>
          {fields.map((field, i) => (
            <Grid container key={i}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    onChange={handleCheckbox}
                    value={i}
                    checked={selected.indexOf(`${i}`) !== -1}
                  />
                }
                label={
                  <>
                    <Typography className={classes.cardContentItemTitle}>
                      {field.title}
                    </Typography>
                    <Typography className={classes.cardContentItemText}>
                      {field.name}
                    </Typography>
                  </>
                }
              />
            </Grid>
          ))}
          {fields.length === 0 && (
            <Typography className={classes.noFields}>
              No fields available
            </Typography>
          )}
        </DialogContent>
        <CardActions className={classes.cardActionView}>
          <Button
            variant="contained"
            className={classes.save}
            color="primary"
            onClick={handleClose}
          >
            Close
          </Button>
          <Button
            variant="contained"
            className={classes.save}
            color="primary"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </CardActions>
      </Dialog>
    </React.Fragment>
  );
}

const FieldPopover = React.memo(FieldPopoverComponent);

export default FieldPopover;
