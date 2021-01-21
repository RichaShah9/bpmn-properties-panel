import React, { useEffect, useState } from "react";
import { TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import Autocomplete from "@material-ui/lab/Autocomplete";
import _uniqueId from "lodash/uniqueId";

import { translate } from "../../../../utils";
import { useDebounce } from "../util";

const useStyles = makeStyles((theme) => ({
  listbox: {
    maxHeight: "300px !important",
  },
}));
export default function AutoComplete(props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState(props.isMulti ? [] : null);
  const [inputValue, setInputValue] = useState("");
  const {
    name,
    value,
    onChange,
    options: flatOptions,
    optionLabelKey = "title",
    optionValueKey = "id",
    isMulti = false,
    title,
    fetchAPI,
    inline,
    InputProps,
    error,
    filterSelectedOptions = false,
    disableCloseOnSelect = true,
    ...other
  } = props;

  const classes = useStyles();

  const findOption = React.useCallback(
    (option) => {
      return (
        flatOptions &&
        flatOptions.find((i) => i && i[optionValueKey] === option.trim())
      );
    },
    [flatOptions, optionValueKey]
  );

  async function onInputChange(value = "") {
    setInputValue(value);
  }

  const delayChange = useDebounce(onInputChange, 400);

  useEffect(() => {
    let active = true;
    if (open) {
      fetchAPI
        ? (async () => {
            const data = await fetchAPI({ search: inputValue });

            if (active) {
              setOptions(data);
            }
          })()
        : setOptions(flatOptions);
    }

    return () => {
      active = false;
    };
  }, [fetchAPI, flatOptions, inputValue, open]);

  useEffect(() => {
    if (typeof value === "string") {
      const values = value.split(",");
      setSelectedValue(
        isMulti ? values.map((v) => findOption(v)) : findOption(values[0])
      );
    } else {
      setSelectedValue(value ? value : isMulti ? [] : null);
    }
  }, [value, isMulti, findOption]);

  function onKeyDown(e) {
    if (e.key === "Backspace") {
      if (selectedValue && selectedValue[optionLabelKey] === inputValue) {
        onChange(null);
      }
    }
  }

  function handleChange(item) {
    if (typeof value === "string") {
      isMulti
        ? onChange(item.map((i) => i && i[optionValueKey]).join(",") || [])
        : onChange(item && item[optionValueKey]);
    } else {
      onChange(item);
    }
  }

  return (
    <Autocomplete
      getOptionSelected={(option, value) => {
        return option[optionValueKey] === value[optionValueKey];
      }}
      getOptionLabel={(option) => {
        return (option && option.type) === "metaJsonModel"
          ? `${option && option[optionLabelKey]} (Custom model)` || ""
          : name === "fieldName"
          ? `${translate(option && option["title"])} (${
              option && option[optionLabelKey]
            })`
          : (option && option[optionLabelKey]) || "";
      }}
      id={_uniqueId("select-widget")}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={
        selectedValue
          ? isMulti
            ? Array.isArray(selectedValue)
              ? selectedValue
              : []
            : selectedValue
          : isMulti
          ? []
          : null
      }
      onChange={(event, newValue) => handleChange(newValue)}
      options={options || []}
      multiple={isMulti}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={(e, value) => delayChange(value)}
      classes={{ option: "menu-item", listbox: classes.listbox }}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            error={error}
            label={inline ? "" : title}
            fullWidth
            onClick={() => setOpen(true)}
            InputProps={{
              ...InputProps,
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
            {...(isMulti ? {} : { onKeyDown: onKeyDown })}
          />
        );
      }}
      {...(isMulti ? { disableCloseOnSelect } : {})}
      {...other}
    />
  );
}
