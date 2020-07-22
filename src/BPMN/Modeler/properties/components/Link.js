import React from "react";
import classNames from "classnames";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
  },
});

export default function Link({ entry }) {
  const classes = useStyles();
  const { cssClasses, showLink, label } = entry || {};

  return (
    <div className={classes.root}>
      <a
        data-show={showLink ? "showLink" : ""}
        className={classNames("bpp-entry-link", cssClasses ? cssClasses : "")}
        href={label}
      >
        {label}
      </a>
    </div>
  );
}
