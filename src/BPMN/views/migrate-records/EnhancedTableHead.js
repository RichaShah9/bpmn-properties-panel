import React from "react";
import PropTypes from "prop-types";
import {
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
} from "@material-ui/core";

import { translate } from "../../../utils";

export default function EnhancedTableHead(props) {
  const {
    onSelectAllClick,
    isSelectAll,
    fields,
    setSelectedField,
    selectedField,
    searchRecords,
  } = props;

  const getHeight = () => {
    return (
      (document.getElementById("header_title") &&
      document.getElementById("header_title").getBoundingClientRect() && 
      document.getElementById("header_title").getBoundingClientRect().height) ||
      65
    );
  };

  return (
    <TableHead>
      <TableRow id="header_title">
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={isSelectAll}
            checked={isSelectAll}
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
      <TableRow hover key={"search"}>
        <TableCell
          padding="checkbox"
          style={{
            top: getHeight(),
          }}
        ></TableCell>
        {fields &&
          fields.map((field, index) => (
            <TableCell
              key={`${field.title}_${index}_search`}
              style={{
                top: getHeight(),
              }}
            >
              <TextField
                name={
                  field && field.name
                    ? field.targetName
                      ? `${field.name}.${field.targetName}`
                      : field.name
                    : ""
                }
                onFocus={() => setSelectedField(field)}
                onBlur={() => setSelectedField(null)}
                placeholder={
                  (selectedField && selectedField.name) ===
                  (field && field.name)
                    ? "Search"
                    : ""
                }
                size="small"
                InputProps={{ disableUnderline: true }}
                onKeyDown={(e) => searchRecords(e, field)}
              />
            </TableCell>
          ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
};
