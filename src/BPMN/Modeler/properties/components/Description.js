import React from "react";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  desciption: {
    marginTop: 5,
    color: "#999",
  },
});

export default function Description({ desciption }) {
  const classes = useStyles();
  return <div className={classes.desciption}>{desciption}</div>;
}
