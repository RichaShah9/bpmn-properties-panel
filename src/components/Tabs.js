import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Tab as MaterialTab, Tabs as MaterialTabs } from "@material-ui/core";

export const Tabs = withStyles({
  root: {
    borderBottom: "1px solid #e8e8e8",
    minHeight: 30,
    marginTop: 10,
  },
  indicator: {
    backgroundColor: "#52B415",
    top: 0,
  },
})(MaterialTabs);

export const Tab = withStyles((theme) => ({
  root: {
    textTransform: "none",
    minWidth: 72,
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(4),
    padding: 0,
    minHeight: 24,
    "&:hover": {
      color: "#40a9ff",
      opacity: 1,
    },
    "&$selected": {
      color: "#52B415",
      fontWeight: theme.typography.fontWeightMedium,
    },
    "&:focus": {
      color: "#40a9ff",
    },
  },
  selected: {},
}))((props) => <MaterialTab disableRipple {...props} />);
