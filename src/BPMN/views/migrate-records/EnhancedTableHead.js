import React from "react";
import PropTypes from "prop-types";
import { TableCell, TableHead, TableRow, Checkbox } from "@material-ui/core";

import { translate } from "../../../utils";

export default function EnhancedTableHead(props) {
  const { onSelectAllClick, numSelected, rowCount, fields } = props;
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ "aria-label": "select all records" }}
            color="primary"
          />
        </TableCell>
        {fields &&
          fields.map((field) => (
            <TableCell align="left" key={field.name}>
              {field.title ? translate(field.title) : ""}
            </TableCell>
          ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  rowCount: PropTypes.number.isRequired,
};
