import React from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  desciption: {
    marginTop: 5,
    color: "#999",
  },
  error:{
    color: "#CC3333"
  }
});

export default function Description({ desciption, type }) {
  const classes = useStyles();
  return (
    <div className={classnames(classes.desciption, type && classes.error)}>
      {desciption}
    </div>
  );
}
